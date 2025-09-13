import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContentCard from "./content-card";
import { useTrendingContent, usePopularContent } from "@/hooks/use-content";
import type { Content } from "@shared/schema";

interface ContentCarouselProps {
  type: "trending" | "popular";
  onContentClick?: (content: Content) => void;
}

export default function ContentCarousel({ type, onContentClick }: ContentCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const carouselRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  
  const { data: trendingContent = [] } = useTrendingContent();
  const { data: popularContent = [] } = usePopularContent();
  
  const content = type === "trending" ? trendingContent : popularContent;
  const cardWidth = 320;
  const gap = 24;
  const totalWidth = content.length * (cardWidth + gap) - gap;
  const containerWidth = itemsPerView * (cardWidth + gap) - gap;
  
  const maxIndex = Math.max(0, content.length - itemsPerView);
  const maxDrag = Math.max(0, totalWidth - containerWidth);

  useEffect(() => {
    const updateItemsPerView = () => {
      if (typeof window !== 'undefined') {
        setItemsPerView(window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3);
      }
    };
    
    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  const nextSlide = () => {
    const newIndex = Math.min(currentIndex + 1, maxIndex);
    setCurrentIndex(newIndex);
    x.set(-newIndex * (cardWidth + gap));
  };

  const prevSlide = () => {
    const newIndex = Math.max(currentIndex - 1, 0);
    setCurrentIndex(newIndex);
    x.set(-newIndex * (cardWidth + gap));
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    if (Math.abs(offset) > 50 || Math.abs(velocity) > 500) {
      if (offset > 0 && currentIndex > 0) {
        prevSlide();
      } else if (offset < 0 && currentIndex < maxIndex) {
        nextSlide();
      } else {
        x.set(-currentIndex * (cardWidth + gap));
      }
    } else {
      x.set(-currentIndex * (cardWidth + gap));
    }
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
    <div className="relative overflow-hidden select-none" data-testid={`${type}-carousel`}>
      <motion.div 
        ref={carouselRef}
        className="flex space-x-6 cursor-grab active:cursor-grabbing"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -maxDrag, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: "grabbing" }}
      >
        {content.map((item, index) => (
          <motion.div
            key={item.id}
            className="flex-shrink-0 w-80 pointer-events-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div 
              className="pointer-events-auto"
              onClick={() => onContentClick?.(item)}
            >
              <ContentCard 
                content={item} 
                variant="carousel" 
                ranking={type === "trending" ? index + 1 : undefined}
              />
            </div>
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
