import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ChevronDown, Volume2, Subtitles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Content } from "@shared/schema";

interface EpisodeSelectorProps {
  content: Content;
}

interface Episode {
  id: number;
  title: string;
  duration: string;
  description: string;
  thumbnail: string;
}

export default function EpisodeSelector({ content }: EpisodeSelectorProps) {
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState<'dub' | 'sub'>('dub');
  const [isExpanded, setIsExpanded] = useState(false);

  // Simular episódios para demonstração
  const generateEpisodes = (season: number): Episode[] => {
    const episodesPerSeason = content.type === 'anime' ? 12 : 8;
    return Array.from({ length: episodesPerSeason }, (_, i) => ({
      id: i + 1,
      title: `Episódio ${i + 1}: ${content.type === 'anime' ? 'A Nova Batalha' : 'Revelações'}`,
      duration: content.episodeDuration || "24min",
      description: `Uma emocionante continuação da história de ${content.title}.`,
      thumbnail: content.imageUrl
    }));
  };

  const episodes = generateEpisodes(selectedSeason);
  const availableSeasons = Array.from({ length: content.totalSeasons || 1 }, (_, i) => i + 1);

  if (content.type === 'movie') {
    return null; // Filmes não têm episódios
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header de Episódios */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-2xl font-bold">Episódios</h3>
        
        {/* Controles de Temporada e Idioma */}
        <div className="flex flex-wrap gap-3">
          {/* Seletor de Temporada */}
          {(content.totalSeasons || 0) > 1 && (
            <div className="relative">
              <select 
                className="bg-muted text-foreground px-4 py-2 rounded-lg border border-border appearance-none cursor-pointer pr-8"
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                data-testid="season-selector"
              >
                {availableSeasons.map(season => (
                  <option key={season} value={season}>
                    Temporada {season}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>
          )}

          {/* Seletor de Idioma */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                selectedLanguage === 'dub' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setSelectedLanguage('dub')}
              data-testid="dub-option"
            >
              <Volume2 className="w-4 h-4" />
              Dublado
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                selectedLanguage === 'sub' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setSelectedLanguage('sub')}
              data-testid="sub-option"
            >
              <Subtitles className="w-4 h-4" />
              Legendado
            </button>
          </div>
        </div>
      </div>

      {/* Informações de Idioma */}
      <div className="bg-card/50 rounded-lg p-4 border border-border/50">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium">Áudio:</span>
            <span>
              {selectedLanguage === 'dub' 
                ? content.dubOptions?.join(', ') || 'Português'
                : content.language || 'Original'
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Legendas:</span>
            <span>{content.subtitleOptions?.join(', ') || 'Disponível'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Duração por ep:</span>
            <span>{content.episodeDuration}</span>
          </div>
        </div>
      </div>

      {/* Toggle para expandir lista de episódios */}
      <Button
        variant="outline"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between bg-card hover:bg-muted text-card-foreground border-border"
        data-testid="episodes-toggle"
      >
        {isExpanded ? 'Ocultar Episódios' : `Ver ${episodes.length} Episódios`}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </Button>

      {/* Lista de Episódios */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3 overflow-hidden"
          >
            {episodes.map((episode, index) => (
              <motion.div
                key={episode.id}
                className="bg-card rounded-lg p-4 border border-border/50 hover:border-primary/50 transition-all duration-200 cursor-pointer group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                data-testid={`episode-${episode.id}`}
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0 w-32 h-18 rounded-lg overflow-hidden bg-muted">
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url('${episode.thumbnail}')` }}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-foreground truncate">{episode.title}</h4>
                      <span className="text-sm text-muted-foreground flex-shrink-0">{episode.duration}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{episode.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}