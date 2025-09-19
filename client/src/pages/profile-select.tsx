import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema } from "@shared/schema";
import { z } from "zod";
import { Plus, User, LogOut } from "lucide-react";
import { useLocation } from "wouter";

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
    mutationFn: async (data: { name: string; isKids: boolean }) => {
      const response = await apiRequest('POST', '/api/profiles', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      setShowCreateDialog(false);
      form.reset();
    },
  });

  const selectProfile = (profileId: string) => {
    localStorage.setItem('selectedProfileId', profileId);
    navigate('/');
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {profiles?.map((profile) => (
            <Card 
              key={profile.id} 
              className="bg-gray-800/80 border-gray-700 cursor-pointer hover:bg-gray-700/80 transition-colors"
              onClick={() => selectProfile(profile.id)}
              data-testid={`profile-${profile.id}`}
            >
              <CardContent className="p-6 text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarFallback className="bg-purple-600 text-white text-2xl">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-white font-semibold text-lg" data-testid={`text-profile-name-${profile.id}`}>
                  {profile.name}
                </h3>
                {profile.isKids && (
                  <span className="text-xs text-purple-400 bg-purple-400/20 px-2 py-1 rounded-full mt-2 inline-block">
                    Infantil
                  </span>
                )}
              </CardContent>
            </Card>
          ))}

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Card className="bg-gray-800/80 border-gray-700 border-dashed cursor-pointer hover:bg-gray-700/80 transition-colors">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-20 h-20 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center mb-4">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-gray-300 font-semibold" data-testid="button-add-profile">
                    Adicionar Perfil
                  </h3>
                </CardContent>
              </Card>
            </DialogTrigger>

            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Criar Novo Perfil</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createProfileMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Nome do Perfil</FormLabel>
                        <FormControl>
                          <Input 
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
                    name="isKids"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <input 
                            type="checkbox" 
                            checked={field.value} 
                            onChange={field.onChange}
                            className="w-4 h-4 text-purple-600"
                            data-testid="checkbox-kids-profile"
                          />
                        </FormControl>
                        <FormLabel className="text-white">
                          Perfil Infantil
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateDialog(false)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      data-testid="button-cancel-profile"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-purple-600 hover:bg-purple-700"
                      disabled={createProfileMutation.isPending}
                      data-testid="button-create-profile"
                    >
                      {createProfileMutation.isPending ? "Criando..." : "Criar Perfil"}
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