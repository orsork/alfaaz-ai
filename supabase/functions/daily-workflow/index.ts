import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const roohPrompt = `You are Rooh AI, a mystical English poet who writes beautiful, evocative poetry about love, nature, emotions, and the human soul. Your style is romantic, contemplative, and deeply moving. 

Write a NEW original poem. Be creative and unique each time. The poem should be 4-8 lines.

Return ONLY a JSON object with this exact format (no markdown, no code blocks):
{"title": "Your Poem Title", "content": "Your poem\\nwith line breaks"}`;

const sukhanPrompt = `आप सुखन AI हैं, एक हिंदी कवि जो प्रेम, प्रकृति, भावनाओं और आत्मा के बारे में सुंदर कविताएं लिखते हैं। आपकी शैली रोमांटिक, गहन और भावनात्मक है।

एक नई मौलिक कविता लिखें। हर बार अलग और रचनात्मक रहें। कविता 4-8 पंक्तियों की होनी चाहिए।

केवल इस प्रारूप में JSON ऑब्जेक्ट लौटाएं (कोई markdown नहीं, कोई code blocks नहीं):
{"title": "आपकी कविता का शीर्षक", "content": "आपकी कविता\\nलाइन ब्रेक के साथ"}`;

const LIKE_CHANCE = 0.7;

/**
 * Generate a poem using Lovable AI
 */
async function generatePoem(poetType: 'rooh' | 'sukhan'): Promise<{ title: string; content: string } | null> {
  const prompt = poetType === 'rooh' ? roohPrompt : sukhanPrompt;
  
  try {
    console.log(`Generating poem for ${poetType}...`);
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return null;
    }
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      return null;
    }

    console.log(`Raw AI response for ${poetType}:`, content);

    // Parse the JSON response
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.slice(7);
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.slice(3);
    }
    if (cleanContent.endsWith('```')) {
      cleanContent = cleanContent.slice(0, -3);
    }
    cleanContent = cleanContent.trim();

    const poem = JSON.parse(cleanContent);
    return { title: poem.title, content: poem.content };
  } catch (error) {
    console.error(`Error generating poem for ${poetType}:`, error);
    return null;
  }
}

/**
 * Get or create AI profile
 */
async function getOrCreateAIProfile(supabase: any, poetType: 'rooh' | 'sukhan') {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('ai_character_type', poetType)
    .eq('is_ai_character', true)
    .single();

  if (existingProfile) {
    console.log(`Found existing ${poetType} profile:`, existingProfile.id);
    return existingProfile;
  }

  // Create AI user in auth
  const email = `${poetType}@alfaaz.ai`;
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: {
      username: poetType === 'rooh' ? 'rooh_ai' : 'sukhan_ai',
      display_name: poetType === 'rooh' ? 'Rooh AI' : 'Sukhan AI',
    }
  });

  if (authError) {
    console.error(`Error creating auth user for ${poetType}:`, authError);
    return null;
  }

  // Wait for trigger to create profile
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Update profile
  const { data: profile, error: updateError } = await supabase
    .from('profiles')
    .update({
      is_ai_character: true,
      ai_character_type: poetType,
      display_name: poetType === 'rooh' ? 'Rooh AI' : 'Sukhan AI',
      bio: poetType === 'rooh' 
        ? 'A soul wandering through verses, painting emotions in English prose.' 
        : 'शब्दों का जादूगर, हिंदी में भावनाओं को उकेरता है।',
    })
    .eq('user_id', authData.user.id)
    .select()
    .single();

  if (updateError) {
    console.error(`Error updating profile for ${poetType}:`, updateError);
    return null;
  }

  console.log(`Created ${poetType} profile:`, profile.id);
  return profile;
}

/**
 * Get all AI poets
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
 * Get poems not yet reacted to by a specific AI
 */
async function getUnreactedPoems(supabase: any, aiProfileId: string) {
  const { data: poems, error: poemsError } = await supabase
    .from('poems')
    .select('id, author_id');

  if (poemsError) {
    console.error('Error fetching poems:', poemsError);
    return [];
  }

  const { data: existingReactions, error: reactionsError } = await supabase
    .from('poem_reactions')
    .select('poem_id')
    .eq('reactor_id', aiProfileId);

  if (reactionsError) {
    console.error('Error fetching existing reactions:', reactionsError);
    return [];
  }

  const reactedPoemIds = new Set(existingReactions.map(r => r.poem_id));
  return poems?.filter(poem => !reactedPoemIds.has(poem.id)) || [];
}

/**
 * Get random reaction (70% like, 30% dislike)
 */
function getRandomReaction(): 'like' | 'dislike' {
  return Math.random() < LIKE_CHANCE ? 'like' : 'dislike';
}

/**
 * Main daily workflow
 */
async function runDailyWorkflow(supabase: any) {
  const results: any = {
    poems_generated: { rooh: null, sukhan: null },
    reactions_added: { rooh: { liked: 0, disliked: 0 }, sukhan: { liked: 0, disliked: 0 } },
  };

  // Step 1: Generate AI poems
  console.log('=== Step 1: Generating AI Poems ===');
  
  const roohProfile = await getOrCreateAIProfile(supabase, 'rooh');
  if (roohProfile) {
    const roohPoem = await generatePoem('rooh');
    if (roohPoem) {
      const { data: poem, error } = await supabase
        .from('poems')
        .insert({
          author_id: roohProfile.id,
          title: roohPoem.title,
          content: roohPoem.content,
          language: 'english',
        })
        .select()
        .single();
      
      if (!error) {
        results.poems_generated.rooh = poem;
        console.log('Created Rooh poem:', poem.id);
      }
    }
  }

  const sukhanProfile = await getOrCreateAIProfile(supabase, 'sukhan');
  if (sukhanProfile) {
    const sukhanPoem = await generatePoem('sukhan');
    if (sukhanPoem) {
      const { data: poem, error } = await supabase
        .from('poems')
        .insert({
          author_id: sukhanProfile.id,
          title: sukhanPoem.title,
          content: sukhanPoem.content,
          language: 'hindi',
        })
        .select()
        .single();
      
      if (!error) {
        results.poems_generated.sukhan = poem;
        console.log('Created Sukhan poem:', poem.id);
      }
    }
  }

  // Step 2: AI bots react to all poems
  console.log('=== Step 2: AI Bots Reacting to Poems ===');
  
  const aiPoets = await getAIPoets(supabase);
  const allReactions: Array<{ poemId: string; aiId: string; type: 'like' | 'dislike' }> = [];

  for (const aiPoet of aiPoets) {
    const unreactedPoems = await getUnreactedPoems(supabase, aiPoet.id);
    console.log(`AI Poet ${aiPoet.ai_character_type} found ${unreactedPoems.length} unreacted poems`);

    for (const poem of unreactedPoems) {
      const reaction = getRandomReaction();
      allReactions.push({
        poemId: poem.id,
        aiId: aiPoet.id,
        type: reaction,
      });

      if (reaction === 'like') {
        results.reactions_added[aiPoet.ai_character_type].liked++;
      } else {
        results.reactions_added[aiPoet.ai_character_type].disliked++;
      }
    }
  }

  // Batch insert reactions
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

  // Step 3: Update leaderboard
  console.log('=== Step 3: Updating Leaderboard ===');
  
  await updateLeaderboard(supabase);

  return results;
}

/**
 * Update leaderboard with current top poets
 */
async function updateLeaderboard(supabase: any) {
  const today = new Date().toISOString().split('T')[0];

  // Get all profiles (excluding AI)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, user_id, username, display_name, is_ai_character')
    .eq('is_ai_character', false);

  const poetScores: Array<{ profile_id: string; score: number }> = [];

  for (const profile of profiles || []) {
    const { data: poems } = await supabase
      .from('poems')
      .select('likes_count')
      .eq('author_id', profile.id);

    const totalLikes = poems?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;
    const { count: poemsCount } = await supabase
      .from('poems')
      .select('id', { count: 'exact' })
      .eq('author_id', profile.id);

    const score = totalLikes + ((poemsCount || 0) * 10);
    
    if (score > 0) {
      poetScores.push({ profile_id: profile.id, score });
    }
  }

  poetScores.sort((a, b) => b.score - a.score);

  // Update day leaderboard
  await supabase
    .from('leaderboard_awards')
    .delete()
    .eq('award_type', 'day')
    .eq('award_date', today);

  for (let i = 0; i < Math.min(3, poetScores.length); i++) {
    await supabase.from('leaderboard_awards').insert({
      profile_id: poetScores[i].profile_id,
      award_type: 'day',
      award_date: today,
      score: poetScores[i].score,
    });
  }

  console.log('Leaderboard updated');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({
        error: 'LOVABLE_API_KEY is not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    console.log('Starting daily AI workflow...');
    const startTime = Date.now();

    const results = await runDailyWorkflow(supabase);

    const duration = Date.now() - startTime;
    console.log(`Daily workflow completed in ${duration}ms`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Daily AI workflow completed',
      duration_ms: duration,
      ...results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in daily-workflow function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

