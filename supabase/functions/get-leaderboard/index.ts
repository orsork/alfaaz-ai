import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

interface LeaderboardEntry {
  rank: number;
  profile_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_ai_character: boolean;
  score: number;
  award_date: string;
}

/**
 * Get leaderboard data for a specific type
 */
async function getLeaderboardData(
  supabase: any,
  type: 'day' | 'week' | 'month'
): Promise<LeaderboardEntry[]> {
  // Calculate date range based on type
  const daysBack = type === 'day' ? 1 : type === 'week' ? 7 : 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  // First get all profiles (excluding AI poets)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, user_id, username, display_name, avatar_url, is_ai_character')
    .eq('is_ai_character', false);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return [];
  }

  // Calculate scores for each poet
  const poetScores: Array<{ profile: any; score: number }> = [];

  for (const profile of profiles || []) {
    // Get all poems for this profile with likes_count
    const { data: poems, error: poemsError } = await supabase
      .from('poems')
      .select('likes_count, created_at')
      .eq('author_id', profile.id)
      .gte('created_at', cutoffDate.toISOString());

    if (poemsError) {
      console.error(`Error fetching poems for ${profile.id}:`, poemsError);
      continue;
    }

    // Calculate score (likes - dislikes, weighted by recency)
    let score = 0;
    for (const poem of poems || []) {
      const poemDate = new Date(poem.created_at);
      const daysOld = (cutoffDate.getTime() - poemDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Time decay factor - newer poems worth more
      const timeDecay = Math.max(0.1, 1 - (daysOld / daysBack));
      
      score += (poem.likes_count || 0) * timeDecay;
    }

    // Bonus for number of poems (engagement)
    const poemsCount = poems?.length || 0;
    score += poemsCount * 2; // Each poem gets 2 bonus points

    if (score > 0) {
      poetScores.push({ profile, score });
    }
  }

  // Sort by score descending and format results
  poetScores.sort((a, b) => b.score - a.score);

  return poetScores.slice(0, 10).map((entry, index) => ({
    rank: index + 1,
    profile_id: entry.profile.id,
    username: entry.profile.username,
    display_name: entry.profile.display_name,
    avatar_url: entry.profile.avatar_url,
    is_ai_character: entry.profile.is_ai_character,
    score: Math.round(entry.score),
    award_date: new Date().toISOString().split('T')[0],
  }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'day';

    if (!['day', 'week', 'month'].includes(type)) {
      return new Response(JSON.stringify({
        error: 'Invalid type. Must be day, week, or month'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with anon key (read-only)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });

    const leaderboardData = await getLeaderboardData(supabase, type as 'day' | 'week' | 'month');

    return new Response(JSON.stringify({
      success: true,
      type,
      data: leaderboardData,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-leaderboard function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

