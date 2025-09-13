import { motion } from "framer-motion";
import Navigation from "@/components/navigation";
import HeroCarousel from "@/components/hero-carousel";
import CategoryTabs from "@/components/category-tabs";
import ContentCarousel from "@/components/content-carousel";
import ContentGrid from "@/components/content-grid";
import ContentModal from "@/components/content-modal";
import Footer from "@/components/footer";
import { useState } from "react";
import type { Content } from "@shared/schema";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navigation />
      <HeroCarousel />
      <CategoryTabs selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
      
      <motion.section 
        className="py-16 streaming-gradient"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2" data-testid="trending-title">Tendências</h2>
              <p className="text-muted-foreground text-lg">Os mais assistidos esta semana</p>
            </div>
            <button className="text-primary hover:text-primary/80 font-semibold transition-colors" data-testid="view-all-trending">
              Ver Todos <i className="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
          <ContentCarousel type="trending" onContentClick={setSelectedContent} />
        </div>
      </motion.section>

      <motion.section 
        className="py-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2" data-testid="new-releases-title">Novos Lançamentos</h2>
              <p className="text-muted-foreground text-lg">Acabaram de chegar na plataforma</p>
            </div>
            <button className="text-primary hover:text-primary/80 font-semibold transition-colors" data-testid="view-all-new-releases">
              Ver Todos <i className="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
          <ContentGrid type="new-releases" selectedCategory={selectedCategory} />
        </div>
      </motion.section>

      <motion.section 
        className="py-16 bg-card/30"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2" data-testid="popular-title">Populares</h2>
              <p className="text-muted-foreground text-lg">Os favoritos da comunidade</p>
            </div>
            <button className="text-primary hover:text-primary/80 font-semibold transition-colors" data-testid="view-all-popular">
              Ver Todos <i className="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
          <ContentCarousel type="popular" onContentClick={setSelectedContent} />
        </div>
      </motion.section>

      <ContentModal 
        content={selectedContent} 
        onClose={() => setSelectedContent(null)} 
      />

      <Footer />
    </div>
  );
}
