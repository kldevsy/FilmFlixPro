import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import type { Content } from "@shared/schema";

interface ContinueWatchingItem extends Content {
  progress: number;
  episodeNumber?: number | null;
  seasonNumber?: number | null;
  watchedAt: Date;
}

interface ContinueWatchingCarouselProps {
  items: ContinueWatchingItem[];
  onItemClick: (item: ContinueWatchingItem) => void;
}

export default function ContinueWatchingCarousel({ items, onItemClick }: ContinueWatchingCarouselProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      const targetScrollLeft = direction === 'left' 
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;
      
      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      );
    }
  };

  const formatProgress = (progress: number) => {
    return `${Math.round(progress)}%`;
  };

  const getWatchingText = (item: ContinueWatchingItem) => {
    if (item.type === 'series' || item.type === 'anime') {
      if (item.episodeNumber && item.seasonNumber) {
        return `T${item.seasonNumber} E${item.episodeNumber}`;
      } else if (item.episodeNumber) {
        return `Episódio ${item.episodeNumber}`;
      }
    }
    return null;
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <motion.h2 
          className="text-2xl font-bold text-white flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <RotateCcw className="w-6 h-6 text-primary" />
          Continue Assistindo
        </motion.h2>
      </div>

      <div className="relative group">
        {/* Navigation Buttons */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={() => scroll('left')}
            data-testid="scroll-left-continue-watching"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        
        {canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={() => scroll('right')}
            data-testid="scroll-right-continue-watching"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}

        {/* Content Carousel */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          onScroll={handleScroll}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, index) => (
            <motion.div
              key={`${item.id}-${item.episodeNumber || 'movie'}`}
              className="flex-none w-80 group cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => onItemClick(item)}
              data-testid={`continue-watching-item-${item.id}`}
            >
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700 group-hover:border-primary/50 transition-all duration-300">
                {/* Thumbnail */}
                <div className="relative h-44">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                      <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                    <div 
                      className="h-full bg-primary transition-all duration-300 group-hover:bg-primary/80"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>

                {/* Content Info */}
                <div className="p-4">
                  <h3 className="text-white font-bold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors" data-testid={`text-title-${item.id}`}>
                    {item.title}
                  </h3>
                  
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                    <span className="text-primary font-medium">
                      {formatProgress(item.progress)} assistido
                    </span>
                    {getWatchingText(item) && (
                      <span className="text-gray-300">
                        {getWatchingText(item)}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-300 text-sm line-clamp-2">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span className="bg-gray-700 px-2 py-1 rounded">
                        {item.ageRating || 'L'}
                      </span>
                      <span>{item.year}</span>
                      <span className="capitalize">{item.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}