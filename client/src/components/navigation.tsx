import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Bell, User, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <motion.nav 
      className="fixed top-0 w-full z-50 nav-blur border-b border-border transition-all duration-300"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Play className="text-primary-foreground text-lg" />
            </div>
            <h1 className="text-2xl font-bold text-gradient" data-testid="logo">StreamFlix</h1>
          </motion.div>
          
          {/* Navigation Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <motion.a 
              href="#" 
              className="text-foreground hover:text-primary transition-colors font-medium"
              whileHover={{ scale: 1.05 }}
              data-testid="nav-home"
            >
              Início
            </motion.a>
            <motion.a 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
              whileHover={{ scale: 1.05 }}
              data-testid="nav-movies"
            >
              Filmes
            </motion.a>
            <motion.a 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
              whileHover={{ scale: 1.05 }}
              data-testid="nav-series"
            >
              Séries
            </motion.a>
            <motion.a 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
              whileHover={{ scale: 1.05 }}
              data-testid="nav-anime"
            >
              Animes
            </motion.a>
            <motion.a 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
              whileHover={{ scale: 1.05 }}
              data-testid="nav-my-list"
            >
              Minha Lista
            </motion.a>
          </div>
          
          {/* Search and Profile */}
          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block">
              <motion.div
                animate={{ 
                  scale: isSearchFocused ? 1.02 : 1,
                  boxShadow: isSearchFocused ? "0 0 20px rgba(139, 92, 246, 0.3)" : "none"
                }}
                transition={{ duration: 0.2 }}
              >
                <Input
                  type="text"
                  placeholder="Buscar..."
                  className="bg-input border border-border rounded-lg px-4 py-2 pl-10 w-64 focus:outline-none focus:border-primary transition-all duration-300"
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  data-testid="search-input"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              </motion.div>
            </div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-card hover:bg-muted rounded-lg transition-colors"
                data-testid="notifications-button"
              >
                <Bell className="w-4 h-4 text-muted-foreground" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-card hover:bg-muted rounded-lg transition-colors"
                data-testid="profile-button"
              >
                <User className="w-4 h-4 text-muted-foreground" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
