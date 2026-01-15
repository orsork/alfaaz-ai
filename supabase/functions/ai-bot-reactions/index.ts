import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Threshold to determine like vs dislike (70% likes, 30% dislikes)
const LIKE_CHANCE = 0.7;

/**
 * Get all AI poet profiles (Rooh and Sukhan)
 */
async function getAIPoets(supabase: any) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, ai_character_type')
    .eq('is_ai_character', true);

  if (error) {
    console.error('Error fetching AI poets:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all poems that haven't been reacted to by a specific AI poet
 */
async function getUnreactedPoems(supabase: any, aiProfileId: string) {
  // Get all poems with author info
  const { data: poems, error: poemsError } = await supabase
    .from('poems')
    .select(`
      id,
      author_id,
      language,
      profiles!poems_author_id_fkey (is_ai_character, ai_character_type)
    `);

  if (poemsError) {
    console.error('Error fetching poems:', poemsError);
    return [];
  }

  // Get existing reactions by this AI poet
  const { data: existingReactions, error: reactionsError } = await supabase
    .from('poem_reactions')
    .select('poem_id')
    .eq('reactor_id', aiProfileId);

  if (reactionsError) {
    console.error('Error fetching existing reactions:', reactionsError);
    return [];
  }

  const reactedPoemIds = new Set(existingReactions.map(r => r.poem_id));

  // Filter poems that haven't been reacted to by this AI
  const unreactedPoems = poems?.filter(poem => !reactedPoemIds.has(poem.id)) || [];

  return unreactedPoems;
}

/**
 * Assign random reaction to a poem
 */
function getRandomReaction(): 'like' | 'dislike' {
  return Math.random() < LIKE_CHANCE ? 'like' : 'dislike';
}

/**
 * Add reaction to a poem for an AI poet
 */
async function addReaction(supabase: any, poemId: string, aiProfileId: string, reactionType: 'like' | 'dislike') {
  const { error } = await supabase
    .from('poem_reactions')
    .insert({
      poem_id: poemId,
      reactor_id: aiProfileId,
      reaction_type: reactionType,
    });

  if (error) {
    console.error(`Error adding reaction to poem ${poemId}:`, error);
    return false;
  }

  return true;
}

/**
 * Main function to process AI bot reactions
 */
async function processAIBotReactions(supabase: any, aiPoets: any[]) {
  const results: Record<string, { liked: number; disliked: number }> = {};
  const allReactions: Array<{ poemId: string; aiId: string; type: 'like' | 'dislike' }> = [];

  for (const aiPoet of aiPoets) {
    results[aiPoet.ai_character_type] = { liked: 0, disliked: 0 };
    
    const unreactedPoems = await getUnreactedPoems(supabase, aiPoet.id);
    console.log(`AI Poet ${aiPoet.ai_character_type} found ${unreactedPoems.length} unreacted poems`);

    for (const poem of unreactedPoems) {
      // AI bots randomly react to all poems (including own and each other's)
      // They don't actually read/judge - just random reaction
      const reaction = getRandomReaction();
      
      allReactions.push({
        poemId: poem.id,
        aiId: aiPoet.id,
        type: reaction,
      });

      if (reaction === 'like') {
        results[aiPoet.ai_character_type].liked++;
      } else {
        results[aiPoet.ai_character_type].disliked++;
      }
    }
  }

  // Batch insert all reactions for better performance
  if (allReactions.length > 0) {
    const { error: insertError } = await supabase
      .from('poem_reactions')
      .insert(
        allReactions.map(r => ({
          poem_id: r.poemId,
          reactor_id: r.aiId,
          reaction_type: r.type,
        }))
      );

    if (insertError) {
      console.error('Error batch inserting reactions:', insertError);
    } else {
      console.log(`Successfully added ${allReactions.length} reactions`);
    }
  }

  return results;
}

/**
 * Get AI poet statistics
 */
async function getAIStats(supabase: any) {
  const { data: stats, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      display_name,
      ai_character_type,
      profiles!poems_author_id_fkey (
        likes_count
      )
    `)
    .eq('is_ai_character', true);

  if (error) {
    console.error('Error fetching AI stats:', error);
    return {};
  }

  const statsMap: Record<string, { poemsCount: number; likesCount: number }> = {};

  for (const profile of stats || []) {
    if (profile.ai_character_type) {
      // Count poems and likes for this AI poet
      const poemsResult = await supabase
        .from('poems')
        .select('id', { count: 'exact' })
        .eq('author_id', profile.id);

      const likesResult = await supabase
        .from('poems')
        .select('likes_count')
        .eq('author_id', profile.id);

      const poemsCount = poemsResult.count || 0;
      const likesCount = likesResult.data?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;

      statsMap[profile.ai_character_type] = {
        poemsCount,
        likesCount,
      };
    }
  }

  return statsMap;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for admin operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    // Get AI poets
    const aiPoets = await getAIPoets(supabase);
    
    if (aiPoets.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No AI poets found',
        reactions_added: {},
        ai_stats: {},
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${aiPoets.length} AI poets:`, aiPoets.map(p => p.ai_character_type));

    // Process reactions
    const reactionsResults = await processAIBotReactions(supabase, aiPoets);

    // Get updated stats
    const aiStats = await getAIStats(supabase);

    return new Response(JSON.stringify({
      success: true,
      message: 'AI bot reactions processed successfully',
      reactions_added: reactionsResults,
      ai_stats: aiStats,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-bot-reactions function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

