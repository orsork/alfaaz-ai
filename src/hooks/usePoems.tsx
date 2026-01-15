import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Poem, Profile, PoemReaction } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function usePoems() {
  const [poems, setPoems] = useState<(Poem & { profiles: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReactions, setUserReactions] = useState<Record<string, 'like' | 'dislike'>>({});
  const { profile } = useAuth();

  const fetchPoems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('poems')
      .select(`
        *,
        profiles (*)
      `)
      .order('likes_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching poems:', error);
      toast.error('Failed to load poems');
    } else {
      setPoems(data as (Poem & { profiles: Profile })[]);
    }
    setLoading(false);
  };

  const fetchUserReactions = async () => {
    if (!profile) return;
    
    const { data, error } = await supabase
      .from('poem_reactions')
      .select('poem_id, reaction_type')
      .eq('reactor_id', profile.id);

    if (!error && data) {
      const reactionsMap: Record<string, 'like' | 'dislike'> = {};
      data.forEach((reaction) => {
        reactionsMap[reaction.poem_id] = reaction.reaction_type as 'like' | 'dislike';
      });
      setUserReactions(reactionsMap);
    }
  };

  useEffect(() => {
    fetchPoems();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchUserReactions();
    }
  }, [profile]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('poems-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poems'
        },
        () => {
          fetchPoems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createPoem = async (title: string, content: string, language: 'hindi' | 'english') => {
    if (!profile) {
      toast.error('Please sign in to post a poem');
      return false;
    }

    const { error } = await supabase
      .from('poems')
      .insert({
        author_id: profile.id,
        title,
        content,
        language,
      });

    if (error) {
      console.error('Error creating poem:', error);
      toast.error('Failed to post poem');
      return false;
    }

    toast.success('Poem posted successfully!');
    await fetchPoems();
    return true;
  };

  const reactToPoem = async (poemId: string, reactionType: 'like' | 'dislike') => {
    if (!profile) {
      toast.error('Please sign in to react');
      return;
    }

    const existingReaction = userReactions[poemId];

    if (existingReaction === reactionType) {
      // Remove reaction
      const { error } = await supabase
        .from('poem_reactions')
        .delete()
        .eq('poem_id', poemId)
        .eq('reactor_id', profile.id);

      if (!error) {
        setUserReactions(prev => {
          const newReactions = { ...prev };
          delete newReactions[poemId];
          return newReactions;
        });
        await fetchPoems();
      }
    } else if (existingReaction) {
      // Update reaction
      const { error } = await supabase
        .from('poem_reactions')
        .update({ reaction_type: reactionType })
        .eq('poem_id', poemId)
        .eq('reactor_id', profile.id);

      if (!error) {
        setUserReactions(prev => ({ ...prev, [poemId]: reactionType }));
        await fetchPoems();
      }
    } else {
      // Create new reaction
      const { error } = await supabase
        .from('poem_reactions')
        .insert({
          poem_id: poemId,
          reactor_id: profile.id,
          reaction_type: reactionType,
        });

      if (!error) {
        setUserReactions(prev => ({ ...prev, [poemId]: reactionType }));
        await fetchPoems();
      }
    }
  };

  return {
    poems,
    loading,
    userReactions,
    createPoem,
    reactToPoem,
    refreshPoems: fetchPoems,
  };
}
