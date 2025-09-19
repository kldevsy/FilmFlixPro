import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { Link } from "wouter";

type Content = {
  id: string;
  title: string;
  description: string;
  year: number;
  rating: number;
  genre: string;
  type: "movie" | "series" | "anime";
  imageUrl: string;
  trailerUrl?: string;
  director?: string;
  cast?: string[];
  ageRating?: string;
  releaseDate?: string;
  country?: string;
  language?: string;
  subtitleOptions?: string[];
  dubOptions?: string[];
  totalEpisodes?: number;
  totalSeasons?: number;
  episodeDuration?: string;
  categories?: string[];
  isTrending?: boolean;
  isNewRelease?: boolean;
  isPopular?: boolean;
  duration?: string;
  createdAt: Date;
};

export default function Admin() {
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [showBootstrap, setShowBootstrap] = useState(!isAdmin);

  // Fetch all content
  const { data: contents = [], isLoading: contentsLoading } = useQuery<Content[]>({
    queryKey: ['/api/content'],
  });

  // Bootstrap admin mutation
  const bootstrapMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/bootstrap', {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Você foi configurado como administrador.",
      });
      setShowBootstrap(false);
      // Refresh the page to get updated user data
      window.location.reload();
    },
    onError: (error: any) => {
      const message = error.response?.status === 409 
        ? "Já existe um administrador configurado." 
        : "Erro ao configurar administrador.";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      if (error.response?.status === 409) {
        setShowBootstrap(false);
      }
    },
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/content/${contentId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      toast({
        title: "Sucesso!",
        description: "Conteúdo deletado com sucesso.",
      });
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        setShowBootstrap(true);
        toast({
          title: "Acesso negado",
          description: "Você precisa ser administrador para realizar esta ação.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao deletar conteúdo.",
          variant: "destructive",
        });
      }
    },
  });

  const handleDeleteContent = async (content: Content) => {
    if (confirm(`Tem certeza que deseja deletar "${content.title}"?`)) {
      deleteContentMutation.mutate(content.id);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'movie': return 'Filme';
      case 'series': return 'Série';
      case 'anime': return 'Anime';
      default: return type;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'movie': return 'bg-blue-500';
      case 'series': return 'bg-green-500';
      case 'anime': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Painel de Administração</h1>
            <p className="text-gray-400">Gerencie filmes, séries e anime</p>
          </div>
          <div className="flex gap-4">
            <Link href="/">
              <Button variant="outline" data-testid="button-home">
                Voltar ao Site
              </Button>
            </Link>
            <Button data-testid="button-add-content">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Conteúdo
            </Button>
          </div>
        </div>

        {showBootstrap && (
          <Card className="mb-6 border-yellow-500 bg-yellow-900/20">
            <CardHeader>
              <CardTitle className="text-yellow-400">Configuração Inicial</CardTitle>
              <CardDescription>
                Você precisa se tornar administrador para acessar as funcionalidades administrativas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => bootstrapMutation.mutate()}
                disabled={bootstrapMutation.isPending}
                className="bg-yellow-600 hover:bg-yellow-700"
                data-testid="button-bootstrap-admin"
              >
                {bootstrapMutation.isPending ? "Configurando..." : "Tornar-me Administrador"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="content" data-testid="tab-content">
              Conteúdo ({contents.length})
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {contentsLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="text-gray-400" data-testid="text-loading">Carregando conteúdo...</div>
                </div>
              ) : contents.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <div className="text-gray-400" data-testid="text-no-content">Nenhum conteúdo encontrado</div>
                </div>
              ) : (
                contents.map((content) => (
                  <Card key={content.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors" data-testid={`card-content-${content.id}`}>
                    <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                      <img
                        src={content.imageUrl}
                        alt={content.title}
                        className="w-full h-full object-cover"
                        data-testid={`img-content-${content.id}`}
                      />
                      <div className="absolute top-2 left-2">
                        <Badge className={`${getTypeBadgeColor(content.type)} text-white`} data-testid={`badge-type-${content.id}`}>
                          {getTypeLabel(content.type)}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg" data-testid={`text-title-${content.id}`}>{content.title}</CardTitle>
                      <CardDescription className="text-sm text-gray-400" data-testid={`text-year-${content.id}`}>
                        {content.year} • {content.genre}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400" data-testid={`text-rating-${content.id}`}>Nota: {content.rating}/100</span>
                        <div className="flex gap-1">
                          {content.isTrending && (
                            <Badge variant="secondary" className="text-xs" data-testid={`badge-trending-${content.id}`}>
                              Em Alta
                            </Badge>
                          )}
                          {content.isNewRelease && (
                            <Badge variant="secondary" className="text-xs" data-testid={`badge-new-${content.id}`}>
                              Lançamento
                            </Badge>
                          )}
                          {content.isPopular && (
                            <Badge variant="secondary" className="text-xs" data-testid={`badge-popular-${content.id}`}>
                              Popular
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-4 line-clamp-2" data-testid={`text-description-${content.id}`}>
                        {content.description}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          data-testid={`button-edit-${content.id}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteContent(content)}
                          disabled={deleteContentMutation.isPending}
                          data-testid={`button-delete-${content.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>
                  Funcionalidade em desenvolvimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400" data-testid="text-users-coming-soon">
                  Em breve você poderá gerenciar usuários e suas permissões.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}