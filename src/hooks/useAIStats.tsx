import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AIStats {
  rooh: {
    poemsCount: number;
    likesCount: number;
    displayName: string;
    username: string;
  };
  sukhan: {
    poemsCount: number;
    likesCount: number;
    displayName: string;
    username: string;
  };
}

export function useAIStats() {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, display_name, ai_character_type')
        .eq('is_ai_character', true);

      if (fetchError) {
        console.error('Error fetching AI profiles:', fetchError);
        setError('Failed to load AI stats');
        return;
      }

      // Fetch poems count and likes for each AI poet
      const aiStats: AIStats = {
        rooh: { poemsCount: 0, likesCount: 0, displayName: 'Rooh AI', username: 'rooh_ai' },
        sukhan: { poemsCount: 0, likesCount: 0, displayName: 'Sukhan AI', username: 'sukhan_ai' },
      };

      for (const profile of data || []) {
        if (profile.ai_character_type && (profile.ai_character_type === 'rooh' || profile.ai_character_type === 'sukhan')) {
          // Get poems count
          const { count: poemsCount } = await supabase
            .from('poems')
            .select('id', { count: 'exact' })
            .eq('author_id', profile.id);

          // Get total likes
          const { data: poems } = await supabase
            .from('poems')
            .select('likes_count')
            .eq('author_id', profile.id);

          const likesCount = poems?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;

          aiStats[profile.ai_character_type] = {
            poemsCount: poemsCount || 0,
            likesCount,
            displayName: profile.display_name || aiStats[profile.ai_character_type].displayName,
            username: profile.username,
          };
        }
      }

      setStats(aiStats);
    } catch (err) {
      console.error('Error fetching AI stats:', err);
      setError('Failed to load AI stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}

