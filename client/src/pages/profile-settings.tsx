import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, User, Save, ArrowLeft, Trash2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertProfileSchema } from "@shared/schema";

const profileSettingsSchema = insertProfileSchema.omit({
  userId: true,
}).extend({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome deve ter no máximo 50 caracteres"),
  language: z.string().optional(),
});

type ProfileSettingsFormData = z.infer<typeof profileSettingsSchema>;

interface Profile {
  id: string;
  name: string;
  avatarUrl?: string | null;
  isKids: boolean;
  language?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function ProfileSettings() {
  const { toast } = useToast();
  const [uploadedMedia, setUploadedMedia] = useState<{ dataUrl: string; mimeType: string } | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current profile ID from localStorage
  const selectedProfileId = localStorage.getItem('selectedProfileId');

  // Fetch current profile data
  const { data: profiles = [], isLoading: profilesLoading } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
  });

  const currentProfile = profiles.find(p => p.id === selectedProfileId);

  // Setup form
  const form = useForm<ProfileSettingsFormData>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      name: currentProfile?.name || "",
      isKids: Boolean(currentProfile?.isKids),
      language: currentProfile?.language || "pt-BR",
      avatarUrl: currentProfile?.avatarUrl || "",
    },
  });

  // Reset form when profile data is loaded
  useEffect(() => {
    if (currentProfile) {
      form.reset({
        name: currentProfile.name || "",
        isKids: Boolean(currentProfile.isKids),
        language: currentProfile.language || "pt-BR",
        avatarUrl: currentProfile.avatarUrl || "",
      });
    }
  }, [currentProfile, form]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileSettingsFormData & { id: string }) => {
      const { id, ...profileData } = data;
      
      // Include uploaded media in the data if present
      if (uploadedMedia) {
        profileData.avatarUrl = uploadedMedia.dataUrl;
      } else if (avatarRemoved) {
        profileData.avatarUrl = null;
      }
      
      const response = await apiRequest('PUT', `/api/profiles/${id}`, profileData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      setUploadedMedia(null);
      setAvatarRemoved(false);
      toast({
        title: "Sucesso!",
        description: "Perfil atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Profile update error:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const validateVideoDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      let objectUrl: string | null = null;
      
      const cleanup = () => {
        if (objectUrl) {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch (error) {
            console.warn('Error revoking object URL:', error);
          }
        }
      };
      
      video.addEventListener('loadedmetadata', () => {
        cleanup();
        const duration = video.duration;
        resolve(duration <= 5); // 5 seconds max
      });
      
      video.addEventListener('error', () => {
        cleanup();
        resolve(false);
      });
      
      try {
        objectUrl = URL.createObjectURL(file);
        video.src = objectUrl;
      } catch (error) {
        cleanup();
        resolve(false);
      }
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem ou vídeo.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive",
      });
      return;
    }

    if (isVideo) {
      const isValidDuration = await validateVideoDuration(file);
      if (!isValidDuration) {
        toast({
          title: "Vídeo muito longo",
          description: "Vídeos devem ter no máximo 5 segundos.",
          variant: "destructive",
        });
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUploadedMedia({
        dataUrl,
        mimeType: file.type
      });
      setAvatarRemoved(false);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setUploadedMedia(null);
    setAvatarRemoved(true);
  };

  const onSubmit = (data: ProfileSettingsFormData) => {
    if (currentProfile) {
      updateProfileMutation.mutate({
        ...data,
        id: currentProfile.id
      });
    }
  };

  if (!selectedProfileId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
        <div className="container mx-auto max-w-2xl">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Nenhum perfil selecionado</h2>
              <p className="text-gray-400 mb-6">
                Você precisa selecionar um perfil antes de acessar as configurações.
              </p>
              <Link href="/profiles">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Selecionar Perfil
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (profilesLoading || !currentProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
        <div className="container mx-auto max-w-2xl">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-purple-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-400">Carregando configurações do perfil...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto p-6 max-w-4xl">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Configurações do Perfil</h1>
              <p className="text-gray-400">Edite suas informações pessoais</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-purple-600 text-white">
            {currentProfile.name}
          </Badge>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <User className="w-6 h-6 text-purple-500" />
                Informações do Perfil
              </CardTitle>
              <CardDescription className="text-gray-400">
                Mantenha suas informações atualizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  
                  {/* Avatar Section */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium">Avatar do Perfil</label>
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        <Avatar className="w-24 h-24 ring-4 ring-gray-600 group-hover:ring-purple-500 transition-all duration-300">
                          {uploadedMedia ? (
                            uploadedMedia.mimeType.startsWith('video/') ? (
                              <video 
                                src={uploadedMedia.dataUrl} 
                                className="w-full h-full object-cover rounded-full" 
                                muted 
                                loop 
                                playsInline 
                                autoPlay
                              />
                            ) : (
                              <AvatarImage src={uploadedMedia.dataUrl} alt="Preview" className="object-cover" />
                            )
                          ) : currentProfile.avatarUrl && !avatarRemoved ? (
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
                              <AvatarImage src={currentProfile.avatarUrl} alt="Current avatar" className="object-cover" />
                            )
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-2xl font-bold">
                              {currentProfile.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Alterar Avatar
                          </Button>
                          
                          {(currentProfile.avatarUrl || uploadedMedia) && !avatarRemoved && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={removeAvatar}
                              className="bg-red-600 border-red-500 hover:bg-red-700 text-white"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remover
                            </Button>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500">
                          Aceita imagens (JPG, PNG, GIF) ou vídeos (até 5s, máx 10MB)
                        </p>
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Perfil</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Digite o nome do perfil"
                              {...field}
                              className="bg-gray-700 border-gray-600 text-white"
                              data-testid="input-profile-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Idioma Preferido</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "pt-BR"}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-700 border-gray-600" data-testid="select-language">
                                <SelectValue placeholder="Selecione o idioma" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                              <SelectItem value="en-US">English (US)</SelectItem>
                              <SelectItem value="es-ES">Español</SelectItem>
                              <SelectItem value="fr-FR">Français</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="bg-gray-700" />

                  {/* Profile Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Configurações do Perfil</h3>
                    
                    <FormField
                      control={form.control}
                      name="isKids"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Perfil Infantil
                            </FormLabel>
                            <div className="text-sm text-gray-400">
                              Ativar controles parentais e conteúdo adequado para crianças
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={Boolean(field.value)}
                              onCheckedChange={field.onChange}
                              data-testid="switch-kids-profile"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="bg-gray-700" />

                  {/* Actions */}
                  <div className="flex justify-end gap-4 pt-4">
                    <Link href="/">
                      <Button variant="outline" className="bg-gray-700 border-gray-600 hover:bg-gray-600">
                        Cancelar
                      </Button>
                    </Link>
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700"
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}