import { motion } from "framer-motion";
import { Play, Facebook, Twitter, Instagram, Youtube, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  return (
    <footer className="bg-card/50 border-t border-border py-16" data-testid="footer">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Play className="text-primary-foreground text-lg" />
              </div>
              <h3 className="text-2xl font-bold text-gradient">StreamFlix</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              A melhor experiência em streaming com os melhores filmes, séries e animes do mundo.
            </p>
            <div className="flex space-x-4">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg">
                  <Facebook className="w-4 h-4" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg">
                  <Twitter className="w-4 h-4" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg">
                  <Instagram className="w-4 h-4" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg">
                  <Youtube className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Navigation Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-4">Navegação</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Início</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Filmes</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Séries</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Animes</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Minha Lista</a></li>
            </ul>
          </motion.div>
          
          {/* Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Centro de Ajuda</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contato</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a></li>
            </ul>
          </motion.div>
          
          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-4">Newsletter</h4>
            <p className="text-muted-foreground mb-4">
              Receba as últimas novidades e lançamentos diretamente no seu email.
            </p>
            <div className="flex space-x-2">
              <Input
                type="email"
                placeholder="Seu email"
                className="flex-1 bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                data-testid="newsletter-input"
              />
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-semibold transition-colors" data-testid="newsletter-submit">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>
        
        {/* Bottom Bar */}
        <motion.div 
          className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="text-muted-foreground text-sm">
            © 2024 StreamFlix. Todos os direitos reservados.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <select className="bg-muted text-muted-foreground px-3 py-1 rounded border border-border text-sm">
              <option>Português (BR)</option>
              <option>English</option>
              <option>Español</option>
            </select>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>4K</span>
              <span>HDR</span>
              <span>DOLBY</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
