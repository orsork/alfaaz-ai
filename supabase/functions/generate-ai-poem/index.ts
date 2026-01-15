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

async function generatePoem(poetType: 'rooh' | 'sukhan'): Promise<{ title: string; content: string } | null> {
  const prompt = poetType === 'rooh' ? roohPrompt : sukhanPrompt;
  
  try {
    console.log(`Generating poem for ${poetType}...`);
    
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

    // Parse the JSON response, handling potential markdown code blocks
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

async function getOrCreateAIProfile(supabase: any, poetType: 'rooh' | 'sukhan') {
  // Check if AI profile already exists
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

  // Create AI user in auth (using service role)
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

  // Wait a bit for the trigger to create the profile
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Update the profile to mark it as AI
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Create Supabase client with service role for admin operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    const results = { rooh: null as any, sukhan: null as any };

    // Generate poem for Rooh AI (English)
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
        
        if (error) {
          console.error('Error inserting Rooh poem:', error);
        } else {
          results.rooh = poem;
          console.log('Created Rooh poem:', poem.id);
        }
      }
    }

    // Generate poem for Sukhan AI (Hindi)
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
        
        if (error) {
          console.error('Error inserting Sukhan poem:', error);
        } else {
          results.sukhan = poem;
          console.log('Created Sukhan poem:', poem.id);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'AI poems generated successfully',
      poems: results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-ai-poem function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
