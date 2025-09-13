import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContentCard from "./content-card";
import { useTrendingContent, usePopularContent } from "@/hooks/use-content";

interface ContentCarouselProps {
  type: "trending" | "popular";
}

export default function ContentCarousel({ type }: ContentCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const { data: trendingContent = [] } = useTrendingContent();
  const { data: popularContent = [] } = usePopularContent();
  
  const content = type === "trending" ? trendingContent : popularContent;
  const itemsPerView = 3;
  const maxIndex = Math.max(0, content.length - itemsPerView);

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  if (content.length === 0) {
    return (
      <div className="flex space-x-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-80 animate-pulse">
            <div className="bg-muted rounded-xl h-96"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden" data-testid={`${type}-carousel`}>
      <motion.div 
        className="flex space-x-6 transition-transform duration-500"
        animate={{ x: -currentIndex * (320 + 24) }} // 320px width + 24px gap
      >
        {content.map((item, index) => (
          <motion.div
            key={item.id}
            className="flex-shrink-0 w-80"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <ContentCard 
              content={item} 
              variant="carousel" 
              ranking={type === "trending" ? index + 1 : undefined}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Slider Controls */}
      {currentIndex > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4"
        >
          <Button
            variant="ghost"
            size="icon"
            className="bg-card/90 hover:bg-card text-card-foreground p-3 rounded-full shadow-lg"
            onClick={prevSlide}
            data-testid={`${type}-carousel-prev`}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </motion.div>
      )}
      
      {currentIndex < maxIndex && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4"
        >
          <Button
            variant="ghost"
            size="icon"
            className="bg-card/90 hover:bg-card text-card-foreground p-3 rounded-full shadow-lg"
            onClick={nextSlide}
            data-testid={`${type}-carousel-next`}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
