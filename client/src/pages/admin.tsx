import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Users, Search, Filter, Grid, List } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { Link } from "wouter";
import ContentForm from "@/components/ContentForm";
import { type Content } from "@shared/schema";


export default function Admin() {
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [showBootstrap, setShowBootstrap] = useState(!isAdmin);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch all content
  const { data: contents = [], isLoading: contentsLoading } = useQuery<Content[]>({
    queryKey: ['/api/content'],
  });

  // Get unique categories for filter
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    contents.forEach(content => {
      content.categories?.forEach(cat => categories.add(cat));
    });
    return Array.from(categories).sort();
  }, [contents]);

  // Filter content based on search and filters
  const filteredContents = useMemo(() => {
    return contents.filter(content => {
      // Search by title
      const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by type
      const matchesType = typeFilter === "all" || content.type === typeFilter;
      
      // Filter by category
      const matchesCategory = categoryFilter === "all" || 
        (content.categories && content.categories.includes(categoryFilter));
      
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [contents, searchTerm, typeFilter, categoryFilter]);

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

  const handleAddContent = () => {
    setSelectedContent(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const handleEditContent = (content: Content) => {
    setSelectedContent(content);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedContent(null);
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
            <Button onClick={handleAddContent} data-testid="button-add-content">
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
            {/* Filters and Search */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span className="font-semibold">Filtros e Pesquisa</span>
                    <Badge variant="secondary" className="ml-2" data-testid="badge-total-count">
                      {filteredContents.length} de {contents.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      data-testid="button-grid-view"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      data-testid="button-list-view"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Pesquisar por título..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                  
                  {/* Type Filter */}
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger data-testid="select-type-filter">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="movie">Filmes</SelectItem>
                      <SelectItem value="series">Séries</SelectItem>
                      <SelectItem value="anime">Animes</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Category Filter */}
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger data-testid="select-category-filter">
                      <SelectValue placeholder="Filtrar por categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {allCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Clear Filters */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setTypeFilter("all");
                      setCategoryFilter("all");
                    }}
                    data-testid="button-clear-filters"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Content Grid/List */}
            <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
              {contentsLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="text-gray-400" data-testid="text-loading">Carregando conteúdo...</div>
                </div>
              ) : filteredContents.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <div className="text-gray-400" data-testid="text-no-content">Nenhum conteúdo encontrado</div>
                </div>
              ) : (
                filteredContents.map((content) => (
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
                          onClick={() => handleEditContent(content)}
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

        {/* Content Form Modal */}
        <ContentForm
          open={formOpen}
          onClose={handleCloseForm}
          mode={formMode}
          content={selectedContent ?? undefined}
        />
      </div>
    </div>
  );
}