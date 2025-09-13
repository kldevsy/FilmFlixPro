import { motion } from "framer-motion";
import ContentCard from "./content-card";
import { useNewReleases, useContentByType } from "@/hooks/use-content";
import type { Content } from "@shared/schema";

interface ContentGridProps {
  type: "new-releases";
  selectedCategory: string;
  onContentClick?: (content: Content) => void;
}

export default function ContentGrid({ type, selectedCategory, onContentClick }: ContentGridProps) {
  const { data: newReleases = [] } = useNewReleases();
  const { data: filteredContent = [] } = useContentByType(selectedCategory);
  
  let content = newReleases;
  if (selectedCategory !== "all") {
    content = filteredContent.filter(item => item.isNewRelease);
  }

  if (content.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted rounded-xl h-80"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6" data-testid="content-grid">
      {content.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          onClick={() => onContentClick?.(item)}
          className="cursor-pointer"
        >
          <ContentCard content={item} variant="grid" />
        </motion.div>
      ))}
    </div>
  );
}
