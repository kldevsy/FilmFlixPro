import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Plus, Star, Calendar, Clock, Tag, Users, Film, Globe, Zap, ThumbsUp, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import EpisodeSelector from "./episode-selector";
import StreamPlayer, { type Episode } from "./stream-player";
import TrailerPlayer from "./trailer-player";
import { useContent } from "@/hooks/use-content";
import type { Content } from "@shared/schema";

interface ContentModalProps {
  content: Content | null;
  onClose: () => void;
}

export default function ContentModal({ content, onClose }: ContentModalProps) {
  const { data: allContent = [] } = useContent();
  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [currentSeason, setCurrentSeason] = useState(1);
  
  // Generate example episodes for series/anime
  const generateEpisodes = (content: Content): Episode[] => {
    if (content.type === 'movie') return [];
    
    const episodesPerSeason = content.type === 'anime' ? 12 : 8;
    return Array.from({ length: episodesPerSeason }, (_, i) => ({
      id: i + 1,
      title: `Episódio ${i + 1}: ${content.type === 'anime' ? 'A Nova Batalha' : 'Revelações'}`,
      duration: content.episodeDuration || "45min",
      thumbnail: content.imageUrl,
      description: `Uma emocionante continuação da história de ${content.title}.`
    }));
  };
  
  const episodes = content ? generateEpisodes(content) : [];
  const seasons = content?.totalSeasons ? Array.from({ length: content.totalSeasons }, (_, i) => i + 1) : [1];
  
  const handleEpisodeChange = (episode: number) => {
    setCurrentEpisode(episode);
    // Aqui você poderia carregar um vídeo diferente baseado no episódio
  };
  
  const handleSeasonChange = (season: number) => {
    setCurrentSeason(season);
    setCurrentEpisode(1); // Reset to first episode of new season
    // Aqui você poderia carregar episódios da nova temporada
  };
  
  if (!content) return null;
  
  // Encontrar conteúdos similares
  const getSimilarContent = (currentContent: Content) => {
    return allContent
      .filter(item => 
        item.id !== currentContent.id && (
          item.type === currentContent.type ||
          item.categories?.some(cat => currentContent.categories?.includes(cat)) ||
          item.genre === currentContent.genre
        )
      )
      .slice(0, 6);
  };
  
  const similarContent = getSimilarContent(content);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        data-testid="content-modal-overlay"
      >
        <motion.div
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-card rounded-2xl shadow-2xl"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          data-testid="content-modal"
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            onClick={onClose}
            data-testid="modal-close-button"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Hero Section with Trailer */}
          <div className="relative h-80 sm:h-96">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.8)), url('${content.imageUrl}')`
              }}
            />
            
            {/* Trailer Play Button/Video */}
            {content.trailerUrl && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center z-20"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                {!isTrailerPlaying ? (
                  <motion.button
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-6 transition-all duration-300 group"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsTrailerPlaying(true)}
                    data-testid="trailer-play-button"
                  >
                    <Play className="w-12 h-12 text-white group-hover:scale-110 transition-transform" fill="white" />
                  </motion.button>
                ) : (
                  <motion.div
                    className="w-full h-full relative bg-black rounded-lg overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {content.trailerUrl ? (
                      <TrailerPlayer
                        videoUrl={content.trailerUrl}
                        title={content.title}
                        onClose={() => setIsTrailerPlaying(false)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black text-white">
                        <p>Vídeo não disponível</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
            
            {/* Content Info Overlay - Hide quando trailer está tocando */}
            {!isTrailerPlaying && (
              <div className="absolute bottom-6 left-6 right-6 z-10">
              <motion.div
                className="flex items-center gap-2 mb-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold uppercase">
                  {content.type === 'movie' ? 'Filme' : content.type === 'series' ? 'Série' : 'Anime'}
                </span>
                <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
                  {content.ageRating}+
                </span>
                {content.country && (
                  <div className="flex items-center gap-1 text-white/90">
                    <Globe className="w-4 h-4" />
                    <span className="text-sm">{content.country}</span>
                  </div>
                )}
              </motion.div>
              
              <motion.h1
                className="text-4xl sm:text-5xl font-bold mb-4 text-white leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                data-testid="modal-title"
              >
                {content.title}
              </motion.h1>
              
              <motion.div 
                className="flex flex-wrap items-center gap-4 text-white/90"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-lg">
                  <div className="flex text-accent">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${
                          i < Math.floor(content.rating / 20) ? 'fill-current' : ''
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="font-bold text-lg">{(content.rating / 10).toFixed(1)}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{content.releaseDate || content.year}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{content.duration}</span>
                </div>
                
                {content.totalEpisodes && (
                  <div className="flex items-center gap-1">
                    <Film className="w-4 h-4" />
                    <span>{content.totalEpisodes} episódios</span>
                  </div>
                )}
              </motion.div>
            </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {/* Main Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Film className="w-5 h-5 text-primary" />
                    Sinopse
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{content.description}</p>
                </motion.div>

                {/* Director and Cast */}
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {content.director && (
                    <div className="bg-card/50 rounded-lg p-4 border border-border/50">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-accent" />
                        Direção
                      </h4>
                      <p className="text-muted-foreground">{content.director}</p>
                    </div>
                  )}
                  
                  {content.cast && content.cast.length > 0 && (
                    <div className="bg-card/50 rounded-lg p-4 border border-border/50">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4 text-accent" />
                        Elenco Principal
                      </h4>
                      <div className="space-y-1">
                        {content.cast.slice(0, 3).map((actor, index) => (
                          <p key={index} className="text-sm text-muted-foreground">{actor}</p>
                        ))}
                        {content.cast.length > 3 && (
                          <p className="text-xs text-muted-foreground/70">+{content.cast.length - 3} mais</p>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Categories */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    Categorias
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {content.categories?.map((category, index) => (
                      <span key={index} className="bg-muted/50 text-muted-foreground px-3 py-1 rounded-full text-sm capitalize border border-border/30">
                        {category}
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* Episode Section (for series/anime) */}
                {(content.type === 'series' || content.type === 'anime') && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <EpisodeSelector content={content} />
                  </motion.div>
                )}
              </div>

              {/* Right Column - Stats & Info */}
              <div className="space-y-6">
                <motion.div
                  className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6 border border-border/50"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent" />
                    Informações
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avaliação</span>
                      <span className="font-semibold text-accent">{(content.rating / 10).toFixed(1)}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ano</span>
                      <span>{content.year}</span>
                    </div>
                    {content.language && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Idioma Original</span>
                        <span>{content.language}</span>
                      </div>
                    )}
                    {content.totalSeasons && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Temporadas</span>
                        <span>{content.totalSeasons}</span>
                      </div>
                    )}
                    {content.totalEpisodes && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Episódios</span>
                        <span>{content.totalEpisodes}</span>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Tags */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <h4 className="font-semibold">Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {content.isTrending && (
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Em Alta
                      </span>
                    )}
                    {content.isNewRelease && (
                      <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">
                        Novo Lançamento
                      </span>
                    )}
                    {content.isPopular && (
                      <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        Popular
                      </span>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Similar Content Section */}
            {similarContent.length > 0 && (
              <motion.div
                className="border-t border-border pt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Conteúdo Relacionado
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {similarContent.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className="group cursor-pointer"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      data-testid={`similar-content-${item.id}`}
                    >
                      <div className="relative overflow-hidden rounded-lg bg-muted">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title}
                          className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <h4 className="text-white text-xs font-semibold line-clamp-2">{item.title}</h4>
                          <p className="text-white/80 text-xs">{item.year}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold flex-1 sm:flex-none"
                  data-testid="modal-play-button"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Assistir Agora
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="bg-card hover:bg-muted text-card-foreground px-8 py-3 rounded-lg font-semibold border-border flex-1 sm:flex-none"
                  data-testid="modal-add-list-button"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar à Lista
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}