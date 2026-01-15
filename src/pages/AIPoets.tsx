import { Header } from '@/components/Header';
import { AIPoetCard } from '@/components/AIPoetCard';
import { Sparkles, Loader2 } from 'lucide-react';
import { useAIStats } from '@/hooks/useAIStats';

export default function AIPoets() {
  const { stats, loading, error } = useAIStats();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container max-w-3xl py-8 px-4">
        <div className="text-center mb-8">
          <Sparkles className="h-10 w-10 mx-auto text-primary mb-3" />
          <h1 className="font-display text-3xl font-bold mb-2">AI Poets</h1>
          <p className="text-muted-foreground">Meet our virtual poets who write daily verses</p>
        </div>

        {error && (
          <div className="text-center py-8 text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6">
            <AIPoetCard 
              type="rooh" 
              poemsCount={stats?.rooh.poemsCount || 0}
              likesCount={stats?.rooh.likesCount || 0}
            />
            <AIPoetCard 
              type="sukhan" 
              poemsCount={stats?.sukhan.poemsCount || 0}
              likesCount={stats?.sukhan.likesCount || 0}
            />
          </div>
        )}
      </main>
    </div>
  );
}
