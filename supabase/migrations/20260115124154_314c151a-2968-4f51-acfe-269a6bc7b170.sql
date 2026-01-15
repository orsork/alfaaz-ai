-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_ai_character BOOLEAN DEFAULT false,
  ai_character_type TEXT CHECK (ai_character_type IN ('rooh', 'sukhan', NULL)),
  poet_of_day_count INTEGER DEFAULT 0,
  poet_of_week_count INTEGER DEFAULT 0,
  poet_of_month_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create poems table
CREATE TABLE public.poems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('hindi', 'english')),
  likes_count INTEGER DEFAULT 0,
  dislikes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create poem_reactions table (private - stores who liked/disliked)
CREATE TABLE public.poem_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poem_id UUID NOT NULL REFERENCES public.poems(id) ON DELETE CASCADE,
  reactor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poem_id, reactor_id)
);

-- Create leaderboard tracking table
CREATE TABLE public.leaderboard_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  award_type TEXT NOT NULL CHECK (award_type IN ('day', 'week', 'month')),
  award_date DATE NOT NULL,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poem_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_awards ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Poems policies
CREATE POLICY "Poems are viewable by everyone"
  ON public.poems FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own poems"
  ON public.poems FOR INSERT
  WITH CHECK (author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own poems"
  ON public.poems FOR UPDATE
  USING (author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own poems"
  ON public.poems FOR DELETE
  USING (author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Poem reactions policies (private - users can only see their own)
CREATE POLICY "Users can view their own reactions"
  ON public.poem_reactions FOR SELECT
  USING (reactor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own reactions"
  ON public.poem_reactions FOR INSERT
  WITH CHECK (reactor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own reactions"
  ON public.poem_reactions FOR UPDATE
  USING (reactor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own reactions"
  ON public.poem_reactions FOR DELETE
  USING (reactor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Leaderboard awards policies
CREATE POLICY "Awards are viewable by everyone"
  ON public.leaderboard_awards FOR SELECT
  USING (true);

-- Function to update poem likes/dislikes count
CREATE OR REPLACE FUNCTION public.update_poem_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE public.poems SET likes_count = likes_count + 1 WHERE id = NEW.poem_id;
    ELSE
      UPDATE public.poems SET dislikes_count = dislikes_count + 1 WHERE id = NEW.poem_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction_type = 'like' THEN
      UPDATE public.poems SET likes_count = likes_count - 1 WHERE id = OLD.poem_id;
    ELSE
      UPDATE public.poems SET dislikes_count = dislikes_count - 1 WHERE id = OLD.poem_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.reaction_type != NEW.reaction_type THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE public.poems SET likes_count = likes_count + 1, dislikes_count = dislikes_count - 1 WHERE id = NEW.poem_id;
    ELSE
      UPDATE public.poems SET likes_count = likes_count - 1, dislikes_count = dislikes_count + 1 WHERE id = NEW.poem_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_poem_reaction_change
  AFTER INSERT OR UPDATE OR DELETE ON public.poem_reactions
  FOR EACH ROW EXECUTE FUNCTION public.update_poem_reaction_counts();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_poems_updated_at
  BEFORE UPDATE ON public.poems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for poems
ALTER PUBLICATION supabase_realtime ADD TABLE public.poems;