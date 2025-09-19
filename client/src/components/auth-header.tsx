import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { LogOut, User, Users } from "lucide-react";

type Profile = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  isKids: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export default function AuthHeader() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    localStorage.getItem('selectedProfileId')
  );

  const { data: profiles = [] } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
    enabled: !!user,
  });

  const currentProfile = profiles.find(p => p.id === selectedProfileId);

  const switchProfile = (profileId: string) => {
    localStorage.setItem('selectedProfileId', profileId);
    setSelectedProfileId(profileId);
    window.location.reload(); // Force reload to refresh content with new profile
  };

  if (!user || !currentProfile) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-purple-600">
          StreamFlix
        </Link>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2 text-white hover:bg-gray-800"
                onClick={() => console.log('Botão de perfil clicado!')}
              >
                <Avatar className="w-8 h-8">
                  {currentProfile.avatarUrl ? (
                    <AvatarImage src={currentProfile.avatarUrl} alt={currentProfile.name} className="object-cover" />
                  ) : (
                    <AvatarFallback className="bg-purple-600 text-white text-sm">
                      {currentProfile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="text-sm" data-testid={`text-current-profile-${currentProfile.id}`}>
                  {currentProfile.name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
              <div className="px-2 py-1.5 text-sm text-gray-300">
                Perfis Disponíveis
              </div>
              <DropdownMenuSeparator className="bg-gray-700" />
              
              {profiles.map((profile) => (
                <DropdownMenuItem
                  key={profile.id}
                  onClick={() => switchProfile(profile.id)}
                  className={`cursor-pointer text-gray-300 hover:bg-gray-700 hover:text-white ${
                    profile.id === selectedProfileId ? 'bg-gray-700 text-white' : ''
                  }`}
                  data-testid={`menu-item-profile-${profile.id}`}
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      {profile.avatarUrl ? (
                        <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-purple-600 text-white text-xs">
                          {profile.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span>{profile.name}</span>
                    {profile.isKids && (
                      <span className="text-xs text-purple-400 bg-purple-400/20 px-1.5 py-0.5 rounded">
                        Infantil
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem
                onClick={() => navigate('/profiles')}
                className="cursor-pointer text-gray-300 hover:bg-gray-700 hover:text-white"
                data-testid="menu-item-manage-profiles"
              >
                <Users className="w-4 h-4 mr-2" />
                Gerenciar Perfis
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.location.href = '/api/logout'}
                className="cursor-pointer text-red-400 hover:bg-red-600/20 hover:text-red-300"
                data-testid="menu-item-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}