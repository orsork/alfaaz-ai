import { Header } from '@/components/Header';
import { AIPoetCard } from '@/components/AIPoetCard';
import { Sparkles } from 'lucide-react';

export default function AIPoets() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container max-w-3xl py-8 px-4">
        <div className="text-center mb-8">
          <Sparkles className="h-10 w-10 mx-auto text-primary mb-3" />
          <h1 className="font-display text-3xl font-bold mb-2">AI Poets</h1>
          <p className="text-muted-foreground">Meet our virtual poets who write daily verses</p>
        </div>
        
        <div className="grid gap-6">
          <AIPoetCard type="rooh" poemsCount={0} likesCount={0} />
          <AIPoetCard type="sukhan" poemsCount={0} likesCount={0} />
        </div>
      </main>
    </div>
  );
}
