import { Header } from '@/components/Header';
import { PoemCard } from '@/components/PoemCard';
import { WritePoemDialog } from '@/components/WritePoemDialog';
import { usePoems } from '@/hooks/usePoems';
import { useAuth } from '@/hooks/useAuth';
import { Feather, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { poems, loading, userReactions, reactToPoem } = usePoems();
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container max-w-2xl py-8 px-4">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <Feather className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Alfaaz
          </h1>
          <p className="text-muted-foreground text-lg mb-6 font-poem italic">
            Where words become art — शब्दों का जहां
          </p>
          
          {user ? (
            <WritePoemDialog />
          ) : (
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
                Join to Share Your Poetry
              </Button>
            </Link>
          )}
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : poems.length === 0 ? (
            <div className="text-center py-12 paper-texture rounded-2xl">
              <Feather className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl mb-2">No poems yet</h3>
              <p className="text-muted-foreground">Be the first to share your alfaaz!</p>
            </div>
          ) : (
            poems.map((poem) => (
              <PoemCard
                key={poem.id}
                poem={poem}
                userReaction={userReactions[poem.id]}
                onReact={reactToPoem}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
