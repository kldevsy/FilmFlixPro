import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema } from "@shared/schema";
import { z } from "zod";
import { Plus, User, LogOut, Camera, Upload, X } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

type Profile = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  isKids: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const createProfileSchema = insertProfileSchema.omit({
  userId: true,
}).extend({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome deve ter no máximo 50 caracteres"),
});

export default function ProfileSelect() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: profiles, isLoading } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
    enabled: !!user,
  });

  const form = useForm({
    resolver: zodResolver(createProfileSchema),
    defaultValues: {
      name: "",
      isKids: false,
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: { name: string; isKids: boolean; avatarUrl?: string }) => {
      const profileData = {
        ...data,
        avatarUrl: uploadedImage || null
      };
      const response = await apiRequest('POST', '/api/profiles', profileData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      setShowCreateDialog(false);
      setUploadedImage(null);
      form.reset();
    },
  });

  const selectProfile = (profileId: string) => {
    localStorage.setItem('selectedProfileId', profileId);
    // Dispatch custom event to notify App component of profile selection
    window.dispatchEvent(new Event('profileSelected'));
    navigate('/');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-lg">Carregando perfis...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Quem está assistindo?</h1>
          <p className="text-gray-300">Selecione um perfil para continuar</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-8">
          {profiles?.map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card 
                className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700 cursor-pointer hover:border-purple-500/50 transition-all duration-300 group overflow-hidden backdrop-blur-sm"
                onClick={() => selectProfile(profile.id)}
                data-testid={`profile-${profile.id}`}
              >
                <CardContent className="p-8 text-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="relative mb-6">
                      <Avatar className="w-24 h-24 mx-auto ring-4 ring-gray-600 group-hover:ring-purple-500/50 transition-all duration-300">
                        {profile.avatarUrl ? (
                          <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-600 text-white text-3xl font-bold">
                            {profile.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2 group-hover:text-purple-300 transition-colors" data-testid={`text-profile-name-${profile.id}`}>
                      {profile.name}
                    </h3>
                    {profile.isKids && (
                      <span className="text-xs text-purple-300 bg-purple-500/30 px-3 py-1.5 rounded-full inline-block font-medium border border-purple-400/30">
                        👶 Perfil Infantil
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: profiles ? profiles.length * 0.1 : 0 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-gray-600 border-dashed cursor-pointer hover:border-purple-500/50 transition-all duration-300 group overflow-hidden backdrop-blur-sm">
                  <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                      <div className="w-24 h-24 border-2 border-dashed border-gray-500 group-hover:border-purple-400 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 bg-gray-800/50 group-hover:bg-purple-500/10">
                        <Plus className="w-10 h-10 text-gray-400 group-hover:text-purple-400 transition-colors duration-300" />
                      </div>
                      <h3 className="text-gray-300 group-hover:text-purple-300 font-bold text-xl transition-colors duration-300" data-testid="button-add-profile">
                        Criar Perfil
                      </h3>
                      <p className="text-gray-500 text-sm mt-2 group-hover:text-purple-400 transition-colors duration-300">
                        Adicione um novo usuário
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </DialogTrigger>

            <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white text-2xl font-bold text-center">
                  ✨ Criar Novo Perfil
                </DialogTitle>
                <p className="text-gray-400 text-center text-sm">
                  Personalize sua experiência no StreamFlix
                </p>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createProfileMutation.mutate(data))} className="space-y-6">
                  
                  {/* Avatar Upload Section */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                      <Avatar className="w-24 h-24 ring-4 ring-gray-600 group-hover:ring-purple-500 transition-all duration-300">
                        {uploadedImage ? (
                          <AvatarImage src={uploadedImage} alt="Preview" className="object-cover" />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-600 text-white text-2xl font-bold">
                            <Camera className="w-8 h-8" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      {uploadedImage && (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-purple-500"
                        data-testid="button-upload-image"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadedImage ? 'Trocar Foto' : 'Adicionar Foto'}
                      </Button>
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white font-medium">Nome do Perfil</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
                            placeholder="Digite o nome do perfil"
                            data-testid="input-profile-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isKids"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-700/30 border border-gray-600 hover:border-purple-500/50 transition-colors">
                          <FormControl>
                            <input 
                              type="checkbox" 
                              checked={field.value} 
                              onChange={field.onChange}
                              className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                              data-testid="checkbox-kids-profile"
                            />
                          </FormControl>
                          <div className="flex-1">
                            <FormLabel className="text-white font-medium">
                              👶 Perfil Infantil
                            </FormLabel>
                            <p className="text-sm text-gray-400 mt-1">
                              Conteúdo adequado para crianças
                            </p>
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex space-x-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateDialog(false);
                        setUploadedImage(null);
                        form.reset();
                      }}
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
                      data-testid="button-cancel-profile"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold"
                      disabled={createProfileMutation.isPending}
                      data-testid="button-create-profile"
                    >
                      {createProfileMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Criando...
                        </>
                      ) : (
                        'Criar Perfil'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/api/logout'}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}