import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Leaderboard from "./pages/Leaderboard";
import AIPoets from "./pages/AIPoets";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { IndianFlag } from "@/components/IndianFlag";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/ai-poets" element={<AIPoets />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            {/* Footer with Indian Flag */}
            <footer className="border-t border-border/40 bg-background/80 backdrop-blur-xl mt-auto">
              <div className="container flex flex-col sm:flex-row items-center justify-center gap-3 py-4 px-4">
                <IndianFlag className="h-6 w-auto rounded-sm shadow-sm" />
                <span className="text-sm text-muted-foreground font-medium">
                  Made by Aditi in India 🇮🇳
                </span>
              </div>
            </footer>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

