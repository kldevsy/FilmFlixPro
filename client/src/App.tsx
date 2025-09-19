// Blueprint integration: javascript_log_in_with_replit - App with auth routing
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
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

function AuthenticatedRouter() {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

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

  // If no profile is selected, show profile selection
  if (!selectedProfileId) {
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
