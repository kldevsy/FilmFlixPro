// Blueprint integration: javascript_log_in_with_replit - Routes with auth integration
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertProfileSchema, 
  insertWatchHistorySchema, 
  insertContentSchema,
  insertSubscriptionPlanSchema,
  insertUserSubscriptionSchema,
  insertNotificationSchema
} from "@shared/schema";

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

  // Admin user management routes
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Falha ao buscar usuários" });
    }
  });

  app.put("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Falha ao atualizar usuário" });
    }
  });

  // Subscription Plans routes
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getActiveSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Falha ao buscar planos" });
    }
  });

  app.get("/api/admin/subscription-plans", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching all subscription plans:", error);
      res.status(500).json({ message: "Falha ao buscar planos" });
    }
  });

  app.post("/api/admin/subscription-plans", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const planData = insertSubscriptionPlanSchema.parse(req.body);
      const plan = await storage.createSubscriptionPlan(planData);
      res.json(plan);
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ message: "Falha ao criar plano" });
    }
  });

  app.put("/api/admin/subscription-plans/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateSchema = insertSubscriptionPlanSchema.partial();
      const updates = updateSchema.parse(req.body);
      const plan = await storage.updateSubscriptionPlan(id, updates);
      res.json(plan);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ message: "Falha ao atualizar plano" });
    }
  });

  app.delete("/api/admin/subscription-plans/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSubscriptionPlan(id);
      res.json({ message: "Plano deletado com sucesso" });
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      res.status(500).json({ message: "Falha ao deletar plano" });
    }
  });

  // User Subscription routes
  app.get("/api/user/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getUserActiveSubscription(userId);
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      res.status(500).json({ message: "Falha ao buscar assinatura" });
    }
  });

  app.post("/api/user/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptionData = {
        ...insertUserSubscriptionSchema.parse(req.body),
        userId
      };
      
      const subscription = await storage.createUserSubscription(subscriptionData);
      res.json(subscription);
    } catch (error) {
      console.error("Error creating user subscription:", error);
      res.status(500).json({ message: "Falha ao criar assinatura" });
    }
  });

  app.post("/api/admin/users/:userId/extend-subscription", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { days } = req.body;
      
      if (!days || days <= 0) {
        return res.status(400).json({ message: "Número de dias deve ser maior que zero" });
      }
      
      const subscription = await storage.extendUserSubscription(userId, days);
      res.json(subscription);
    } catch (error) {
      console.error("Error extending user subscription:", error);
      res.status(500).json({ message: "Falha ao estender assinatura" });
    }
  });

  app.post("/api/admin/users/:userId/cancel-subscription", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const subscription = await storage.cancelUserSubscription(userId);
      res.json(subscription);
    } catch (error) {
      console.error("Error canceling user subscription:", error);
      res.status(500).json({ message: "Falha ao cancelar assinatura" });
    }
  });

  // Subscription verification middleware for content access
  const checkSubscription = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      const hasActiveSubscription = await storage.checkSubscriptionExpiry(userId);
      
      if (!hasActiveSubscription) {
        return res.status(403).json({ 
          message: "Assinatura expirada ou inativa",
          requiresSubscription: true
        });
      }
      
      next();
    } catch (error) {
      console.error("Error checking subscription:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  };

  // Protected content routes that require active subscription
  app.get("/api/content/:id/watch", isAuthenticated, checkSubscription, async (req, res) => {
    try {
      const { id } = req.params;
      const content = await storage.getContentById(id);
      if (!content) {
        return res.status(404).json({ message: "Conteúdo não encontrado" });
      }
      res.json({ message: "Acesso autorizado", content });
    } catch (error) {
      console.error("Error accessing content:", error);
      res.status(500).json({ message: "Falha ao acessar conteúdo" });
    }
  });

  // Notifications routes
  app.get("/api/user/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Falha ao buscar notificações" });
    }
  });

  app.get("/api/user/notifications/unread", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUnreadNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      res.status(500).json({ message: "Falha ao buscar notificações não lidas" });
    }
  });

  app.post("/api/user/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notificationData = {
        ...insertNotificationSchema.parse(req.body),
        userId
      };
      
      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Falha ao criar notificação" });
    }
  });

  app.put("/api/user/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Falha ao marcar notificação como lida" });
    }
  });

  app.post("/api/user/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "Todas as notificações foram marcadas como lidas" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Falha ao marcar todas as notificações como lidas" });
    }
  });

  app.delete("/api/user/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(id);
      res.json({ message: "Notificação deletada com sucesso" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Falha ao deletar notificação" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
