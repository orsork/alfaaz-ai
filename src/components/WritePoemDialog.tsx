import { useState } from 'react';
import { PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePoems } from '@/hooks/usePoems';
import { toast } from 'sonner';

export function WritePoemDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState<'hindi' | 'english'>('english');
  const [loading, setLoading] = useState(false);
  const { createPoem } = usePoems();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please add a title for your poem');
      return;
    }
    
    if (!content.trim()) {
      toast.error('Please write your poem');
      return;
    }

    setLoading(true);
    const success = await createPoem(title.trim(), content.trim(), language);
    setLoading(false);

    if (success) {
      setTitle('');
      setContent('');
      setLanguage('english');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <PenLine className="h-5 w-5" />
          Write a Poem
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg paper-texture">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Share Your Alfaaz</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your poem a name..."
              className="font-display text-lg"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as 'hindi' | 'english')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="hindi">हिंदी (Hindi)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Your Poem</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={language === 'hindi' 
                ? "अपनी कविता यहाँ लिखें..."
                : "Let your words flow here..."
              }
              className={`min-h-[200px] text-lg ${language === 'hindi' ? 'font-hindi' : 'font-poem'}`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground"
            >
              {loading ? 'Posting...' : 'Post Poem'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
