import { Crown, Medal, Award, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Profile } from '@/lib/supabase';

interface LeaderboardCardProps {
  title: string;
  type: 'day' | 'week' | 'month';
  leaders: (Profile & { score: number })[];
}

const icons = {
  day: Crown,
  week: Medal,
  month: Trophy,
};

const colors = {
  day: 'from-amber-400 to-yellow-500',
  week: 'from-slate-300 to-slate-400',
  month: 'from-amber-600 to-orange-500',
};

const badges = {
  day: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  week: 'bg-slate-400/10 text-slate-500 border-slate-400/20',
  month: 'bg-amber-600/10 text-amber-700 border-amber-600/20',
};

export function LeaderboardCard({ title, type, leaders }: LeaderboardCardProps) {
  const Icon = icons[type];

  return (
    <Card className="paper-texture overflow-hidden">
      <div className={cn("h-1 bg-gradient-to-r", colors[type])} />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-display">
          <Icon className={cn(
            "h-5 w-5",
            type === 'day' && "text-amber-500",
            type === 'week' && "text-slate-400",
            type === 'month' && "text-amber-600"
          )} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leaders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No poets yet. Be the first!
          </p>
        ) : (
          <div className="space-y-3">
            {leaders.slice(0, 5).map((leader, index) => (
              <div
                key={leader.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-colors",
                  index === 0 && "bg-muted/50"
                )}
              >
                <span className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold",
                  index === 0 && "bg-gradient-to-r text-white " + colors[type],
                  index === 1 && "bg-slate-200 text-slate-600",
                  index === 2 && "bg-amber-100 text-amber-700",
                  index > 2 && "bg-muted text-muted-foreground"
                )}>
                  {index + 1}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={leader.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {leader.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {leader.display_name || leader.username}
                  </p>
                </div>
                <Badge variant="outline" className={cn("text-xs", badges[type])}>
                  {leader.score} pts
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
