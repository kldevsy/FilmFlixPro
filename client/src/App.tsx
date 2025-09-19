// Blueprint integration: javascript_log_in_with_replit - App with auth routing
import { Switch, Route } from "wouter";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import ProfileSelect from "@/pages/profile-select";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";

type Profile = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  isKids: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function AuthenticatedRouter() {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  
  // Fetch profiles to check if they exist
  const { data: profiles = [], isLoading: profilesLoading } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
  });

  useEffect(() => {
    const profileId = localStorage.getItem('selectedProfileId');
    setSelectedProfileId(profileId);
    
    // Listen for storage changes to update when profile is selected
    const handleStorageChange = () => {
      const newProfileId = localStorage.getItem('selectedProfileId');
      setSelectedProfileId(newProfileId);
    };
    
    // Custom event listener for when we update localStorage programmatically
    const handleProfileSelection = () => {
      const newProfileId = localStorage.getItem('selectedProfileId');
      setSelectedProfileId(newProfileId);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileSelected', handleProfileSelection);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileSelected', handleProfileSelection);
    };
  }, []);

  // Clean up localStorage if selected profile doesn't exist
  useEffect(() => {
    if (!profilesLoading && selectedProfileId && profiles.length > 0) {
      const profileExists = profiles.some(p => p.id === selectedProfileId);
      if (!profileExists) {
        localStorage.removeItem('selectedProfileId');
        setSelectedProfileId(null);
      }
    }
  }, [profiles, selectedProfileId, profilesLoading]);

  // Show loading while checking profiles
  if (profilesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-lg">Carregando perfis...</div>
      </div>
    );
  }

  // If no profiles exist OR no valid profile is selected, show profile selection
  if (profiles.length === 0 || !selectedProfileId || !profiles.some(p => p.id === selectedProfileId)) {
    return <ProfileSelect />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/profiles" component={ProfileSelect} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  // If user is not authenticated, show auth page
  if (!user) {
    return <Auth />;
  }

  // If user is authenticated, show protected routes
  return <AuthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
