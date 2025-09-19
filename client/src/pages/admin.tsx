import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Edit, Trash2, Users, Search, Filter, Grid, List, Crown, Bell, Send, AlertTriangle, Info, CheckCircle, XCircle, Eye, Calendar, Play } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import ContentForm from "@/components/ContentForm";
import { type Content, type User, type Notification, insertNotificationSchema } from "@shared/schema";

// User edit schema for form validation
const userEditSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
});

// Alert/notification form schema
const alertSchema = insertNotificationSchema.omit({ userId: true }).extend({
  targetUsers: z.array(z.string()).optional(), // User IDs to send to (if empty, broadcasts to all)
});

type AlertFormData = z.infer<typeof alertSchema>;

// Alert templates
const alertTemplates = {
  custom: { title: '', message: '', type: 'info' },
  maintenance: { 
    title: 'Manutenção Programada', 
    message: 'O sistema ficará indisponível entre {startTime} e {endTime} para manutenção. Pedimos desculpas pela inconveniência.',
    type: 'warning'
  },
  new_content: {
    title: 'Novo Conteúdo Disponível',
    message: 'Confira os novos filmes, séries e animes que acabaram de chegar na plataforma!',
    type: 'info'
  },
  system_update: {
    title: 'Atualização do Sistema',
    message: 'O sistema foi atualizado com novas funcionalidades e melhorias. Explore as novidades!',
    type: 'info'
  },
  urgent: {
    title: 'Aviso Importante',
    message: 'Esta é uma mensagem importante que requer sua atenção imediata.',
    type: 'urgent'
  }
};


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
  
  // User management states
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserEditDialog, setShowUserEditDialog] = useState(false);
  
  // Alerts management states
  const [showCreateAlertDialog, setShowCreateAlertDialog] = useState(false);
  const [alertSearchTerm, setAlertSearchTerm] = useState("");
  const [alertTypeFilter, setAlertTypeFilter] = useState<string>("all");
  const [selectedAlertTemplate, setSelectedAlertTemplate] = useState<string>("custom");
  
  // Tab management state
  const [activeTab, setActiveTab] = useState("content");
  
  // Select overlay states to prevent DOM errors
  const [typeSelectOpen, setTypeSelectOpen] = useState(false);
  const [categorySelectOpen, setCategorySelectOpen] = useState(false);
  const [roleSelectOpen, setRoleSelectOpen] = useState(false);
  const [alertTypeSelectOpen, setAlertTypeSelectOpen] = useState(false);
  const [alertTemplateSelectOpen, setAlertTemplateSelectOpen] = useState(false);

  // User edit form
  const userEditForm = useForm({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });
  
  // Alert creation form
  const alertForm = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      title: "",
      message: "",
      type: "info",
      actionUrl: "",
      metadata: null,
      targetUsers: [],
    },
  });

  // Fetch all content
  const { data: contents = [], isLoading: contentsLoading } = useQuery<Content[]>({
    queryKey: ['/api/content'],
  });

  // Fetch all users for admin
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: isAdmin,
  });
  

  // Sync bootstrap visibility with admin status
  useEffect(() => {
    if (isAdmin) {
      setShowBootstrap(false);
    }
  }, [isAdmin]);

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

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search by name or email
      const searchableText = `${user.firstName || ''} ${user.lastName || ''} ${user.email || ''}`.toLowerCase();
      const matchesSearch = searchableText.includes(userSearchTerm.toLowerCase());
      
      // Filter by role
      const matchesRole = userRoleFilter === "all" || 
        (userRoleFilter === "admin" && user.isAdmin) ||
        (userRoleFilter === "user" && !user.isAdmin);
      
      return matchesSearch && matchesRole;
    });
  }, [users, userSearchTerm, userRoleFilter]);
  
  // Handle alert template selection
  const handleAlertTemplateChange = (template: string) => {
    setSelectedAlertTemplate(template);
    const templateData = alertTemplates[template as keyof typeof alertTemplates];
    if (templateData) {
      alertForm.setValue('title', templateData.title);
      alertForm.setValue('message', templateData.message);
      alertForm.setValue('type', templateData.type);
    }
  };

  // Handle tab change and close any open dialogs/portals
  const handleTabChange = (value: string) => {
    // Close all dialogs and overlays to prevent DOM manipulation errors
    setShowUserEditDialog(false);
    setShowCreateAlertDialog(false);
    setFormOpen(false); // Close ContentForm modal
    setSelectedUser(null);
    setSelectedContent(null);
    
    // Close all Select dropdowns
    setTypeSelectOpen(false);
    setCategorySelectOpen(false);
    setRoleSelectOpen(false);
    setAlertTypeSelectOpen(false);
    setAlertTemplateSelectOpen(false);
    
    // Reset forms when leaving their respective tabs
    if (activeTab === "alerts" && value !== "alerts") {
      alertForm.reset();
      setSelectedAlertTemplate("custom");
    }
    
    if (activeTab === "users" && value !== "users") {
      userEditForm.reset();
    }
    
    setActiveTab(value);
  };

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

  // Make user admin mutation
  const makeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('POST', `/api/admin/make-user-admin/${userId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Sucesso!",
        description: "Usuário promovido a administrador.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao promover usuário a administrador.",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      const response = await apiRequest('PUT', `/api/admin/users/${userId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowUserEditDialog(false);
      setSelectedUser(null);
      toast({
        title: "Sucesso!",
        description: "Usuário atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar usuário.",
        variant: "destructive",
      });
    },
  });
  
  // Send notification/alert mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: AlertFormData) => {
      const { targetUsers, ...notificationData } = data;
      const payload = {
        ...notificationData,
        userIds: targetUsers && targetUsers.length > 0 ? targetUsers : undefined,
      };
      const response = await apiRequest('POST', '/api/admin/notifications/send', payload);
      return response.json();
    },
    onSuccess: (result) => {
      setShowCreateAlertDialog(false);
      alertForm.reset();
      toast({
        title: "Sucesso!",
        description: `Alerta enviado para ${result.sent} usuário(s) com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao enviar alerta.",
        variant: "destructive",
      });
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

  const handleMakeAdmin = async (user: User) => {
    if (confirm(`Tem certeza que deseja promover "${user.firstName} ${user.lastName}" a administrador?`)) {
      makeAdminMutation.mutate(user.id);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    userEditForm.reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
    });
    setShowUserEditDialog(true);
  };

  const handleUpdateUser = (data: z.infer<typeof userEditSchema>) => {
    if (selectedUser) {
      const updates: Partial<User> = {};
      if (data.firstName !== selectedUser.firstName) updates.firstName = data.firstName || null;
      if (data.lastName !== selectedUser.lastName) updates.lastName = data.lastName || null;
      if (data.email !== selectedUser.email) updates.email = data.email || null;
      
      updateUserMutation.mutate({ userId: selectedUser.id, updates });
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
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

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="content" data-testid="tab-content">
              Conteúdo ({contents.length})
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Usuários ({users.length})
            </TabsTrigger>
            <TabsTrigger value="alerts" data-testid="tab-alerts">
              <Bell className="w-4 h-4 mr-2" />
              Alertas
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
                  <Select 
                    value={typeFilter} 
                    onValueChange={setTypeFilter}
                    open={typeSelectOpen}
                    onOpenChange={setTypeSelectOpen}
                  >
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
                  <Select 
                    value={categoryFilter} 
                    onValueChange={setCategoryFilter}
                    open={categorySelectOpen}
                    onOpenChange={setCategorySelectOpen}
                  >
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
            {/* User Filters and Search */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold">Gerenciamento de Usuários</span>
                    <Badge variant="secondary" className="ml-2" data-testid="badge-user-count">
                      {filteredUsers.length} de {users.length}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Pesquisar por nome ou email..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-user-search"
                    />
                  </div>
                  
                  {/* Role Filter */}
                  <Select 
                    value={userRoleFilter} 
                    onValueChange={setUserRoleFilter}
                    open={roleSelectOpen}
                    onOpenChange={setRoleSelectOpen}
                  >
                    <SelectTrigger data-testid="select-role-filter">
                      <SelectValue placeholder="Filtrar por função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as funções</SelectItem>
                      <SelectItem value="admin">Administradores</SelectItem>
                      <SelectItem value="user">Usuários</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Clear Filters */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUserSearchTerm("");
                      setUserRoleFilter("all");
                    }}
                    data-testid="button-clear-user-filters"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <div className="space-y-4">
              {usersLoading ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="text-center py-8">
                    <div className="text-gray-400" data-testid="text-users-loading">Carregando usuários...</div>
                  </CardContent>
                </Card>
              ) : filteredUsers.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <div className="text-gray-400" data-testid="text-no-users">Nenhum usuário encontrado</div>
                  </CardContent>
                </Card>
              ) : (
                filteredUsers.map((user) => (
                  <Card key={user.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors" data-testid={`card-user-${user.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Avatar */}
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-lg font-semibold">
                              {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || '?'}
                            </div>
                            {user.isAdmin && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                          
                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg text-white truncate" data-testid={`text-user-name-${user.id}`}>
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}` 
                                  : user.email || 'Usuário sem nome'
                                }
                              </h3>
                              {user.isAdmin && (
                                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs" data-testid={`badge-admin-${user.id}`}>
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mb-2 truncate" data-testid={`text-user-email-${user.id}`}>
                              {user.email || 'Email não informado'}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
                              <span data-testid={`text-user-created-${user.id}`}>
                                Criado: {formatDate(user.createdAt)}
                              </span>
                              <span data-testid={`text-user-updated-${user.id}`}>
                                Atualizado: {formatDate(user.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-col gap-2 shrink-0">
                          {!user.isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMakeAdmin(user)}
                              disabled={makeAdminMutation.isPending}
                              className="text-xs px-3 py-1 h-8"
                              data-testid={`button-make-admin-${user.id}`}
                            >
                              Tornar Admin
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEditUser(user)}
                            className="text-xs px-3 py-1 h-8"
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="alerts" className="space-y-4">
            {/* Alerts Management Header */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <span className="font-semibold">Gerenciamento de Alertas</span>
                  </div>
                  <Button 
                    onClick={() => setShowCreateAlertDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="button-create-alert"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Criar Alerta
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Alert Statistics */}
                  <Card className="bg-gray-700 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Total de Usuários</p>
                          <p className="text-xl font-bold text-white" data-testid="text-total-users">{users.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-700 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Send className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Conteúdo Disponível</p>
                          <p className="text-xl font-bold text-white" data-testid="text-total-content">{contents.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-700 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Administradores</p>
                          <p className="text-xl font-bold text-white" data-testid="text-total-admins">{users.filter(u => u.isAdmin).length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Alert Templates Quick Actions */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Modelos de Alerta Rápido</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Button
                      variant="outline"
                      className="p-4 h-auto flex-col gap-2 bg-orange-600/10 border-orange-600 hover:bg-orange-600/20"
                      onClick={() => {
                        handleAlertTemplateChange('maintenance');
                        setShowCreateAlertDialog(true);
                      }}
                      data-testid="button-maintenance-alert"
                    >
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                      <span className="text-sm">Manutenção</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="p-4 h-auto flex-col gap-2 bg-green-600/10 border-green-600 hover:bg-green-600/20"
                      onClick={() => {
                        handleAlertTemplateChange('new_content');
                        setShowCreateAlertDialog(true);
                      }}
                      data-testid="button-new-content-alert"
                    >
                      <Plus className="w-5 h-5 text-green-400" />
                      <span className="text-sm">Novo Conteúdo</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="p-4 h-auto flex-col gap-2 bg-blue-600/10 border-blue-600 hover:bg-blue-600/20"
                      onClick={() => {
                        handleAlertTemplateChange('system_update');
                        setShowCreateAlertDialog(true);
                      }}
                      data-testid="button-system-update-alert"
                    >
                      <Info className="w-5 h-5 text-blue-400" />
                      <span className="text-sm">Atualização</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="p-4 h-auto flex-col gap-2 bg-red-600/10 border-red-600 hover:bg-red-600/20"
                      onClick={() => {
                        handleAlertTemplateChange('urgent');
                        setShowCreateAlertDialog(true);
                      }}
                      data-testid="button-urgent-alert"
                    >
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-sm">Urgente</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Activity */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Atividade Recente
                </CardTitle>
                <CardDescription>
                  Resumo das atividades administrativas recentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Sistema Online</p>
                      <p className="text-xs text-gray-400">Todas as funcionalidades operando normalmente</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                      Ativo
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Usuários Cadastrados</p>
                      <p className="text-xs text-gray-400">{users.length} usuários na plataforma</p>
                    </div>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                      Ativo
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Play className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Conteúdo Disponível</p>
                      <p className="text-xs text-gray-400">{contents.length} títulos no catálogo</p>
                    </div>
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                      Ativo
                    </Badge>
                  </div>
                </div>
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

        {/* User Edit Dialog */}
        <Dialog 
          open={showUserEditDialog} 
          onOpenChange={(open) => {
            setShowUserEditDialog(open);
            if (!open) {
              setSelectedUser(null);
              userEditForm.reset();
            }
          }}
        >
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Editar Usuário
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Atualize as informações do usuário {selectedUser?.firstName} {selectedUser?.lastName}
              </DialogDescription>
            </DialogHeader>
            <Form {...userEditForm}>
              <form onSubmit={userEditForm.handleSubmit(handleUpdateUser)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={userEditForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite o nome"
                            {...field}
                            className="bg-gray-800 border-gray-600"
                            data-testid="input-edit-firstName"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userEditForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sobrenome</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite o sobrenome"
                            {...field}
                            className="bg-gray-800 border-gray-600"
                            data-testid="input-edit-lastName"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={userEditForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Digite o email"
                          {...field}
                          className="bg-gray-800 border-gray-600"
                          data-testid="input-edit-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUserEditDialog(false)}
                    data-testid="button-cancel-edit-user"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                    data-testid="button-save-edit-user"
                  >
                    {updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Create Alert Dialog */}
        <Dialog 
          open={showCreateAlertDialog} 
          onOpenChange={(open) => {
            setShowCreateAlertDialog(open);
            if (!open) {
              alertForm.reset();
              setSelectedAlertTemplate("custom");
            }
          }}
        >
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Criar Novo Alerta
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Envie uma notificação para todos os usuários ou usuários específicos
              </DialogDescription>
            </DialogHeader>
            
            <Form {...alertForm}>
              <form onSubmit={alertForm.handleSubmit((data) => sendNotificationMutation.mutate(data))} className="space-y-6">
                {/* Template Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Modelo de Alerta</label>
                  <Select 
                    value={selectedAlertTemplate} 
                    onValueChange={handleAlertTemplateChange}
                    open={alertTemplateSelectOpen}
                    onOpenChange={setAlertTemplateSelectOpen}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600" data-testid="select-alert-template">
                      <SelectValue placeholder="Escolha um modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Personalizado</SelectItem>
                      <SelectItem value="maintenance">Manutenção Programada</SelectItem>
                      <SelectItem value="new_content">Novo Conteúdo</SelectItem>
                      <SelectItem value="system_update">Atualização do Sistema</SelectItem>
                      <SelectItem value="urgent">Aviso Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Alert Type */}
                  <FormField
                    control={alertForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Alerta</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          open={alertTypeSelectOpen}
                          onOpenChange={setAlertTypeSelectOpen}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-gray-800 border-gray-600" data-testid="select-alert-type">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="info">
                              <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-blue-400" />
                                Informação
                              </div>
                            </SelectItem>
                            <SelectItem value="warning">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-400" />
                                Aviso
                              </div>
                            </SelectItem>
                            <SelectItem value="urgent">
                              <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-400" />
                                Urgente
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Action URL */}
                  <FormField
                    control={alertForm.control}
                    name="actionUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL de Ação (Opcional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="https://exemplo.com"
                            className="bg-gray-800 border-gray-600"
                            data-testid="input-alert-action-url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Title */}
                <FormField
                  control={alertForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título do Alerta</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Título da notificação"
                          className="bg-gray-800 border-gray-600"
                          data-testid="input-alert-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Message */}
                <FormField
                  control={alertForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem do Alerta</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={4}
                          placeholder="Conteúdo da mensagem..."
                          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          data-testid="textarea-alert-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Target Users */}
                <FormField
                  control={alertForm.control}
                  name="targetUsers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destinatários</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="p-3 bg-gray-800 border border-gray-600 rounded-md">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="all-users"
                                name="recipient-type"
                                checked={!field.value || field.value.length === 0}
                                onChange={() => field.onChange([])}
                                className="text-blue-500"
                              />
                              <label htmlFor="all-users" className="text-sm">Todos os usuários ({users.length})</label>
                            </div>
                          </div>
                          <div className="p-3 bg-gray-800 border border-gray-600 rounded-md">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="admin-users"
                                name="recipient-type"
                                checked={field.value && field.value.length === users.filter(u => u.isAdmin).length}
                                onChange={() => field.onChange(users.filter(u => u.isAdmin).map(u => u.id))}
                                className="text-blue-500"
                              />
                              <label htmlFor="admin-users" className="text-sm">Apenas administradores ({users.filter(u => u.isAdmin).length})</label>
                            </div>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateAlertDialog(false);
                      alertForm.reset();
                      setSelectedAlertTemplate('custom');
                    }}
                    disabled={sendNotificationMutation.isPending}
                    data-testid="button-cancel-alert"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={sendNotificationMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="button-send-alert"
                  >
                    {sendNotificationMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Alerta
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}