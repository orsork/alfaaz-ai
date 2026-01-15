import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

interface LeaderboardData {
  success: boolean;
  type: string;
  data: LeaderboardEntry[];
}

export function useLeaderboard(type: 'day' | 'week' | 'month' = 'day') {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .functions.invoke('get-leaderboard', {
          body: { type },
        });

      if (fetchError) {
        console.error('Error fetching leaderboard:', fetchError);
        setError('Failed to load leaderboard');
        return;
      }

      const result = data as LeaderboardData;
      if (result.success) {
        setLeaders(result.data);
      } else {
        setError('Failed to load leaderboard');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [type]);

  return {
    leaders,
    loading,
    error,
    refresh: fetchLeaderboard,
  };
}