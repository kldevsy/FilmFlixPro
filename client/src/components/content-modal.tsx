import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Plus, Star, Calendar, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Content } from "@shared/schema";

interface ContentModalProps {
  content: Content | null;
  onClose: () => void;
}

export default function ContentModal({ content, onClose }: ContentModalProps) {
  if (!content) return null;

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

          {/* Hero Section */}
          <div className="relative h-64 sm:h-80">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.8)), url('${content.imageUrl}')`
              }}
            />
            <div className="absolute bottom-6 left-6 right-6">
              <motion.h1
                className="text-3xl sm:text-4xl font-bold mb-4 text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                data-testid="modal-title"
              >
                {content.title}
              </motion.h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-accent fill-current" />
                  <span className="font-semibold">{(content.rating / 10).toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{content.year}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{content.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  <span>{content.genre}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Sinopse</h3>
              <p className="text-muted-foreground leading-relaxed">{content.description}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {content.isTrending && (
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  Em Alta
                </span>
              )}
              {content.isNewRelease && (
                <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-medium">
                  Novo Lançamento
                </span>
              )}
              {content.isPopular && (
                <span className="bg-secondary/20 text-secondary px-3 py-1 rounded-full text-sm font-medium">
                  Popular
                </span>
              )}
            </div>

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