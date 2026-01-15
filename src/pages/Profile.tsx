import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Medal, Trophy } from 'lucide-react';

export default function Profile() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading || !profile) return null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container max-w-2xl py-8 px-4">
        <Card className="paper-texture">
          <CardContent className="p-8">
            <div className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl font-display bg-primary/10 text-primary">
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h1 className="font-display text-2xl font-bold">{profile.display_name || profile.username}</h1>
              <p className="text-muted-foreground">@{profile.username}</p>
              
              {profile.bio && <p className="mt-4 text-foreground/80">{profile.bio}</p>}
              
              <div className="flex justify-center gap-4 mt-6">
                {profile.poet_of_day_count > 0 && (
                  <Badge className="badge-gold gap-1"><Crown className="h-3 w-3" />{profile.poet_of_day_count}x Daily</Badge>
                )}
                {profile.poet_of_week_count > 0 && (
                  <Badge variant="secondary" className="gap-1"><Medal className="h-3 w-3" />{profile.poet_of_week_count}x Weekly</Badge>
                )}
                {profile.poet_of_month_count > 0 && (
                  <Badge variant="outline" className="gap-1"><Trophy className="h-3 w-3" />{profile.poet_of_month_count}x Monthly</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
