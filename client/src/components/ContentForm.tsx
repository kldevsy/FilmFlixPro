import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Edit2, Trash2, Play } from "lucide-react";
import { 
  insertContentSchema, 
  insertSeasonSchema,
  insertEpisodeSchema,
  type InsertContent, 
  type Content,
  type Season,
  type Episode,
  type InsertSeason,
  type InsertEpisode 
} from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form-specific schemas that handle nullable fields properly
const formSeasonSchema = insertSeasonSchema.extend({
  title: insertSeasonSchema.shape.title.nullable().transform(val => val ?? ''),
  description: insertSeasonSchema.shape.description.nullable().transform(val => val ?? ''),
  posterUrl: insertSeasonSchema.shape.posterUrl.nullable().transform(val => val ?? ''),
});

const formEpisodeSchema = insertEpisodeSchema.extend({
  synopsis: insertEpisodeSchema.shape.synopsis.nullable().transform(val => val ?? ''),
  duration: insertEpisodeSchema.shape.duration.nullable().transform(val => val ?? ''),
  thumbnailUrl: insertEpisodeSchema.shape.thumbnailUrl.nullable().transform(val => val ?? ''),
  airDate: insertEpisodeSchema.shape.airDate.nullable().transform(val => val ?? ''),
});

interface ContentFormProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  content?: Content;
}

const typeOptions = [
  { value: "movie", label: "Filme" },
  { value: "series", label: "Série" },
  { value: "anime", label: "Anime" },
];

const genreOptions = [
  "Ação", "Aventura", "Comédia", "Drama", "Terror", "Romance", 
  "Ficção Científica", "Fantasia", "Thriller", "Documentário",
  "Animação", "Crime", "Mistério", "História", "Guerra", "Biografia"
];

const ageRatingOptions = [
  { value: "L", label: "Livre" },
  { value: "10", label: "10 anos" },
  { value: "12", label: "12 anos" },
  { value: "14", label: "14 anos" },
  { value: "16", label: "16 anos" },
  { value: "18", label: "18 anos" },
];

export default function ContentForm({ open, onClose, mode, content }: ContentFormProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [cast, setCast] = useState<string[]>([]);
  const [newCastMember, setNewCastMember] = useState("");
  
  // Seasons and Episodes management state
  const [showSeasonsDialog, setShowSeasonsDialog] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

  const formSchema = insertContentSchema.extend({
    movieUrl: z.string().url({ message: "URL inválida" }).min(1, { message: "Link do filme é obrigatório" })
  });
  
  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      year: new Date().getFullYear(),
      rating: 0,
      genre: "",
      type: "movie",
      imageUrl: "",
      trailerUrl: "",
      movieUrl: "",
      director: "",
      cast: [],
      ageRating: "L",
      releaseDate: "",
      country: "",
      language: "português",
      subtitleOptions: [],
      dubOptions: [],
      totalEpisodes: undefined,
      totalSeasons: undefined,
      episodeDuration: "",
      categories: [],
      isTrending: false,
      isNewRelease: false,
      isPopular: false,
      duration: "",
    },
  });

  const watchType = form.watch("type");

  // Update form when content changes (edit mode)
  useEffect(() => {
    if (mode === "edit" && content) {
      form.reset({
        title: content.title,
        description: content.description,
        year: content.year,
        rating: content.rating,
        genre: content.genre,
        type: content.type as "movie" | "series" | "anime",
        imageUrl: content.imageUrl,
        trailerUrl: content.trailerUrl ?? "",
        movieUrl: content.movieUrl ?? "",
        director: content.director ?? "",
        cast: content.cast ?? [],
        ageRating: content.ageRating ?? "L",
        releaseDate: content.releaseDate ?? "",
        country: content.country ?? "",
        language: content.language ?? "português",
        subtitleOptions: content.subtitleOptions ?? [],
        dubOptions: content.dubOptions ?? [],
        totalEpisodes: content.totalEpisodes ?? undefined,
        totalSeasons: content.totalSeasons ?? undefined,
        episodeDuration: content.episodeDuration ?? "",
        categories: content.categories ?? [],
        isTrending: content.isTrending ?? false,
        isNewRelease: content.isNewRelease ?? false,
        isPopular: content.isPopular ?? false,
        duration: content.duration ?? "",
      });
      setCategories(content.categories || []);
      setCast(content.cast || []);
    } else if (mode === "create") {
      form.reset();
      setCategories([]);
      setCast([]);
    }
  }, [mode, content, form]);

  const createContentMutation = useMutation({
    mutationFn: async (data: InsertContent) => {
      const response = await apiRequest('POST', '/api/admin/content', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      toast({
        title: "Sucesso!",
        description: "Conteúdo criado com sucesso.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.statusText || "Erro ao criar conteúdo.",
        variant: "destructive",
      });
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: async (data: Partial<InsertContent>) => {
      if (!content?.id) throw new Error("Content ID is required for update");
      const response = await apiRequest('PUT', `/api/admin/content/${content.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      toast({
        title: "Sucesso!",
        description: "Conteúdo atualizado com sucesso.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.statusText || "Erro ao atualizar conteúdo.",
        variant: "destructive",
      });
    },
  });

  // Seasons and Episodes queries and mutations
  const { data: seasons = [], refetch: refetchSeasons } = useQuery({
    queryKey: ['/api/content', content?.id, 'seasons'],
    queryFn: async () => {
      if (!content?.id) return [];
      const response = await apiRequest('GET', `/api/content/${content.id}/seasons`);
      return response.json();
    },
    enabled: !!content?.id && (watchType === 'series' || watchType === 'anime'),
  });

  const { data: episodes = [], refetch: refetchEpisodes } = useQuery({
    queryKey: ['/api/seasons', selectedSeasonId, 'episodes'],
    queryFn: async () => {
      if (!selectedSeasonId) return [];
      const response = await apiRequest('GET', `/api/seasons/${selectedSeasonId}/episodes`);
      return response.json();
    },
    enabled: !!selectedSeasonId,
  });

  // Season mutations
  const createSeasonMutation = useMutation({
    mutationFn: async (data: InsertSeason) => {
      const response = await apiRequest('POST', `/api/admin/content/${content?.id}/seasons`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content', content?.id, 'seasons'] });
      setEditingSeason(null);
      toast({ title: "Sucesso!", description: "Temporada criada com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao criar temporada.", variant: "destructive" });
    },
  });

  const updateSeasonMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<InsertSeason>) => {
      const response = await apiRequest('PUT', `/api/admin/seasons/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content', content?.id, 'seasons'] });
      setEditingSeason(null);
      toast({ title: "Sucesso!", description: "Temporada atualizada com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao atualizar temporada.", variant: "destructive" });
    },
  });

  const deleteSeasonMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/seasons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content', content?.id, 'seasons'] });
      setSelectedSeasonId(null);
      toast({ title: "Sucesso!", description: "Temporada deletada com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao deletar temporada.", variant: "destructive" });
    },
  });

  // Episode mutations
  const createEpisodeMutation = useMutation({
    mutationFn: async (data: InsertEpisode) => {
      const response = await apiRequest('POST', `/api/admin/seasons/${selectedSeasonId}/episodes`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seasons', selectedSeasonId, 'episodes'] });
      setEditingEpisode(null);
      toast({ title: "Sucesso!", description: "Episódio criado com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao criar episódio.", variant: "destructive" });
    },
  });

  const updateEpisodeMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<InsertEpisode>) => {
      const response = await apiRequest('PUT', `/api/admin/episodes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seasons', selectedSeasonId, 'episodes'] });
      setEditingEpisode(null);
      toast({ title: "Sucesso!", description: "Episódio atualizado com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao atualizar episódio.", variant: "destructive" });
    },
  });

  const deleteEpisodeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/episodes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seasons', selectedSeasonId, 'episodes'] });
      toast({ title: "Sucesso!", description: "Episódio deletado com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao deletar episódio.", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertContent) => {
    const payload = {
      ...data,
      categories,
      cast,
    };

    if (mode === "create") {
      createContentMutation.mutate(payload);
    } else {
      updateContentMutation.mutate(payload);
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
    }
  };

  const removeCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
  };

  const addCastMember = () => {
    if (newCastMember.trim() && !cast.includes(newCastMember.trim())) {
      setCast([...cast, newCastMember.trim()]);
      setNewCastMember("");
    }
  };

  const removeCastMember = (member: string) => {
    setCast(cast.filter(c => c !== member));
  };

  const isLoading = createContentMutation.isPending || updateContentMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">
            {mode === "create" ? "Adicionar Conteúdo" : "Editar Conteúdo"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Preencha os campos abaixo para adicionar novo conteúdo."
              : "Edite as informações do conteúdo selecionado."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="content-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-type">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {typeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-year"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota (0-100) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-rating"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gênero *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-genre">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o gênero" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {genreOptions.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ageRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Classificação Etária</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? "L"} data-testid="select-age-rating">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a classificação" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ageRatingOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Imagem *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-image-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trailerUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Trailer</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} data-testid="input-trailer-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="movieUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link do Filme/Série/Anime *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="https://..." data-testid="input-movie-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="director"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diretor</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} data-testid="input-director" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} data-testid="input-country" />
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
                    <FormLabel>Idioma</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} data-testid="input-language" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="Ex: 2h 30min" data-testid="input-duration" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Conditional fields for series/anime */}
            {(watchType === "series" || watchType === "anime") && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="totalSeasons"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total de Temporadas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            data-testid="input-total-seasons"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalEpisodes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total de Episódios</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            data-testid="input-total-episodes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="episodeDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duração do Episódio</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} placeholder="Ex: 24min" data-testid="input-episode-duration" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {mode === "edit" && content?.id && (
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSeasonsDialog(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                      data-testid="manage-seasons-button"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Gerenciar Temporadas e Episódios
                    </Button>
                  </div>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} data-testid="textarea-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Categories */}
            <div>
              <FormLabel>Categorias</FormLabel>
              <div className="flex gap-2 mb-2" data-testid="input-add-category">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Adicionar categoria"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                />
                <Button type="button" onClick={addCategory} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1" data-testid={`badge-category-${index}`}>
                    {category}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeCategory(category)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Cast */}
            <div>
              <FormLabel>Elenco</FormLabel>
              <div className="flex gap-2 mb-2" data-testid="input-add-cast">
                <Input
                  value={newCastMember}
                  onChange={(e) => setNewCastMember(e.target.value)}
                  placeholder="Adicionar membro do elenco"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCastMember())}
                />
                <Button type="button" onClick={addCastMember} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {cast.map((member, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1" data-testid={`badge-cast-${index}`}>
                    {member}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeCastMember(member)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Flags */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="isTrending"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-trending"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Em Alta</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isNewRelease"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-new-release"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Lançamento</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPopular"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-popular"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Popular</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                data-testid="button-submit"
              >
                {isLoading ? "Salvando..." : mode === "create" ? "Criar" : "Atualizar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      {/* Seasons and Episodes Management Dialog */}
      <Dialog open={showSeasonsDialog} onOpenChange={setShowSeasonsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Gerenciar Temporadas e Episódios</DialogTitle>
            <DialogDescription>
              Gerencie as temporadas e episódios de {content?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh] overflow-hidden">
            {/* Seasons Panel */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Temporadas</h3>
                <Button
                  onClick={() => setEditingSeason({ 
                    id: '', 
                    contentId: content?.id || '', 
                    seasonNumber: seasons.length + 1, 
                    title: null, 
                    description: null, 
                    posterUrl: null,
                    createdAt: null,
                    updatedAt: null
                  })}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Temporada
                </Button>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-2">
                {seasons.map((season: Season) => (
                  <div
                    key={season.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedSeasonId === season.id 
                        ? 'bg-blue-600/20 border-blue-500' 
                        : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedSeasonId(season.id)}
                    data-testid={`season-item-${season.id}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">
                          Temporada {season.seasonNumber}
                          {season.title && `: ${season.title}`}
                        </h4>
                        {season.description && (
                          <p className="text-sm text-gray-400 mt-1">{season.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSeason(season);
                          }}
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Tem certeza que deseja deletar esta temporada?')) {
                              deleteSeasonMutation.mutate(season.id);
                            }
                          }}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Episodes Panel */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Episódios</h3>
                <Button
                  onClick={() => {
                    if (!selectedSeasonId) {
                      toast({ title: "Aviso", description: "Selecione uma temporada primeiro", variant: "destructive" });
                      return;
                    }
                    setEditingEpisode({ 
                      id: '', 
                      contentId: content?.id || '', 
                      seasonId: selectedSeasonId, 
                      episodeNumber: episodes.length + 1, 
                      title: '', 
                      synopsis: null, 
                      duration: null, 
                      videoUrl: '', 
                      thumbnailUrl: null, 
                      airDate: null,
                      createdAt: null,
                      updatedAt: null
                    });
                  }}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!selectedSeasonId}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Episódio
                </Button>
              </div>
              
              {selectedSeasonId ? (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {episodes.map((episode: Episode) => (
                    <div
                      key={episode.id}
                      className="p-3 border rounded-lg bg-gray-800 border-gray-600 hover:bg-gray-700 transition-all"
                      data-testid={`episode-item-${episode.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">
                            EP{episode.episodeNumber}: {episode.title}
                          </h4>
                          {episode.synopsis && (
                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{episode.synopsis}</p>
                          )}
                          <div className="text-xs text-gray-500 mt-2 flex gap-4">
                            {episode.duration && <span>Duração: {episode.duration}</span>}
                            {episode.airDate && <span>Lançamento: {episode.airDate}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-2">
                          <Button
                            onClick={() => setEditingEpisode(episode)}
                            size="sm"
                            variant="ghost"
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              if (confirm('Tem certeza que deseja deletar este episódio?')) {
                                deleteEpisodeMutation.mutate(episode.id);
                              }
                            }}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  Selecione uma temporada para ver os episódios
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Season Edit Dialog */}
      {editingSeason && (
        <Dialog open={!!editingSeason} onOpenChange={() => setEditingSeason(null)}>
          <DialogContent className="bg-gray-900 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle>
                {editingSeason.id ? 'Editar Temporada' : 'Nova Temporada'}
              </DialogTitle>
            </DialogHeader>
            
            <SeasonForm
              season={editingSeason}
              onSave={(data: InsertSeason) => {
                if (editingSeason.id) {
                  updateSeasonMutation.mutate({ id: editingSeason.id, ...data });
                } else {
                  createSeasonMutation.mutate(data);
                }
              }}
              onCancel={() => setEditingSeason(null)}
              isLoading={createSeasonMutation.isPending || updateSeasonMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Episode Edit Dialog */}
      {editingEpisode && (
        <Dialog open={!!editingEpisode} onOpenChange={() => setEditingEpisode(null)}>
          <DialogContent className="bg-gray-900 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle>
                {editingEpisode.id ? 'Editar Episódio' : 'Novo Episódio'}
              </DialogTitle>
            </DialogHeader>
            
            <EpisodeForm
              episode={editingEpisode}
              onSave={(data: InsertEpisode) => {
                if (editingEpisode.id) {
                  updateEpisodeMutation.mutate({ id: editingEpisode.id, ...data });
                } else {
                  createEpisodeMutation.mutate(data);
                }
              }}
              onCancel={() => setEditingEpisode(null)}
              isLoading={createEpisodeMutation.isPending || updateEpisodeMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}

// Season Form Component
interface SeasonFormProps {
  season: Season;
  onSave: (data: InsertSeason) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function SeasonForm({ season, onSave, onCancel, isLoading }: SeasonFormProps) {
  const seasonForm = useForm<InsertSeason>({
    resolver: zodResolver(formSeasonSchema),
    defaultValues: {
      contentId: season.contentId,
      seasonNumber: season.seasonNumber,
      title: season.title ?? '',
      description: season.description ?? '',
      posterUrl: season.posterUrl ?? '',
    },
  });

  const onSubmit = (data: InsertSeason) => {
    onSave(data);
  };

  return (
    <Form {...seasonForm}>
      <form onSubmit={seasonForm.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={seasonForm.control}
          name="seasonNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número da Temporada</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  data-testid="input-season-number"
                  min={1}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={seasonForm.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título (Opcional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder="Ex: Primeira Temporada" data-testid="input-season-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={seasonForm.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (Opcional)</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ''} placeholder="Descrição da temporada..." data-testid="input-season-description" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={seasonForm.control}
          name="posterUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL do Poster (Opcional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder="https://example.com/poster.jpg" data-testid="input-season-poster" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} data-testid="button-season-cancel">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} data-testid="button-season-save">
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Episode Form Component
interface EpisodeFormProps {
  episode: Episode;
  onSave: (data: InsertEpisode) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function EpisodeForm({ episode, onSave, onCancel, isLoading }: EpisodeFormProps) {
  const episodeForm = useForm<InsertEpisode>({
    resolver: zodResolver(formEpisodeSchema),
    defaultValues: {
      contentId: episode.contentId,
      seasonId: episode.seasonId,
      episodeNumber: episode.episodeNumber,
      title: episode.title ?? '',
      synopsis: episode.synopsis ?? '',
      duration: episode.duration ?? '',
      videoUrl: episode.videoUrl ?? '',
      thumbnailUrl: episode.thumbnailUrl ?? '',
      airDate: episode.airDate ?? '',
    },
  });

  const onSubmit = (data: InsertEpisode) => {
    onSave(data);
  };

  return (
    <Form {...episodeForm}>
      <form onSubmit={episodeForm.handleSubmit(onSubmit)} className="space-y-4 max-h-96 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={episodeForm.control}
            name="episodeNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número do Episódio</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    data-testid="input-episode-number"
                    min={1}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={episodeForm.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} placeholder="Ex: 42min" data-testid="input-episode-duration" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={episodeForm.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Episódio</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Título do episódio..." data-testid="input-episode-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={episodeForm.control}
          name="synopsis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sinopse (Opcional)</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ''} placeholder="Descrição do episódio..." data-testid="input-episode-synopsis" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={episodeForm.control}
          name="videoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL do Vídeo</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://example.com/video.mp4" data-testid="input-episode-video-url" type="url" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={episodeForm.control}
          name="thumbnailUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Miniatura (Opcional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder="https://example.com/thumbnail.jpg" data-testid="input-episode-thumbnail-url" type="url" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={episodeForm.control}
          name="airDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Lançamento (Opcional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder="Ex: 15 de Janeiro de 2024" data-testid="input-episode-air-date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} data-testid="button-episode-cancel">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} data-testid="button-episode-save">
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}