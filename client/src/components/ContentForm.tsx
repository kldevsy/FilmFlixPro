import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
import { X, Plus } from "lucide-react";
import { insertContentSchema, type InsertContent, type Content } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

  const form = useForm<InsertContent>({
    resolver: zodResolver(insertContentSchema),
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
    </Dialog>
  );
}