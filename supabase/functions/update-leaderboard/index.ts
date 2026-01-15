import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface LeaderboardEntry {
  profile_id: string;
  score: number;
  rank: number;
}

/**
 * Get top poets for a specific period
 */
async function getTopPoets(
  supabase: any,
  daysBack: number,
  limit: number = 3
): Promise<LeaderboardEntry[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  // Get profiles with their total likes in the time period
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, user_id, username, display_name, is_ai_character')
    .eq('is_ai_character', false); // Exclude AI poets from leaderboard

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }

  const poetScores: Array<{ profile_id: string; score: number }> = [];

  for (const profile of profiles || []) {
    // Sum likes for all poems in the time period
    const { data: poems, error: poemsError } = await supabase
      .from('poems')
      .select('likes_count')
      .eq('author_id', profile.id)
      .gte('created_at', cutoffDate.toISOString());

    if (poemsError) {
      console.error(`Error fetching poems for ${profile.id}:`, poemsError);
      continue;
    }

    const totalLikes = poems?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;
    
    // Also count the number of poems (bonus for being active)
    const { count: poemsCount } = await supabase
      .from('poems')
      .select('id', { count: 'exact' })
      .eq('author_id', profile.id)
      .gte('created_at', cutoffDate.toISOString());

    // Score = likes + (poems_count * 10) - bonus for being active
    const score = totalLikes + ((poemsCount || 0) * 10);

    if (score > 0) {
      poetScores.push({
        profile_id: profile.id,
        score,
      });
    }
  }

  // Sort by score descending and take top N
  poetScores.sort((a, b) => b.score - a.score);

  return poetScores.slice(0, limit).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

/**
 * Award leaderboard badges to top poets
 */
async function awardLeaderboardBadges(
  supabase: any,
  awardType: 'day' | 'week' | 'month',
  topPoets: LeaderboardEntry[]
): Promise<{ awarded: number; errors: string[] }> {
  const today = new Date().toISOString().split('T')[0];
  const errors: string[] = [];
  let awarded = 0;

  // Remove existing awards for today of this type
  await supabase
    .from('leaderboard_awards')
    .delete()
    .eq('award_type', awardType)
    .eq('award_date', today);

  // Insert new awards
  for (const entry of topPoets) {
    const { error } = await supabase
      .from('leaderboard_awards')
      .insert({
        profile_id: entry.profile_id,
        award_type: awardType,
        award_date: today,
        score: entry.score,
      });

    if (error) {
      errors.push(`Error awarding ${awardType} to ${entry.profile_id}: ${error.message}`);
      console.error(error);
    } else {
      awarded++;
    }
  }

  return { awarded, errors };
}

/**
 * Get leaderboard data for frontend
 */
async function getLeaderboardData(supabase: any, awardType: 'day' | 'week' | 'month') {
  const { data: awards, error } = await supabase
    .from('leaderboard_awards')
    .select(`
      *,
      profiles (
        id,
        username,
        display_name,
        avatar_url,
        is_ai_character
      )
    `)
    .eq('award_type', awardType)
    .order('score', { ascending: false });

  if (error) {
    console.error('Error fetching leaderboard data:', error);
    return [];
  }

  return awards?.map((award: any, index: number) => ({
    rank: index + 1,
    profile_id: award.profiles.id,
    username: award.profiles.username,
    display_name: award.profiles.display_name,
    avatar_url: award.profiles.avatar_url,
    is_ai_character: award.profiles.is_ai_character,
    score: award.score,
    award_date: award.award_date,
  })) || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'update';

    // Create Supabase client with service role for admin operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    if (action === 'update') {
      // Update all leaderboards
      console.log('Starting leaderboard update...');

      // Get top poets for each category
      const dayTop = await getTopPoets(supabase, 1, 3); // Last 24 hours
      const weekTop = await getTopPoets(supabase, 7, 3); // Last 7 days
      const monthTop = await getTopPoets(supabase, 30, 3); // Last 30 days

      console.log(`Day top poets: ${dayTop.length}`);
      console.log(`Week top poets: ${weekTop.length}`);
      console.log(`Month top poets: ${monthTop.length}`);

      // Award badges
      const dayResult = await awardLeaderboardBadges(supabase, 'day', dayTop);
      const weekResult = await awardLeaderboardBadges(supabase, 'week', weekTop);
      const monthResult = await awardLeaderboardBadges(supabase, 'month', monthTop);

      return new Response(JSON.stringify({
        success: true,
        message: 'Leaderboard updated successfully',
        results: {
          day: { awarded: dayResult.awarded, errors: dayResult.errors },
          week: { awarded: weekResult.awarded, errors: weekResult.errors },
          month: { awarded: monthResult.awarded, errors: monthResult.errors },
        },
        top_poets: {
          day: dayTop,
          week: weekTop,
          month: monthTop,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'get') {
      // Get leaderboard data
      const type = url.searchParams.get('type') || 'day';
      
      if (!['day', 'week', 'month'].includes(type)) {
        return new Response(JSON.stringify({
          error: 'Invalid type. Must be day, week, or month'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const leaderboardData = await getLeaderboardData(supabase, type as 'day' | 'week' | 'month');

      return new Response(JSON.stringify({
        success: true,
        type,
        data: leaderboardData,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({
        error: 'Invalid action. Use action=update or action=get'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in update-leaderboard function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

