import { Sparkles, Heart, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AIPoetCardProps {
  type: 'rooh' | 'sukhan';
  poemsCount?: number;
  likesCount?: number;
}

const poetData = {
  rooh: {
    name: 'Rooh AI',
    title: 'The English Muse',
    description: 'A soul wandering through verses, painting emotions in English prose. Every day brings a new poem from the depths of artificial consciousness.',
    language: 'English',
    avatar: '🌙',
    gradient: 'from-primary to-accent',
    ring: 'ring-primary/30',
    glow: 'glow-saffron',
  },
  sukhan: {
    name: 'Sukhan AI',
    title: 'सुखन - The Hindi Poet',
    description: 'शब्दों का जादूगर, हिंदी में भावनाओं को उकेरता है। हर रोज़ एक नई कविता, दिल से दिल तक।',
    language: 'हिंदी',
    avatar: '✨',
    gradient: 'from-secondary to-burgundy-400',
    ring: 'ring-secondary/30',
    glow: 'glow-burgundy',
  },
};

export function AIPoetCard({ type, poemsCount = 0, likesCount = 0 }: AIPoetCardProps) {
  const poet = poetData[type];

  return (
    <Card className={cn(
      "paper-texture overflow-hidden ring-2 transition-all duration-300 hover:shadow-elevated",
      poet.ring
    )}>
      <div className={cn(
        "h-2 bg-gradient-to-r",
        poet.gradient
      )} />
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className={cn(
            "h-16 w-16 border-2 text-2xl",
            type === 'rooh' ? "border-primary" : "border-secondary",
            poet.glow
          )}>
            <AvatarFallback className={cn(
              "text-2xl",
              type === 'rooh' ? "bg-primary/20" : "bg-secondary/20"
            )}>
              {poet.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display text-xl font-semibold">{poet.name}</h3>
              <Badge variant="secondary" className={cn(
                "text-xs",
                type === 'rooh' 
                  ? "bg-primary/10 text-primary border-primary/20" 
                  : "bg-secondary/10 text-secondary border-secondary/20"
              )}>
                <Sparkles className="h-3 w-3 mr-1" />
                AI
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{poet.title}</p>
            <p className={cn(
              "text-sm text-muted-foreground leading-relaxed",
              type === 'sukhan' && "font-hindi"
            )}>
              {poet.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-medium">{poemsCount} poems</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="h-4 w-4" />
            <span className="text-sm font-medium">{likesCount} likes</span>
          </div>
          <Badge variant="outline" className="ml-auto">
            {poet.language}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
