import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { LogOut, User, Users, Settings, ChevronDown } from "lucide-react";

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

  const currentProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0];

  console.log('Debug AuthHeader:', { 
    user: !!user, 
    profiles: profiles.length, 
    selectedProfileId, 
    currentProfile: !!currentProfile 
  });

  const switchProfile = (profileId: string) => {
    localStorage.setItem('selectedProfileId', profileId);
    setSelectedProfileId(profileId);
    window.location.reload(); // Force reload to refresh content with new profile
  };

  if (!user || !currentProfile || profiles.length === 0) {
    console.log('AuthHeader not rendering because:', { user: !!user, currentProfile: !!currentProfile, profilesLength: profiles.length });
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
                className="flex items-center space-x-2 text-white hover:bg-gray-800/60 rounded-lg px-3 py-2 transition-colors"
                data-testid="button-profile-menu"
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
                <span className="text-sm font-medium" data-testid={`text-current-profile-${currentProfile.id}`}>
                  {currentProfile.name}
                </span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-gray-900 border-gray-700 shadow-xl" align="end">
              {/* Perfil Atual */}
              <div className="px-3 py-2 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    {currentProfile.avatarUrl ? (
                      <AvatarImage src={currentProfile.avatarUrl} alt={currentProfile.name} className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-purple-600 text-white text-sm">
                        {currentProfile.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-white font-medium text-sm">{currentProfile.name}</p>
                    <p className="text-gray-400 text-xs">Perfil ativo</p>
                  </div>
                </div>
              </div>

              {/* Outros Perfis Disponíveis */}
              {profiles.length > 1 && (
                <>
                  <div className="px-3 py-2">
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                      Trocar Perfil
                    </p>
                  </div>
                  {profiles
                    .filter(profile => profile.id !== selectedProfileId)
                    .map((profile) => (
                      <DropdownMenuItem
                        key={profile.id}
                        onClick={() => switchProfile(profile.id)}
                        className="cursor-pointer text-gray-300 hover:bg-gray-800 hover:text-white mx-2 rounded-md"
                        data-testid={`menu-item-profile-${profile.id}`}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <Avatar className="w-8 h-8">
                            {profile.avatarUrl ? (
                              <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                            ) : (
                              <AvatarFallback className="bg-purple-600 text-white text-xs">
                                {profile.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <span className="text-sm">{profile.name}</span>
                            {profile.isKids && (
                              <span className="text-xs text-purple-400 bg-purple-400/20 px-1.5 py-0.5 rounded ml-2">
                                Infantil
                              </span>
                            )}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  <DropdownMenuSeparator className="bg-gray-700 mx-2" />
                </>
              )}
              
              {/* Opções do Menu */}
              <DropdownMenuItem
                onClick={() => navigate('/profiles')}
                className="cursor-pointer text-gray-300 hover:bg-gray-800 hover:text-white mx-2 rounded-md"
                data-testid="menu-item-manage-profiles"
              >
                <Users className="w-4 h-4 mr-3" />
                <span>Gerenciar Perfis</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/settings')}
                className="cursor-pointer text-gray-300 hover:bg-gray-800 hover:text-white mx-2 rounded-md"
                data-testid="menu-item-settings"
              >
                <Settings className="w-4 h-4 mr-3" />
                <span>Configurações</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-700 mx-2" />
              
              <DropdownMenuItem
                onClick={() => window.location.href = '/api/logout'}
                className="cursor-pointer text-red-400 hover:bg-red-600/20 hover:text-red-300 mx-2 rounded-md"
                data-testid="menu-item-logout"
              >
                <LogOut className="w-4 h-4 mr-3" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}