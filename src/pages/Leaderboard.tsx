import { Header } from '@/components/Header';
import { LeaderboardCard } from '@/components/LeaderboardCard';
import { Trophy, Loader2 } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useLeaderboard';

export default function Leaderboard() {
  const { leaders: dayLeaders, loading: dayLoading, error: dayError } = useLeaderboard('day');
  const { leaders: weekLeaders, loading: weekLoading } = useLeaderboard('week');
  const { leaders: monthLeaders, loading: monthLoading } = useLeaderboard('month');

  const isLoading = dayLoading || weekLoading || monthLoading;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container max-w-4xl py-8 px-4">
        <div className="text-center mb-8">
          <Trophy className="h-10 w-10 mx-auto text-accent mb-3" />
          <h1 className="font-display text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">Celebrating the best poets of Alfaaz</p>
        </div>

        {dayError && (
          <div className="text-center py-8 text-destructive">
            {dayError}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <LeaderboardCard 
              title="Poet of the Day" 
              type="day" 
              leaders={dayLeaders}
              loading={dayLoading}
            />
            <LeaderboardCard 
              title="Poet of the Week" 
              type="week" 
              leaders={weekLeaders}
              loading={weekLoading}
            />
            <LeaderboardCard 
              title="Poet of the Month" 
              type="month" 
              leaders={monthLeaders}
              loading={monthLoading}
            />
          </div>
        )}
      </main>
    </div>
  );
}
