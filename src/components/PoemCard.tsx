import { Heart, HeartOff, Sparkles, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Poem, Profile } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface PoemCardProps {
  poem: Poem & { profiles: Profile };
  userReaction?: 'like' | 'dislike';
  onReact: (poemId: string, type: 'like' | 'dislike') => void;
  showAuthor?: boolean;
}

export function PoemCard({ poem, userReaction, onReact, showAuthor = true }: PoemCardProps) {
  const isAIPoet = poem.profiles?.is_ai_character;
  const isRooh = poem.profiles?.ai_character_type === 'rooh';
  const isSukhan = poem.profiles?.ai_character_type === 'sukhan';

  return (
    <article
      className={cn(
        "paper-texture rounded-2xl p-6 transition-all duration-300 hover:shadow-elevated animate-fade-in-up",
        isAIPoet && "ring-2",
        isRooh && "ring-primary/30",
        isSukhan && "ring-secondary/30"
      )}
    >
      {/* Author Header */}
      {showAuthor && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className={cn(
              "h-12 w-12 border-2",
              isRooh && "border-primary glow-saffron",
              isSukhan && "border-secondary glow-burgundy",
              !isAIPoet && "border-border"
            )}>
              <AvatarImage src={poem.profiles?.avatar_url || undefined} />
              <AvatarFallback className={cn(
                "font-display text-lg",
                isRooh && "bg-primary/20 text-primary",
                isSukhan && "bg-secondary/20 text-secondary",
                !isAIPoet && "bg-muted"
              )}>
                {poem.profiles?.username?.charAt(0).toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {poem.profiles?.display_name || poem.profiles?.username}
                </span>
                {isAIPoet && (
                  <Badge variant="secondary" className={cn(
                    "text-xs",
                    isRooh && "bg-primary/10 text-primary border-primary/20",
                    isSukhan && "bg-secondary/10 text-secondary border-secondary/20"
                  )}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Poet
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(poem.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {poem.language === 'hindi' ? 'हिंदी' : 'English'}
          </Badge>
        </div>
      )}

      {/* Poem Content */}
      <div className="mb-6">
        <h3 className={cn(
          "text-xl font-display font-semibold mb-3 text-foreground",
          poem.language === 'hindi' && "font-hindi"
        )}>
          {poem.title}
        </h3>
        <div className={cn(
          "text-lg leading-relaxed whitespace-pre-wrap",
          poem.language === 'hindi' ? "font-hindi" : "font-poem italic",
          "text-foreground/90"
        )}>
          {poem.content}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReact(poem.id, 'like')}
          className={cn(
            "gap-2 transition-all duration-200",
            userReaction === 'like' && "text-primary bg-primary/10 hover:bg-primary/20"
          )}
        >
          <Heart className={cn(
            "h-5 w-5 transition-transform",
            userReaction === 'like' && "fill-current scale-110"
          )} />
          <span className="font-medium">{poem.likes_count}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReact(poem.id, 'dislike')}
          className={cn(
            "gap-2 transition-all duration-200",
            userReaction === 'dislike' && "text-destructive bg-destructive/10 hover:bg-destructive/20"
          )}
        >
          <HeartOff className={cn(
            "h-5 w-5 transition-transform",
            userReaction === 'dislike' && "scale-110"
          )} />
          <span className="font-medium">{poem.dislikes_count}</span>
        </Button>
      </div>
    </article>
  );
}
