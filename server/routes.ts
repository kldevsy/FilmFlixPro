// Blueprint integration: javascript_log_in_with_replit - Routes with auth integration
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProfileSchema, insertWatchHistorySchema } from "@shared/schema";

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
      const updates = req.body;
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
      await storage.deleteProfile(id);
      res.json({ message: "Profile deleted successfully" });
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ message: "Failed to delete profile" });
    }
  });

  // Watch history routes
  app.get('/api/profiles/:profileId/watch-history', isAuthenticated, async (req, res) => {
    try {
      const { profileId } = req.params;
      const history = await storage.getWatchHistory(profileId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching watch history:", error);
      res.status(500).json({ message: "Failed to fetch watch history" });
    }
  });

  app.post('/api/profiles/:profileId/watch-progress', isAuthenticated, async (req, res) => {
    try {
      const { profileId } = req.params;
      const watchData = insertWatchHistorySchema.parse({ ...req.body, profileId });
      const watchHistory = await storage.updateWatchProgress(watchData);
      res.json(watchHistory);
    } catch (error) {
      console.error("Error updating watch progress:", error);
      res.status(500).json({ message: "Failed to update watch progress" });
    }
  });

  // Content routes (public access for now)
  // Get all content
  app.get("/api/content", async (req, res) => {
    try {
      const content = await storage.getContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  // Get content by type
  app.get("/api/content/type/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const content = await storage.getContentByType(type);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content by type" });
    }
  });

  // Get trending content
  app.get("/api/content/trending", async (req, res) => {
    try {
      const content = await storage.getTrendingContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trending content" });
    }
  });

  // Get new releases
  app.get("/api/content/new-releases", async (req, res) => {
    try {
      const content = await storage.getNewReleases();
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch new releases" });
    }
  });

  // Get popular content
  app.get("/api/content/popular", async (req, res) => {
    try {
      const content = await storage.getPopularContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch popular content" });
    }
  });

  // Search content
  app.get("/api/content/search", async (req, res) => {
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
  app.get("/api/content/:id", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
