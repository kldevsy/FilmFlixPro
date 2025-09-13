import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronDown, X, Calendar, Star, Clock, Tag, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdvancedFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onFiltersChange: (filters: FilterState) => void;
}

export interface FilterState {
  type: string;
  ageRating: string[];
  categories: string[];
  yearRange: { min: number; max: number };
  ratingRange: { min: number; max: number };
  country: string[];
  language: string[];
  sortBy: string;
}

const categories = [
  { id: "all", label: "Todos", icon: Globe },
  { id: "movie", label: "Filmes", icon: Tag },
  { id: "series", label: "Séries", icon: Clock },
  { id: "anime", label: "Animes", icon: Star },
];

const ageRatings = ["L", "10", "12", "14", "16", "18"];
const genres = [
  "ação", "aventura", "comédia", "drama", "ficção científica", 
  "terror", "thriller", "romance", "crime", "guerra", "sobrenatural"
];
const countries = ["Estados Unidos", "Japão", "Brasil", "Coreia do Sul", "Reino Unido"];
const languages = ["Português", "Inglês", "Japonês", "Coreano", "Espanhol"];
const sortOptions = [
  { id: "popularity", label: "Popularidade" },
  { id: "rating", label: "Avaliação" },
  { id: "year", label: "Ano de lançamento" },
  { id: "title", label: "Título (A-Z)" },
];

export default function AdvancedFilters({ selectedCategory, onCategoryChange, onFiltersChange }: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    type: selectedCategory,
    ageRating: [],
    categories: [],
    yearRange: { min: 1990, max: 2024 },
    ratingRange: { min: 0, max: 10 },
    country: [],
    language: [],
    sortBy: "popularity"
  });

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      type: "all",
      ageRating: [],
      categories: [],
      yearRange: { min: 1990, max: 2024 },
      ratingRange: { min: 0, max: 10 },
      country: [],
      language: [],
      sortBy: "popularity"
    };
    setFilters(clearedFilters);
    onCategoryChange("all");
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = 
    filters.ageRating.length > 0 ||
    filters.categories.length > 0 ||
    filters.country.length > 0 ||
    filters.language.length > 0 ||
    filters.yearRange.min !== 1990 ||
    filters.yearRange.max !== 2024 ||
    filters.ratingRange.min !== 0 ||
    filters.ratingRange.max !== 10;

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(categoryId);
    updateFilters({ type: categoryId });
  };

  return (
    <section className="py-8 border-b border-border bg-card/20" data-testid="advanced-filters">
      <div className="container mx-auto px-6">
        {/* Main Category Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
          <div className="flex space-x-1 bg-muted rounded-lg p-1 max-w-full overflow-x-auto">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <motion.button
                  key={category.id}
                  className={`flex items-center gap-2 py-3 px-6 rounded-md text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  onClick={() => handleCategorySelect(category.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  data-testid={`category-tab-${category.id}`}
                >
                  <Icon className="w-4 h-4" />
                  {category.label}
                </motion.button>
              );
            })}
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-sm text-muted-foreground">Filtros ativos</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-destructive hover:text-destructive border-destructive/20"
                  data-testid="clear-filters"
                >
                  <X className="w-3 h-3 mr-1" />
                  Limpar
                </Button>
              </motion.div>
            )}
            
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center gap-2 ${isExpanded ? 'bg-primary/10 border-primary/20' : ''}`}
              data-testid="filters-toggle"
            >
              <Filter className="w-4 h-4" />
              Filtros Avançados
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </Button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-card/50 rounded-xl p-6 border border-border/50 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Age Rating Filter */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Star className="w-4 h-4 text-accent" />
                      Classificação Etária
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {ageRatings.map(rating => (
                        <motion.button
                          key={rating}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                            filters.ageRating.includes(rating)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                          }`}
                          onClick={() => {
                            const newRatings = filters.ageRating.includes(rating)
                              ? filters.ageRating.filter(r => r !== rating)
                              : [...filters.ageRating, rating];
                            updateFilters({ ageRating: newRatings });
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          data-testid={`age-filter-${rating}`}
                        >
                          {rating}+
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Genre Filter */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Tag className="w-4 h-4 text-accent" />
                      Gêneros
                    </h4>
                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                      {genres.map(genre => (
                        <motion.label
                          key={genre}
                          className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md"
                          whileHover={{ x: 2 }}
                        >
                          <input
                            type="checkbox"
                            className="rounded border-border text-primary"
                            checked={filters.categories.includes(genre)}
                            onChange={(e) => {
                              const newCategories = e.target.checked
                                ? [...filters.categories, genre]
                                : filters.categories.filter(c => c !== genre);
                              updateFilters({ categories: newCategories });
                            }}
                            data-testid={`genre-filter-${genre}`}
                          />
                          <span className="text-sm capitalize">{genre}</span>
                        </motion.label>
                      ))}
                    </div>
                  </div>

                  {/* Year Range Filter */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent" />
                      Ano de Lançamento
                    </h4>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs text-muted-foreground mb-1">De</label>
                          <Input
                            type="number"
                            min="1900"
                            max="2024"
                            value={filters.yearRange.min}
                            onChange={(e) => updateFilters({ 
                              yearRange: { ...filters.yearRange, min: parseInt(e.target.value) } 
                            })}
                            className="text-sm"
                            data-testid="year-min-input"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-muted-foreground mb-1">Até</label>
                          <Input
                            type="number"
                            min="1900"
                            max="2024"
                            value={filters.yearRange.max}
                            onChange={(e) => updateFilters({ 
                              yearRange: { ...filters.yearRange, max: parseInt(e.target.value) } 
                            })}
                            className="text-sm"
                            data-testid="year-max-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Star className="w-4 h-4 text-accent" />
                      Avaliação
                    </h4>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-muted-foreground mb-1">Mín</label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={filters.ratingRange.min}
                          onChange={(e) => updateFilters({ 
                            ratingRange: { ...filters.ratingRange, min: parseFloat(e.target.value) } 
                          })}
                          className="text-sm"
                          data-testid="rating-min-input"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-muted-foreground mb-1">Máx</label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={filters.ratingRange.max}
                          onChange={(e) => updateFilters({ 
                            ratingRange: { ...filters.ratingRange, max: parseFloat(e.target.value) } 
                          })}
                          className="text-sm"
                          data-testid="rating-max-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Country Filter */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Globe className="w-4 h-4 text-accent" />
                      País
                    </h4>
                    <div className="space-y-1">
                      {countries.map(country => (
                        <motion.label
                          key={country}
                          className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md"
                          whileHover={{ x: 2 }}
                        >
                          <input
                            type="checkbox"
                            className="rounded border-border text-primary"
                            checked={filters.country.includes(country)}
                            onChange={(e) => {
                              const newCountries = e.target.checked
                                ? [...filters.country, country]
                                : filters.country.filter(c => c !== country);
                              updateFilters({ country: newCountries });
                            }}
                            data-testid={`country-filter-${country}`}
                          />
                          <span className="text-sm">{country}</span>
                        </motion.label>
                      ))}
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-accent" />
                      Ordenar Por
                    </h4>
                    <select
                      className="w-full bg-muted text-foreground px-3 py-2 rounded-lg border border-border"
                      value={filters.sortBy}
                      onChange={(e) => updateFilters({ sortBy: e.target.value })}
                      data-testid="sort-select"
                    >
                      {sortOptions.map(option => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}