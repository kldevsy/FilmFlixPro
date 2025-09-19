import { motion } from "framer-motion";
import AuthHeader from "@/components/auth-header";
import HeroCarousel from "@/components/hero-carousel";
import AdvancedFilters, { type FilterState } from "@/components/advanced-filters";
import ContentCarousel from "@/components/content-carousel";
import ContinueWatchingCarousel from "@/components/continue-watching-carousel";
import ContentGrid from "@/components/content-grid";
import ContentModal from "@/components/content-modal";
import Footer from "@/components/footer";
import { useState, useMemo } from "react";
import { useContent } from "@/hooks/use-content";
import { useSubscription } from "@/hooks/useSubscription";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, AlertTriangle, Lock, Calendar, CreditCard } from "lucide-react";
import type { Content } from "@shared/schema";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    type: "all",
    ageRating: [],
    categories: [],
    yearRange: { min: 1990, max: 2024 },
    ratingRange: { min: 0, max: 10 },
    country: [],
    language: [],
    sortBy: "popularity"
  });
  
  const { data: allContent = [] } = useContent();
  
  const { 
    subscription, 
    plans, 
    hasActiveSubscription, 
    subscriptionExpired, 
    subscriptionExpiringSoon,
    isAuthenticated 
  } = useSubscription();
  
  // Get current profile ID from localStorage
  const selectedProfileId = localStorage.getItem('selectedProfileId');
  
  // Fetch continue watching data
  const { data: continueWatchingData = [] } = useQuery<any[]>({
    queryKey: ['/api/profiles', selectedProfileId, 'continue-watching'],
    enabled: !!selectedProfileId,
  });
  
  // Filter and sort content based on active filters
  const filteredContent = useMemo(() => {
    let filtered = [...allContent];
    
    // Filter by type
    if (filters.type !== "all") {
      filtered = filtered.filter(item => item.type === filters.type);
    }
    
    // Filter by age rating
    if (filters.ageRating.length > 0) {
      filtered = filtered.filter(item => 
        filters.ageRating.includes(item.ageRating || "L")
      );
    }
    
    // Filter by categories (case-insensitive)
    if (filters.categories.length > 0) {
      filtered = filtered.filter(item => 
        item.categories?.some(cat => 
          filters.categories.some(filterCat => 
            cat.toLowerCase().includes(filterCat.toLowerCase())
          )
        )
      );
    }
    
    // Filter by year range
    filtered = filtered.filter(item => 
      item.year >= filters.yearRange.min && item.year <= filters.yearRange.max
    );
    
    // Filter by rating range (normalize 0-100 to 0-10)
    filtered = filtered.filter(item => 
      (item.rating / 10) >= filters.ratingRange.min && (item.rating / 10) <= filters.ratingRange.max
    );
    
    // Filter by country (case-insensitive)
    if (filters.country.length > 0) {
      filtered = filtered.filter(item => 
        filters.country.some(country => 
          (item.country || "").toLowerCase().includes(country.toLowerCase())
        )
      );
    }
    
    // Filter by language (case-insensitive)
    if (filters.language.length > 0) {
      filtered = filtered.filter(item => 
        filters.language.some(language => 
          (item.language || "").toLowerCase().includes(language.toLowerCase())
        )
      );
    }
    
    // Sort content
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "year":
          return b.year - a.year;
        case "title":
          return a.title.localeCompare(b.title);
        case "popularity":
        default:
          return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
      }
    });
    
    return filtered;
  }, [allContent, filters]);

  // Format subscription end date
  const formatSubscriptionDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  };

  // Calculate days until subscription expires
  const getDaysUntilExpiry = (endDate: string | Date) => {
    const now = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <AuthHeader />
      <HeroCarousel />
      
      {/* Subscription Status Banner */}
      {isAuthenticated && (
        <>
          {/* No Subscription */}
          {!hasActiveSubscription && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="container mx-auto px-4 py-4"
            >
              <Card className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-yellow-500/50 backdrop-blur-sm" data-testid="banner-no-subscription">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Crown className="w-8 h-8 text-yellow-400" />
                        <Lock className="w-4 h-4 text-yellow-600 absolute -bottom-1 -right-1" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-yellow-400 mb-1">
                          Assine para ter acesso completo
                        </h3>
                        <p className="text-yellow-100 text-sm">
                          Desbloqueie todo o catálogo e assista sem limites
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        variant="outline" 
                        className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors"
                        data-testid="button-view-plans"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Ver Planos
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Subscription Expired */}
          {subscriptionExpired && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="container mx-auto px-4 py-4"
            >
              <Card className="bg-gradient-to-r from-red-900/50 to-pink-900/50 border-red-500/50 backdrop-blur-sm" data-testid="banner-subscription-expired">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                      <div>
                        <h3 className="text-lg font-bold text-red-400 mb-1">
                          Sua assinatura expirou
                        </h3>
                        <p className="text-red-100 text-sm">
                          Renove agora para continuar assistindo
                        </p>
                        {subscription && (
                          <p className="text-red-200 text-xs mt-1">
                            Expirou em: {formatSubscriptionDate(subscription.endDate)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        variant="destructive" 
                        className="bg-red-600 hover:bg-red-700"
                        data-testid="button-renew-subscription"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Renovar Agora
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Subscription Expiring Soon */}
          {hasActiveSubscription && !subscriptionExpired && subscriptionExpiringSoon && subscription && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="container mx-auto px-4 py-4"
            >
              <Card className="bg-gradient-to-r from-orange-900/50 to-yellow-900/50 border-orange-500/50 backdrop-blur-sm" data-testid="banner-subscription-expiring">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Calendar className="w-8 h-8 text-orange-400" />
                      <div>
                        <h3 className="text-lg font-bold text-orange-400 mb-1">
                          Sua assinatura expira em breve
                        </h3>
                        <p className="text-orange-100 text-sm">
                          {getDaysUntilExpiry(subscription.endDate)} dias restantes
                        </p>
                        <p className="text-orange-200 text-xs mt-1">
                          Expira em: {formatSubscriptionDate(subscription.endDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        variant="outline" 
                        className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-black transition-colors"
                        data-testid="button-extend-subscription"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Renovar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Active Subscription */}
          {hasActiveSubscription && !subscriptionExpired && !subscriptionExpiringSoon && subscription && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="container mx-auto px-4 py-2"
            >
              <Card className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-500/30 backdrop-blur-sm" data-testid="banner-subscription-active">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Crown className="w-6 h-6 text-green-400" />
                      <div>
                        <p className="text-green-400 text-sm font-medium">
                          Assinatura Ativa até {formatSubscriptionDate(subscription.endDate)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-green-400/50 text-green-400 text-xs" data-testid="badge-subscription-active">
                      Premium
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
      <AdvancedFilters 
        selectedCategory={selectedCategory} 
        onCategoryChange={setSelectedCategory}
        onFiltersChange={setFilters}
      />

      {/* Filtered Content Section */}
      {(filters.type !== "all" || filters.ageRating.length > 0 || filters.categories.length > 0 || filters.country.length > 0 || filters.language.length > 0 || filters.yearRange.min !== 1990 || filters.yearRange.max !== 2024 || filters.ratingRange.min !== 0 || filters.ratingRange.max !== 10) && (
        <motion.section 
          className="py-16 bg-card/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-bold mb-2" data-testid="filtered-content-title">
                  Resultados Filtrados
                </h2>
                <p className="text-muted-foreground text-lg">
                  {filteredContent.length} {filteredContent.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
                </p>
              </div>
            </div>
            
            {filteredContent.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {filteredContent.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="group cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    onClick={() => setSelectedContent(item)}
                    data-testid={`filtered-content-${item.id}`}
                  >
                    <div className="relative overflow-hidden rounded-lg bg-muted shadow-lg">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <h3 className="font-bold text-sm mb-1 line-clamp-2">{item.title}</h3>
                        <div className="flex items-center justify-between text-xs text-white/80">
                          <span>{item.year}</span>
                          <span>{(item.rating / 10).toFixed(1)}★</span>
                        </div>
                      </div>
                      
                      {/* Content Type Badge */}
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          item.type === 'movie' ? 'bg-blue-500 text-white' :
                          item.type === 'series' ? 'bg-green-500 text-white' :
                          'bg-purple-500 text-white'
                        }`}>
                          {item.type === 'movie' ? 'FILME' : item.type === 'series' ? 'SÉRIE' : 'ANIME'}
                        </span>
                      </div>
                      
                      {/* Age Rating Badge */}
                      {item.ageRating && (
                        <div className="absolute top-2 right-2">
                          <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                            {item.ageRating}+
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                className="text-center py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold mb-2">Nenhum resultado encontrado</h3>
                <p className="text-muted-foreground">Tente ajustar seus filtros para encontrar mais conteúdo</p>
              </motion.div>
            )}
          </div>
        </motion.section>
      )}
      
      {/* Continue Watching Section */}
      {continueWatchingData.length > 0 && (
        <motion.section 
          className="py-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="container mx-auto px-6">
            <ContinueWatchingCarousel 
              items={continueWatchingData} 
              onItemClick={setSelectedContent}
            />
          </div>
        </motion.section>
      )}
      
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
          <ContentGrid 
            type="new-releases" 
            selectedCategory={selectedCategory} 
            onContentClick={setSelectedContent}
          />
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
