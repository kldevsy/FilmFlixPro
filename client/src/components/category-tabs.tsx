import { motion } from "framer-motion";

interface CategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: "all", label: "Todos" },
  { id: "movie", label: "Filmes" },
  { id: "series", label: "Séries" },
  { id: "anime", label: "Animes" },
];

export default function CategoryTabs({ selectedCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <section className="py-8 border-b border-border" data-testid="category-tabs">
      <div className="container mx-auto px-6">
        <div className="flex space-x-1 bg-muted rounded-lg p-1 max-w-md mx-auto">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              className={`flex-1 py-3 px-6 rounded-md text-sm font-semibold transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => onCategoryChange(category.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-testid={`category-tab-${category.id}`}
            >
              {category.label}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
