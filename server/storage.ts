import { type Content, type InsertContent } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getContent(): Promise<Content[]>;
  getContentByType(type: string): Promise<Content[]>;
  getTrendingContent(): Promise<Content[]>;
  getNewReleases(): Promise<Content[]>;
  getPopularContent(): Promise<Content[]>;
  getContentById(id: string): Promise<Content | undefined>;
  createContent(content: InsertContent): Promise<Content>;
  searchContent(query: string): Promise<Content[]>;
}

export class MemStorage implements IStorage {
  private content: Map<string, Content>;

  constructor() {
    this.content = new Map();
    this.seedData();
  }

  private seedData() {
    const sampleContent: Omit<Content, "id" | "createdAt">[] = [
      {
        title: "Blade Runner 2049",
        description: "Uma sequência visualmente deslumbrante que expande o universo cyberpunk com uma narrativa profunda sobre humanidade e identidade.",
        year: 2017,
        rating: 92,
        genre: "Sci-Fi",
        type: "movie",
        imageUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        isTrending: true,
        isNewRelease: false,
        isPopular: true,
        duration: "2h 44min"
      },
      {
        title: "Missão Impossível",
        description: "Ethan Hunt e sua equipe enfrentam sua missão mais perigosa até agora.",
        year: 2023,
        rating: 88,
        genre: "Ação",
        type: "movie",
        imageUrl: "https://images.unsplash.com/photo-1635805737707-575885ab0820?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        isTrending: true,
        isNewRelease: true,
        isPopular: false,
        duration: "2h 30min"
      },
      {
        title: "Dark Waters",
        description: "Um thriller psicológico que mergulha nas profundezas da mente humana.",
        year: 2023,
        rating: 82,
        genre: "Thriller",
        type: "movie",
        imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        isTrending: true,
        isNewRelease: false,
        isPopular: false,
        duration: "1h 58min"
      },
      {
        title: "Demon Slayer",
        description: "Tanjiro continua sua jornada para salvar sua irmã e derrotar os demônios.",
        year: 2023,
        rating: 95,
        genre: "Ação",
        type: "anime",
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        isTrending: true,
        isNewRelease: true,
        isPopular: true,
        duration: "3 temporadas"
      },
      {
        title: "Stranger Things",
        description: "As aventuras sobrenaturais continuam em Hawkins.",
        year: 2023,
        rating: 87,
        genre: "Ficção Científica",
        type: "series",
        imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        isTrending: true,
        isNewRelease: false,
        isPopular: true,
        duration: "4 temporadas"
      },
      {
        title: "The Batman",
        description: "Uma nova visão sombria do Cavaleiro das Trevas.",
        year: 2022,
        rating: 89,
        genre: "Super-herói",
        type: "movie",
        imageUrl: "https://images.unsplash.com/photo-1635805737707-575885ab0820?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        isTrending: false,
        isNewRelease: true,
        isPopular: false,
        duration: "2h 56min"
      },
      {
        title: "Dune",
        description: "A épica adaptação do clássico da ficção científica.",
        year: 2021,
        rating: 91,
        genre: "Ficção Científica",
        type: "movie",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        isTrending: false,
        isNewRelease: true,
        isPopular: true,
        duration: "2h 35min"
      },
      {
        title: "Your Name",
        description: "Uma história de amor que transcende tempo e espaço.",
        year: 2016,
        rating: 87,
        genre: "Romance",
        type: "anime",
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        isTrending: false,
        isNewRelease: true,
        isPopular: false,
        duration: "1h 46min"
      },
      {
        title: "Breaking Bad",
        description: "Um professor de química se torna o melhor fabricante de metanfetamina do mundo.",
        year: 2008,
        rating: 95,
        genre: "Drama",
        type: "series",
        imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        isTrending: false,
        isNewRelease: false,
        isPopular: true,
        duration: "5 temporadas"
      },
      {
        title: "Attack on Titan",
        description: "Humanidade luta pela sobrevivência contra titãs gigantes.",
        year: 2013,
        rating: 90,
        genre: "Ação",
        type: "anime",
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        isTrending: false,
        isNewRelease: false,
        isPopular: true,
        duration: "4 temporadas"
      }
    ];

    sampleContent.forEach(item => {
      const id = randomUUID();
      const content: Content = {
        ...item,
        id,
        createdAt: new Date()
      };
      this.content.set(id, content);
    });
  }

  async getContent(): Promise<Content[]> {
    return Array.from(this.content.values());
  }

  async getContentByType(type: string): Promise<Content[]> {
    return Array.from(this.content.values()).filter(
      (content) => content.type === type
    );
  }

  async getTrendingContent(): Promise<Content[]> {
    return Array.from(this.content.values()).filter(
      (content) => content.isTrending
    );
  }

  async getNewReleases(): Promise<Content[]> {
    return Array.from(this.content.values()).filter(
      (content) => content.isNewRelease
    );
  }

  async getPopularContent(): Promise<Content[]> {
    return Array.from(this.content.values()).filter(
      (content) => content.isPopular
    );
  }

  async getContentById(id: string): Promise<Content | undefined> {
    return this.content.get(id);
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const id = randomUUID();
    const content: Content = {
      ...insertContent,
      id,
      duration: insertContent.duration ?? null,
      isTrending: insertContent.isTrending ?? null,
      isNewRelease: insertContent.isNewRelease ?? null,
      isPopular: insertContent.isPopular ?? null,
      createdAt: new Date()
    };
    this.content.set(id, content);
    return content;
  }

  async searchContent(query: string): Promise<Content[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.content.values()).filter(
      (content) =>
        content.title.toLowerCase().includes(lowerQuery) ||
        content.description.toLowerCase().includes(lowerQuery) ||
        content.genre.toLowerCase().includes(lowerQuery)
    );
  }
}

export const storage = new MemStorage();
