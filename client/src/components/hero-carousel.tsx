import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTrendingContent } from "@/hooks/use-content";

export default function HeroCarousel() {
  const { data: trendingContent = [], isLoading } = useTrendingContent();
  const [currentSlide, setCurrentSlide] = useState(0);

  const featuredContent = trendingContent.slice(0, 3);

  useEffect(() => {
    if (featuredContent.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredContent.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredContent.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredContent.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredContent.length) % featuredContent.length);
  };

  if (isLoading || featuredContent.length === 0) {
    return (
      <section className="relative h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 hero-gradient"></div>
        <div className="relative container mx-auto px-6 h-full flex items-center">
          <div className="max-w-2xl">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded mb-4 w-32"></div>
              <div className="h-16 bg-muted rounded mb-6 w-96"></div>
              <div className="h-6 bg-muted rounded mb-8 w-80"></div>
              <div className="flex space-x-4">
                <div className="h-12 bg-muted rounded w-32"></div>
                <div className="h-12 bg-muted rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const currentContent = featuredContent[currentSlide];

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden pt-20" data-testid="hero-carousel">
      <div className="absolute inset-0 hero-gradient"></div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url('${currentContent.imageUrl}')`
          }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8 }}
        />
      </AnimatePresence>
      
      <div className="relative container mx-auto px-4 sm:px-6 h-full flex items-center overflow-hidden">
        <motion.div 
          className="max-w-4xl w-full overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div 
            className="mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold uppercase tracking-wide">
              Novo Lançamento
            </span>
          </motion.div>
          
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight break-words"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            data-testid="hero-title"
          >
            {currentContent.title.split(' ').map((word, index) => (
              <span key={index}>
                {index === currentContent.title.split(' ').length - 1 ? (
                  <span className="text-gradient">{word}</span>
                ) : (
                  word + ' '
                )}
              </span>
            ))}
          </motion.h1>
          
          <motion.p 
            className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl break-words"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            data-testid="hero-description"
          >
            {currentContent.description}
          </motion.p>
          
          <motion.div 
            className="flex items-center space-x-4 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <div className="flex items-center space-x-2">
              <div className="flex text-accent">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(currentContent.rating / 20) ? 'fill-current' : ''}`} 
                  />
                ))}
              </div>
              <span className="text-foreground font-semibold">{(currentContent.rating / 10).toFixed(1)}</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{currentContent.year}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{currentContent.duration}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{currentContent.genre}</span>
          </motion.div>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold text-base sm:text-lg transition-all duration-300 animate-glow w-full sm:w-auto"
                data-testid="play-button"
              >
                <Play className="w-5 h-5 mr-2" />
                Assistir Agora
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline"
                className="bg-card/80 hover:bg-card text-card-foreground px-8 py-4 rounded-lg font-semibold text-base sm:text-lg transition-all duration-300 border border-border w-full sm:w-auto"
                data-testid="add-to-list-button"
              >
                <Plus className="w-5 h-5 mr-2" />
                Minha Lista
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Carousel Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {featuredContent.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-primary' : 'bg-muted hover:bg-primary'
            }`}
            onClick={() => setCurrentSlide(index)}
            data-testid={`carousel-indicator-${index}`}
          />
        ))}
      </div>
      
      {/* Navigation Arrows */}
      <motion.button 
        className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-card/80 hover:bg-card text-card-foreground p-3 rounded-full transition-all duration-300"
        onClick={prevSlide}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        data-testid="carousel-prev"
      >
        <ChevronLeft className="w-6 h-6" />
      </motion.button>
      <motion.button 
        className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-card/80 hover:bg-card text-card-foreground p-3 rounded-full transition-all duration-300"
        onClick={nextSlide}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        data-testid="carousel-next"
      >
        <ChevronRight className="w-6 h-6" />
      </motion.button>
    </section>
  );
}
