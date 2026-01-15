import { supabase } from "@/integrations/supabase/client";

export { supabase };

// Types for our database
export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_ai_character: boolean;
  ai_character_type: 'rooh' | 'sukhan' | null;
  poet_of_day_count: number;
  poet_of_week_count: number;
  poet_of_month_count: number;
  created_at: string;
  updated_at: string;
}

export interface Poem {
  id: string;
  author_id: string;
  title: string;
  content: string;
  language: 'hindi' | 'english';
  likes_count: number;
  dislikes_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface PoemReaction {
  id: string;
  poem_id: string;
  reactor_id: string;
  reaction_type: 'like' | 'dislike';
  created_at: string;
}

export interface LeaderboardAward {
  id: string;
  profile_id: string;
  award_type: 'day' | 'week' | 'month';
  award_date: string;
  score: number;
  created_at: string;
  profiles?: Profile;
}
