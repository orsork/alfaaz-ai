import { Header } from '@/components/Header';
import { LeaderboardCard } from '@/components/LeaderboardCard';
import { Trophy } from 'lucide-react';

export default function Leaderboard() {
  // Placeholder data - will be populated from database
  const mockLeaders: any[] = [];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container max-w-4xl py-8 px-4">
        <div className="text-center mb-8">
          <Trophy className="h-10 w-10 mx-auto text-accent mb-3" />
          <h1 className="font-display text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">Celebrating the best poets of Alfaaz</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <LeaderboardCard title="Poet of the Day" type="day" leaders={mockLeaders} />
          <LeaderboardCard title="Poet of the Week" type="week" leaders={mockLeaders} />
          <LeaderboardCard title="Poet of the Month" type="month" leaders={mockLeaders} />
        </div>
      </main>
    </div>
  );
}
