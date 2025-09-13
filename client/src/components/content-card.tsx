import { motion } from "framer-motion";
import { Play, Plus, Info, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Content } from "@shared/schema";

interface ContentCardProps {
  content: Content;
  variant: "carousel" | "grid" | "popular";
  ranking?: number;
}

export default function ContentCard({ content, variant, ranking }: ContentCardProps) {
  const cardVariants = {
    hover: {
      y: variant === "grid" ? -8 : -8,
      scale: variant === "grid" ? 1.02 : 1.02,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  const overlayVariants = {
    initial: { opacity: 0, y: 20 },
    hover: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  if (variant === "carousel") {
    return (
      <motion.div 
        className="group cursor-pointer"
        variants={cardVariants}
        whileHover="hover"
        data-testid={`content-card-${content.id}`}
      >
        <div className="relative overflow-hidden rounded-xl">
          <img 
            src={content.imageUrl} 
            alt={content.title}
            className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {ranking && (
            <div className="absolute top-4 left-4 bg-accent text-accent-foreground px-2 py-1 rounded text-sm font-semibold">
              #{ranking}
            </div>
          )}
          
          <motion.div 
            className="absolute bottom-4 left-4 right-4"
            variants={overlayVariants}
            initial="initial"
            whileHover="hover"
          >
            <h3 className="text-xl font-bold mb-2">{content.title}</h3>
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex text-accent text-sm">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-3 h-3 ${i < Math.floor(content.rating / 20) ? 'fill-current' : ''}`} 
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{(content.rating / 10).toFixed(1)}</span>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                <Play className="w-3 h-3 mr-1" />
                Assistir
              </Button>
              <Button size="sm" variant="ghost" className="bg-card/80 hover:bg-card text-card-foreground">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (variant === "grid") {
    return (
      <motion.div 
        className="group cursor-pointer"
        variants={cardVariants}
        whileHover="hover"
        data-testid={`content-card-${content.id}`}
      >
        <div className="relative overflow-hidden rounded-xl bg-card">
          <img 
            src={content.imageUrl} 
            alt={content.title}
            className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          {content.isNewRelease && (
            <div className="absolute top-3 right-3 bg-accent text-accent-foreground px-2 py-1 rounded text-xs font-semibold">
              NOVO
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-bold text-lg mb-1">{content.title}</h3>
            <p className="text-muted-foreground text-sm mb-2">{content.year}</p>
            <div className="flex items-center space-x-2">
              <div className="flex text-accent text-xs">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-3 h-3 ${i < Math.floor(content.rating / 20) ? 'fill-current' : ''}`} 
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{(content.rating / 10).toFixed(1)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Popular variant
  return (
    <motion.div 
      className="group cursor-pointer"
      variants={cardVariants}
      whileHover="hover"
      data-testid={`content-card-${content.id}`}
    >
      <div className="bg-card rounded-xl overflow-hidden shadow-lg">
        <img 
          src={content.imageUrl} 
          alt={content.title}
          className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold">{content.title}</h3>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-accent fill-current" />
              <span className="text-sm font-semibold">{(content.rating / 10).toFixed(1)}</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {content.description}
          </p>
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2 text-xs text-muted-foreground">
              <span>{content.year}</span>
              <span>•</span>
              <span>{content.genre}</span>
              <span>•</span>
              <span>{content.duration}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <Play className="w-3 h-3 mr-1" />
              Assistir
            </Button>
            <Button size="sm" variant="ghost" className="bg-muted hover:bg-muted/80 text-muted-foreground">
              <Info className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
