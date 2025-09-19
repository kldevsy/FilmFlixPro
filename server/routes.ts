// Blueprint integration: javascript_log_in_with_replit - Routes with auth integration
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProfileSchema, insertWatchHistorySchema, insertContentSchema } from "@shared/schema";

// Admin authorization middleware
const isAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Acesso negado. Privilégios de administrador necessários." });
    }
    
    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - Blueprint integration: javascript_log_in_with_replit
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile routes
  app.get('/api/profiles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profiles = await storage.getProfilesByUser(userId);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  app.post('/api/profiles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = insertProfileSchema.parse({ ...req.body, userId });
      const profile = await storage.createProfile(profileData);
      res.json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.put('/api/profiles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const updates = req.body;
      
      // Check if profile belongs to the user
      const existingProfile = await storage.getProfile(id);
      if (!existingProfile || existingProfile.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const profile = await storage.updateProfile(id, updates);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.delete('/api/profiles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Check if profile belongs to the user
      const existingProfile = await storage.getProfile(id);
      if (!existingProfile || existingProfile.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteProfile(id);
      res.json({ message: "Profile deleted successfully" });
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ message: "Failed to delete profile" });
    }
  });

  // Watch history routes
  app.get('/api/profiles/:profileId/watch-history', isAuthenticated, async (req: any, res) => {
    try {
      const { profileId } = req.params;
      const userId = req.user.claims.sub;
      
      // Check if profile belongs to the user
      const profile = await storage.getProfile(profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const history = await storage.getWatchHistory(profileId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching watch history:", error);
      res.status(500).json({ message: "Failed to fetch watch history" });
    }
  });

  // Get continue watching content for a profile
  app.get('/api/profiles/:profileId/continue-watching', isAuthenticated, async (req: any, res) => {
    try {
      const { profileId } = req.params;
      const userId = req.user.claims.sub;
      
      // Check if profile belongs to the user
      const profile = await storage.getProfile(profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const continueWatching = await storage.getContinueWatching(profileId);
      res.json(continueWatching);
    } catch (error) {
      console.error("Error fetching continue watching:", error);
      res.status(500).json({ message: "Failed to fetch continue watching" });
    }
  });

  app.post('/api/profiles/:profileId/watch-progress', isAuthenticated, async (req: any, res) => {
    try {
      const { profileId } = req.params;
      const userId = req.user.claims.sub;
      
      // Check if profile belongs to the user
      const profile = await storage.getProfile(profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const watchData = insertWatchHistorySchema.parse({ ...req.body, profileId });
      const watchHistory = await storage.updateWatchProgress(watchData);
      res.json(watchHistory);
    } catch (error) {
      console.error("Error updating watch progress:", error);
      res.status(500).json({ message: "Failed to update watch progress" });
    }
  });

  // Content routes - protected with authentication
  // Get all content
  app.get("/api/content", isAuthenticated, async (req, res) => {
    try {
      const content = await storage.getContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  // Get content by type
  app.get("/api/content/type/:type", isAuthenticated, async (req, res) => {
    try {
      const { type } = req.params;
      const content = await storage.getContentByType(type);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content by type" });
    }
  });

  // Get trending content
  app.get("/api/content/trending", isAuthenticated, async (req, res) => {
    try {
      const content = await storage.getTrendingContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trending content" });
    }
  });

  // Get new releases
  app.get("/api/content/new-releases", isAuthenticated, async (req, res) => {
    try {
      const content = await storage.getNewReleases();
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch new releases" });
    }
  });

  // Get popular content
  app.get("/api/content/popular", isAuthenticated, async (req, res) => {
    try {
      const content = await storage.getPopularContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch popular content" });
    }
  });

  // Search content
  app.get("/api/content/search", isAuthenticated, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }
      const content = await storage.searchContent(q);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to search content" });
    }
  });

  // Get content by ID
  app.get("/api/content/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const content = await storage.getContentById(id);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  // Admin routes for content management
  app.post("/api/admin/content", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const contentData = insertContentSchema.parse(req.body);
      const content = await storage.createContent(contentData);
      res.json(content);
    } catch (error) {
      console.error("Error creating content:", error);
      res.status(500).json({ message: "Falha ao criar conteúdo" });
    }
  });

  app.put("/api/admin/content/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      // Validate updates using partial content schema
      const updateSchema = insertContentSchema.partial();
      const updates = updateSchema.parse(req.body);
      const content = await storage.updateContent(id, updates);
      res.json(content);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Falha ao atualizar conteúdo" });
    }
  });

  app.delete("/api/admin/content/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteContent(id);
      res.json({ message: "Conteúdo deletado com sucesso" });
    } catch (error) {
      console.error("Error deleting content:", error);
      res.status(500).json({ message: "Falha ao deletar conteúdo" });
    }
  });

  // Admin route to make a user admin (for initial setup)
  app.post("/api/admin/make-user-admin/:userId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.makeUserAdmin(userId);
      res.json(user);
    } catch (error) {
      console.error("Error making user admin:", error);
      res.status(500).json({ message: "Falha ao tornar usuário administrador" });
    }
  });

  // Special route for first-time admin setup - only allows setting current user as admin if no admins exist
  app.post("/api/admin/bootstrap", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if any admin already exists in the system
      const hasAdmin = await storage.hasAnyAdmin();
      if (hasAdmin) {
        return res.status(409).json({ message: "Já existe um administrador no sistema" });
      }
      
      const user = await storage.makeUserAdmin(userId);
      res.json(user);
    } catch (error) {
      console.error("Error in admin bootstrap:", error);
      res.status(500).json({ message: "Falha ao configurar administrador inicial" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
