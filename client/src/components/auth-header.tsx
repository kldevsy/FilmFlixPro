import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogOut, User, Users, Settings, ChevronDown, Sparkles, Shield, Bell, Clock, CheckCircle, Trash2 } from "lucide-react";

import type { Notification } from "@shared/schema";

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
  const { isAdmin } = useAdmin();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    localStorage.getItem('selectedProfileId')
  );

  const { data: profiles = [] } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
    enabled: !!user,
  });

  // Fetch user notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/user/notifications'],
    enabled: !!user,
  });

  // Get unread notifications count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const currentProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0];

  const switchProfile = (profileId: string) => {
    localStorage.setItem('selectedProfileId', profileId);
    setSelectedProfileId(profileId);
    window.location.reload(); // Force reload to refresh content with new profile
  };

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest('PUT', `/api/user/notifications/${notificationId}/read`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/notifications'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao marcar notificação como lida",
        variant: "destructive",
      });
    },
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/user/notifications/read-all', {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/notifications'] });
      toast({
        title: "Sucesso",
        description: "Todas as notificações foram marcadas como lidas",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao marcar todas as notificações como lidas",
        variant: "destructive",
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest('DELETE', `/api/user/notifications/${notificationId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/notifications'] });
      toast({
        title: "Sucesso",
        description: "Notificação excluída",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao excluir notificação",
        variant: "destructive",
      });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    setIsNotificationDropdownOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'subscription_expiring':
      case 'subscription_expired':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'payment_failed':
        return <Clock className="w-4 h-4 text-red-400" />;
      case 'welcome':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return 'Agora mesmo';
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  if (!user || !currentProfile || profiles.length === 0) {
    return null;
  }

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-b border-gray-800/50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            StreamFlix
          </Link>
        </motion.div>

        <div className="flex items-center space-x-4">
          {/* Notifications Dropdown */}
          <DropdownMenu open={isNotificationDropdownOpen} onOpenChange={setIsNotificationDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="relative p-2 text-white hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-pink-600/20 rounded-xl transition-all duration-300 border border-transparent hover:border-purple-500/30 shadow-lg hover:shadow-purple-500/20"
                  data-testid="button-notifications"
                >
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -5, 5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Bell className="w-5 h-5" />
                  </motion.div>
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1"
                    >
                      <Badge 
                        variant="destructive" 
                        className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-gradient-to-r from-red-500 to-pink-500 border-none"
                        data-testid={`badge-unread-count-${unreadCount}`}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-96 bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 border border-gray-700/50 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden" 
              align="end"
              sideOffset={8}
            >
              {/* Header */}
              <div className="px-4 py-4 border-b border-gray-700/50 bg-gradient-to-r from-purple-600/10 to-pink-600/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold text-base flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-400" />
                    Notificações
                  </h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAllAsReadMutation.mutate()}
                      className="text-xs text-purple-300 hover:text-white hover:bg-purple-600/20 rounded-lg p-2"
                      disabled={markAllAsReadMutation.isPending}
                      data-testid="button-mark-all-read"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Marcar todas como lidas
                    </Button>
                  )}
                </div>
                {unreadCount > 0 && (
                  <p className="text-purple-300 text-sm mt-1">
                    {unreadCount} notificação{unreadCount !== 1 ? 'ões' : ''} não lida{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Notifications List */}
              <ScrollArea className="h-96">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Nenhuma notificação ainda</p>
                    <p className="text-gray-500 text-xs mt-1">Você será notificado sobre atualizações importantes</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.01 }}
                        className={`mx-3 my-1 p-3 rounded-xl cursor-pointer transition-all duration-300 group relative ${
                          notification.isRead 
                            ? 'hover:bg-gray-700/30 text-gray-400' 
                            : 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 text-white border border-purple-500/20'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                        data-testid={`notification-${notification.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`font-medium text-sm line-clamp-1 ${
                                notification.isRead ? 'text-gray-300' : 'text-white'
                              }`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`text-xs ${
                                  notification.isRead ? 'text-gray-500' : 'text-purple-300'
                                }`}>
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotificationMutation.mutate(notification.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto w-auto hover:bg-red-500/20 hover:text-red-400 rounded"
                                  data-testid={`button-delete-notification-${notification.id}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <p className={`text-xs mt-1 line-clamp-2 ${
                              notification.isRead ? 'text-gray-500' : 'text-gray-300'
                            }`}>
                              {notification.message}
                            </p>
                            {!notification.isRead && (
                              <div className="absolute top-2 left-2 w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Button 
                  variant="ghost" 
                  className="group flex items-center space-x-3 text-white hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-pink-600/20 rounded-xl px-4 py-2 transition-all duration-300 border border-transparent hover:border-purple-500/30 shadow-lg hover:shadow-purple-500/20"
                  data-testid="button-profile-menu"
                >
                  <motion.div
                    whileHover={{ rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Avatar className="w-9 h-9 ring-2 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all duration-300">
                      {currentProfile.avatarUrl ? (
                        currentProfile.avatarUrl.startsWith('data:video/') ? (
                          <video 
                            src={currentProfile.avatarUrl} 
                            className="w-full h-full object-cover rounded-full" 
                            muted 
                            loop 
                            playsInline 
                            autoPlay
                          />
                        ) : (
                          <AvatarImage src={currentProfile.avatarUrl} alt={currentProfile.name} className="object-cover" />
                        )
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-sm font-semibold">
                          {currentProfile.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </motion.div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors" data-testid={`text-current-profile-${currentProfile.id}`}>
                      {currentProfile.name}
                    </span>
                    <span className="text-xs text-purple-400 font-medium">Perfil ativo</span>
                  </div>
                  <motion.div
                    animate={{ rotate: 0 }}
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-4 h-4 ml-1 text-purple-400 group-hover:text-purple-300 transition-colors" />
                  </motion.div>
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-80 bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 border border-gray-700/50 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden" 
              align="end"
              sideOffset={8}
            >
              {/* Perfil Atual */}
              <motion.div 
                className="px-4 py-4 border-b border-gray-700/50 bg-gradient-to-r from-purple-600/10 to-pink-600/10"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center space-x-4">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Avatar className="w-12 h-12 ring-2 ring-purple-500/30 shadow-lg">
                      {currentProfile.avatarUrl ? (
                        currentProfile.avatarUrl.startsWith('data:video/') ? (
                          <video 
                            src={currentProfile.avatarUrl} 
                            className="w-full h-full object-cover rounded-full" 
                            muted 
                            loop 
                            playsInline 
                            autoPlay
                          />
                        ) : (
                          <AvatarImage src={currentProfile.avatarUrl} alt={currentProfile.name} className="object-cover" />
                        )
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-base font-bold">
                          {currentProfile.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-base flex items-center gap-2">
                      {currentProfile.name}
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </p>
                    <p className="text-purple-300 text-sm font-medium">Perfil ativo</p>
                  </div>
                </div>
              </motion.div>

              {/* Outros Perfis Disponíveis */}
              {profiles.length > 1 && (
                <>
                  <motion.div 
                    className="px-4 py-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      Trocar Perfil
                    </p>
                  </motion.div>
                  {profiles
                    .filter(profile => profile.id !== selectedProfileId)
                    .map((profile, index) => (
                      <motion.div
                        key={profile.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <DropdownMenuItem
                          onClick={() => switchProfile(profile.id)}
                          className="cursor-pointer text-gray-300 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-pink-600/20 hover:text-white mx-3 my-1 rounded-xl transition-all duration-300 p-3 group"
                          data-testid={`menu-item-profile-${profile.id}`}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <motion.div
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.5 }}
                            >
                              <Avatar className="w-9 h-9 ring-1 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all duration-300">
                                {profile.avatarUrl ? (
                                  <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                                ) : (
                                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-sm font-semibold">
                                    {profile.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                            </motion.div>
                            <div className="flex-1">
                              <span className="text-sm font-medium">{profile.name}</span>
                              {profile.isKids && (
                                <motion.span 
                                  className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full ml-2 inline-block"
                                  whileHover={{ scale: 1.1 }}
                                >
                                  Infantil
                                </motion.span>
                              )}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      </motion.div>
                    ))}
                  <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-gray-700 to-transparent mx-4 my-2" />
                </>
              )}
              
              {/* Opções do Menu */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="py-2"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <DropdownMenuItem
                    onClick={() => navigate('/profiles')}
                    className="cursor-pointer text-gray-300 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-cyan-600/20 hover:text-white mx-3 my-1 rounded-xl transition-all duration-300 p-3 group"
                    data-testid="menu-item-manage-profiles"
                  >
                    <motion.div
                      whileHover={{ rotate: 15 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Users className="w-5 h-5 mr-3 text-blue-400 group-hover:text-blue-300" />
                    </motion.div>
                    <span className="font-medium">Gerenciar Perfis</span>
                  </DropdownMenuItem>
                </motion.div>

                {isAdmin && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <DropdownMenuItem
                      onClick={() => navigate('/admin')}
                      className="cursor-pointer text-gray-300 hover:bg-gradient-to-r hover:from-orange-600/20 hover:to-red-600/20 hover:text-white mx-3 my-1 rounded-xl transition-all duration-300 p-3 group"
                      data-testid="menu-item-admin"
                    >
                      <motion.div
                        whileHover={{ rotate: 15 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Shield className="w-5 h-5 mr-3 text-orange-400 group-hover:text-orange-300" />
                      </motion.div>
                      <span className="font-medium">Administração</span>
                    </DropdownMenuItem>
                  </motion.div>
                )}

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <DropdownMenuItem
                    onClick={() => navigate('/settings')}
                    className="cursor-pointer text-gray-300 hover:bg-gradient-to-r hover:from-emerald-600/20 hover:to-teal-600/20 hover:text-white mx-3 my-1 rounded-xl transition-all duration-300 p-3 group"
                    data-testid="menu-item-settings"
                  >
                    <motion.div
                      whileHover={{ rotate: 90 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Settings className="w-5 h-5 mr-3 text-emerald-400 group-hover:text-emerald-300" />
                    </motion.div>
                    <span className="font-medium">Configurações</span>
                  </DropdownMenuItem>
                </motion.div>
              </motion.div>

              <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-gray-700 to-transparent mx-4 my-2" />
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="pb-2"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <DropdownMenuItem
                    onClick={() => window.location.href = '/api/logout'}
                    className="cursor-pointer text-red-400 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-pink-600/20 hover:text-red-300 mx-3 my-1 rounded-xl transition-all duration-300 p-3 group border border-transparent hover:border-red-500/30"
                    data-testid="menu-item-logout"
                  >
                    <motion.div
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <LogOut className="w-5 h-5 mr-3 text-red-400 group-hover:text-red-300" />
                    </motion.div>
                    <span className="font-medium">Sair</span>
                  </DropdownMenuItem>
                </motion.div>
              </motion.div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}