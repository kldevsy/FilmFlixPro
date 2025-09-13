import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
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
