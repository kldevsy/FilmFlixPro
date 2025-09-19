import {
  content,
  users,
  profiles,
  watchHistory,
  type Content,
  type InsertContent,
  type User,
  type UpsertUser,
  type Profile,
  type InsertProfile,
  type WatchHistory,
  type InsertWatchHistory
} from "@shared/schema";
import { getDb, hasDb } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Content operations
  getContent(): Promise<Content[]>;
  getContentByType(type: string): Promise<Content[]>;
  getTrendingContent(): Promise<Content[]>;
  getNewReleases(): Promise<Content[]>;
  getPopularContent(): Promise<Content[]>;
  getContentById(id: string): Promise<Content | undefined>;
  createContent(content: InsertContent): Promise<Content>;
  searchContent(query: string): Promise<Content[]>;
  
  // User operations - required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Profile operations
  getProfilesByUser(userId: string): Promise<Profile[]>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  getProfile(id: string): Promise<Profile | undefined>;
  updateProfile(id: string, updates: Partial<InsertProfile>): Promise<Profile>;
  deleteProfile(id: string): Promise<void>;
  
  // Watch history operations
  getWatchHistory(profileId: string): Promise<WatchHistory[]>;
  updateWatchProgress(data: InsertWatchHistory): Promise<WatchHistory>;
  markAsWatched(profileId: string, contentId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private memoryContent: Map<string, Content>;
  private memoryUsers: Map<string, User>;
  private memoryProfiles: Map<string, Profile>;
  private memoryWatchHistory: Map<string, WatchHistory>;

  constructor() {
    this.memoryContent = new Map();
    this.memoryUsers = new Map();
    this.memoryProfiles = new Map();
    this.memoryWatchHistory = new Map();
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
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        director: "Denis Villeneuve",
        cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas"],
        ageRating: "14",
        releaseDate: "06 de outubro de 2017",
        country: "Estados Unidos",
        language: "Inglês",
        subtitleOptions: ["português", "inglês", "espanhol"],
        dubOptions: ["português", "inglês"],
        totalEpisodes: null,
        totalSeasons: null,
        episodeDuration: null,
        categories: ["ficção científica", "drama", "thriller"],
        isTrending: true,
        isNewRelease: false,
        isPopular: true,
        duration: "2h 44min"
      },
      {
        title: "Until Dawn: noite de terro",
        description: "Explorando um centro de visitantes abandonado, Clover e seus amigos encontram um assassino mascarado que os mata um por um. No entanto, quando eles misteriosamente acordam no início da mesma noite, são forçados a reviver o terror repetidamente..",
        year: 2025,
        rating: 3.5,
        genre: "terror",
        type: "movie",
        imageUrl: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQlhfm2cpNM4g4RexvRLwFRztBolGlla_8FetBioSUefsgR9j2oMXpMt_1xjemVOmhrNnv-5ct8b9y9p632WPb97OhAbim9KrsiTho6Ew",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        director: "David F. Sandberg ",
        cast: ["Ella Rubin", "Maia Mitchell", "Belmont Cameli"],
        ageRating: "12",
        releaseDate: "25 de abril de 2025",
        country: "Estados Unidos",
        language: "Inglês",
        subtitleOptions: ["português", "inglês", "espanhol"],
        dubOptions: ["português", "inglês"],
        totalEpisodes: null,
        totalSeasons: null,
        episodeDuration: null,
        categories: ["terror", "aventura", "thriller"],
        isTrending: true,
        isNewRelease: true,
        isPopular: false,
        duration: "1h 43min"
      },
      {
        title: "Dark Waters",
        description: "Um thriller psicológico que mergulha nas profundezas da mente humana.",
        year: 2023,
        rating: 82,
        genre: "Thriller",
        type: "movie",
        imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        director: "Todd Haynes",
        cast: ["Mark Ruffalo", "Anne Hathaway", "Tim Robbins"],
        ageRating: "14",
        releaseDate: "22 de novembro de 2019",
        country: "Estados Unidos",
        language: "Inglês",
        subtitleOptions: ["português", "inglês", "espanhol"],
        dubOptions: ["português", "inglês"],
        totalEpisodes: null,
        totalSeasons: null,
        episodeDuration: null,
        categories: ["thriller", "drama", "suspense"],
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
        imageUrl: "https://i.pinimg.com/564x/39/5b/b7/395bb7a7e86bb9c1817e032f2612c86d.jpg",
        trailerUrl: "https://yhdtpoqjntehiruphsjd.supabase.co/storage/v1/object/sign/Trailers/Demon%20Slayer_%20Kimetsu%20no%20Yaiba%20Castelo%20Infinito%20_%20TRAILER%20OFICIAL(1080P_HD).mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kNzYzOTE5MS05MDVhLTQyNGQtYTBmMC05ZTE0ZDBlN2U4ZTYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJUcmFpbGVycy9EZW1vbiBTbGF5ZXJfIEtpbWV0c3Ugbm8gWWFpYmEgQ2FzdGVsbyBJbmZpbml0byBfIFRSQUlMRVIgT0ZJQ0lBTCgxMDgwUF9IRCkubXA0IiwiaWF0IjoxNzU3NzQzMzg4LCJleHAiOjExMjE4NTQzMzg4fQ.-t-B73C-GM9DhZo-J37nT8HUEGXnyZU68FzNjYoOM0w",
        director: "Haruo Sotozaki",
        cast: ["Natsuki Hanae", "Satomi Sato", "Hiro Shimono"],
        ageRating: "12",
        releaseDate: "6 de abril de 2019",
        country: "Japão",
        language: "Japonês",
        subtitleOptions: ["português", "inglês", "espanhol"],
        dubOptions: ["português", "inglês", "japonês"],
        totalEpisodes: 44,
        totalSeasons: 3,
        episodeDuration: "23min",
        categories: ["ação", "aventura", "sobrenatural"],
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
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        director: "The Duffer Brothers",
        cast: ["Millie Bobby Brown", "Finn Wolfhard", "David Harbour"],
        ageRating: "14",
        releaseDate: "15 de julho de 2016",
        country: "Estados Unidos",
        language: "Inglês",
        subtitleOptions: ["português", "inglês", "espanhol", "francês"],
        dubOptions: ["português", "inglês"],
        totalEpisodes: 42,
        totalSeasons: 4,
        episodeDuration: "50min",
        categories: ["ficção científica", "drama", "terror", "aventura"],
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
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        director: "Matt Reeves",
        cast: ["Robert Pattinson", "Zoe Kravitz", "Paul Dano"],
        ageRating: "14",
        releaseDate: "4 de março de 2022",
        country: "Estados Unidos",
        language: "Inglês",
        subtitleOptions: ["português", "inglês", "espanhol"],
        dubOptions: ["português", "inglês"],
        totalEpisodes: null,
        totalSeasons: null,
        episodeDuration: null,
        categories: ["ação", "aventura", "crime", "drama"],
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
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        director: "Denis Villeneuve",
        cast: ["Timothée Chalamet", "Rebecca Ferguson", "Oscar Isaac"],
        ageRating: "12",
        releaseDate: "21 de outubro de 2021",
        country: "Estados Unidos",
        language: "Inglês",
        subtitleOptions: ["português", "inglês", "espanhol", "francês"],
        dubOptions: ["português", "inglês"],
        totalEpisodes: null,
        totalSeasons: null,
        episodeDuration: null,
        categories: ["ficção científica", "aventura", "drama"],
        isTrending: false,
        isNewRelease: true,
        isPopular: true,
        duration: "2h 35min"
      },
      {
        title: "Dandandan",
        description: "Uma história de amor que transcende tempo e espaço.",
        year: 2016,
        rating: 87,
        genre: "Romance",
        type: "anime",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbjIdjeq73l9zjbe1TMHCWn5wSJipyaMeI_MC61cR7yURNAEIEYqHUuZE&s=10",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        director: "Makoto Shinkai",
        cast: ["Ryunosuke Kamiki", "Mone Kamishiraishi", "Masami Nagasawa"],
        ageRating: "L",
        releaseDate: "26 de agosto de 2016",
        country: "Japão",
        language: "Japonês",
        subtitleOptions: ["português", "inglês", "espanhol"],
        dubOptions: ["português", "inglês", "japonês"],
        totalEpisodes: 10,
        totalSeasons: 2,
        episodeDuration: "50min",
        categories: ["romance", "drama", "sobrenatural"],
        isTrending: false,
        isNewRelease: true,
        isPopular: false,
        duration: "3 temporadas"
      },
      {
        title: "Breaking Bad",
        description: "Um professor de química se torna o melhor fabricante de metanfetamina do mundo.",
        year: 2008,
        rating: 95,
        genre: "Drama",
        type: "series",
        imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
        director: "Vince Gilligan",
        cast: ["Bryan Cranston", "Aaron Paul", "Anna Gunn"],
        ageRating: "16",
        releaseDate: "20 de janeiro de 2008",
        country: "Estados Unidos",
        language: "Inglês",
        subtitleOptions: ["português", "inglês", "espanhol"],
        dubOptions: ["português", "inglês"],
        totalEpisodes: 62,
        totalSeasons: 5,
        episodeDuration: "47min",
        categories: ["drama", "crime", "thriller"],
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
        imageUrl: "https://uploads.jovemnerd.com.br/wp-content/uploads/2018/01/poster-attack-on-titan-season-3b.jpg",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        director: "Tetsuro Araki",
        cast: ["Yuki Kaji", "Marina Inoue", "Yui Ishikawa"],
        ageRating: "14",
        releaseDate: "7 de abril de 2013",
        country: "Japão",
        language: "Japonês",
        subtitleOptions: ["português", "inglês", "espanhol"],
        dubOptions: ["português", "inglês", "japonês"],
        totalEpisodes: 87,
        totalSeasons: 4,
        episodeDuration: "24min",
        categories: ["ação", "drama", "guerra"],
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
      this.memoryContent.set(id, content);
    });
  }

  // Content operations - using memory storage for now
  async getContent(): Promise<Content[]> {
    return Array.from(this.memoryContent.values());
  }

  async getContentByType(type: string): Promise<Content[]> {
    return Array.from(this.memoryContent.values()).filter(
      (content) => content.type === type
    );
  }

  async getTrendingContent(): Promise<Content[]> {
    return Array.from(this.memoryContent.values()).filter(
      (content) => content.isTrending
    );
  }

  async getNewReleases(): Promise<Content[]> {
    return Array.from(this.memoryContent.values()).filter(
      (content) => content.isNewRelease
    );
  }

  async getPopularContent(): Promise<Content[]> {
    return Array.from(this.memoryContent.values()).filter(
      (content) => content.isPopular
    );
  }

  async getContentById(id: string): Promise<Content | undefined> {
    return this.memoryContent.get(id);
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const id = randomUUID();
    const contentData: Content = {
      ...insertContent,
      id,
      duration: insertContent.duration ?? null,
      trailerUrl: insertContent.trailerUrl ?? null,
      director: insertContent.director ?? null,
      cast: insertContent.cast ?? null,
      ageRating: insertContent.ageRating ?? null,
      releaseDate: insertContent.releaseDate ?? null,
      country: insertContent.country ?? null,
      language: insertContent.language ?? null,
      subtitleOptions: insertContent.subtitleOptions ?? null,
      dubOptions: insertContent.dubOptions ?? null,
      totalEpisodes: insertContent.totalEpisodes ?? null,
      totalSeasons: insertContent.totalSeasons ?? null,
      episodeDuration: insertContent.episodeDuration ?? null,
      categories: insertContent.categories ?? null,
      isTrending: insertContent.isTrending ?? null,
      isNewRelease: insertContent.isNewRelease ?? null,
      isPopular: insertContent.isPopular ?? null,
      createdAt: new Date()
    };
    this.memoryContent.set(id, contentData);
    return contentData;
  }

  async searchContent(query: string): Promise<Content[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.memoryContent.values()).filter(
      (content) =>
        content.title.toLowerCase().includes(lowerQuery) ||
        content.description.toLowerCase().includes(lowerQuery) ||
        content.genre.toLowerCase().includes(lowerQuery)
    );
  }

  // User operations - required for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    if (!hasDb()) {
      return this.memoryUsers.get(id);
    }
    try {
      const db = getDb();
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.warn("Database error, falling back to memory storage:", error);
      return this.memoryUsers.get(id);
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!hasDb()) {
      const user: User = {
        id: userData.id || randomUUID(),
        email: userData.email ?? null,
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        profileImageUrl: userData.profileImageUrl ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.memoryUsers.set(user.id, user);
      return user;
    }
    try {
      const db = getDb();
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error) {
      console.warn("Database error, falling back to memory storage:", error);
      const user: User = {
        ...userData,
        id: userData.id || randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.memoryUsers.set(user.id, user);
      return user;
    }
  }

  // Profile operations
  async getProfilesByUser(userId: string): Promise<Profile[]> {
    if (!hasDb()) {
      return Array.from(this.memoryProfiles.values()).filter(p => p.userId === userId);
    }
    try {
      const db = getDb();
      return await db.select().from(profiles).where(eq(profiles.userId, userId));
    } catch (error) {
      console.warn("Database error, falling back to memory storage:", error);
      return Array.from(this.memoryProfiles.values()).filter(p => p.userId === userId);
    }
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    if (!hasDb()) {
      const newProfile: Profile = {
        ...profile,
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.memoryProfiles.set(newProfile.id, newProfile);
      return newProfile;
    }
    try {
      const db = getDb();
      const [newProfile] = await db.insert(profiles).values(profile).returning();
      return newProfile;
    } catch (error) {
      console.warn("Database error, falling back to memory storage:", error);
      const newProfile: Profile = {
        ...profile,
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.memoryProfiles.set(newProfile.id, newProfile);
      return newProfile;
    }
  }

  async getProfile(id: string): Promise<Profile | undefined> {
    if (!hasDb()) {
      return this.memoryProfiles.get(id);
    }
    try {
      const db = getDb();
      const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
      return profile;
    } catch (error) {
      console.warn("Database error, falling back to memory storage:", error);
      return this.memoryProfiles.get(id);
    }
  }

  async updateProfile(id: string, updates: Partial<InsertProfile>): Promise<Profile> {
    if (!hasDb()) {
      const existing = this.memoryProfiles.get(id);
      if (!existing) {
        throw new Error(`Profile with id ${id} not found`);
      }
      const updatedProfile: Profile = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
      };
      this.memoryProfiles.set(id, updatedProfile);
      return updatedProfile;
    }
    try {
      const db = getDb();
      const [updatedProfile] = await db
        .update(profiles)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(profiles.id, id))
        .returning();
      return updatedProfile;
    } catch (error) {
      console.warn("Database error, falling back to memory storage:", error);
      const existing = this.memoryProfiles.get(id);
      if (!existing) {
        throw new Error(`Profile with id ${id} not found`);
      }
      const updatedProfile: Profile = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
      };
      this.memoryProfiles.set(id, updatedProfile);
      return updatedProfile;
    }
  }

  async deleteProfile(id: string): Promise<void> {
    if (!hasDb()) {
      this.memoryProfiles.delete(id);
      return;
    }
    try {
      const db = getDb();
      await db.delete(profiles).where(eq(profiles.id, id));
    } catch (error) {
      console.warn("Database error, falling back to memory storage:", error);
      this.memoryProfiles.delete(id);
    }
  }

  // Watch history operations
  async getWatchHistory(profileId: string): Promise<WatchHistory[]> {
    if (!hasDb()) {
      return Array.from(this.memoryWatchHistory.values())
        .filter(h => h.profileId === profileId)
        .sort((a, b) => b.watchedAt.getTime() - a.watchedAt.getTime());
    }
    try {
      const db = getDb();
      return await db
        .select()
        .from(watchHistory)
        .where(eq(watchHistory.profileId, profileId))
        .orderBy(desc(watchHistory.watchedAt));
    } catch (error) {
      console.warn("Database error, falling back to memory storage:", error);
      return Array.from(this.memoryWatchHistory.values())
        .filter(h => h.profileId === profileId)
        .sort((a, b) => b.watchedAt.getTime() - a.watchedAt.getTime());
    }
  }

  async updateWatchProgress(data: InsertWatchHistory): Promise<WatchHistory> {
    if (!hasDb()) {
      // Find existing watch history entry
      const existing = Array.from(this.memoryWatchHistory.values()).find(
        h => h.profileId === data.profileId && 
             h.contentId === data.contentId &&
             (!data.episodeNumber || h.episodeNumber === data.episodeNumber)
      );

      if (existing) {
        const updated: WatchHistory = {
          ...existing,
          ...data,
          watchedAt: new Date(),
        };
        this.memoryWatchHistory.set(existing.id, updated);
        return updated;
      } else {
        const newHistory: WatchHistory = {
          ...data,
          id: randomUUID(),
          watchedAt: new Date(),
        };
        this.memoryWatchHistory.set(newHistory.id, newHistory);
        return newHistory;
      }
    }
    try {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(watchHistory)
        .where(
          and(
            eq(watchHistory.profileId, data.profileId),
            eq(watchHistory.contentId, data.contentId),
            data.episodeNumber ? eq(watchHistory.episodeNumber, data.episodeNumber) : undefined
          )
        );

      if (existing) {
        const [updated] = await db
          .update(watchHistory)
          .set({ ...data, watchedAt: new Date() })
          .where(eq(watchHistory.id, existing.id))
          .returning();
        return updated;
      } else {
        const [newHistory] = await db.insert(watchHistory).values(data).returning();
        return newHistory;
      }
    } catch (error) {
      console.warn("Database error, falling back to memory storage:", error);
      // Fallback to memory implementation
      const existing = Array.from(this.memoryWatchHistory.values()).find(
        h => h.profileId === data.profileId && 
             h.contentId === data.contentId &&
             (!data.episodeNumber || h.episodeNumber === data.episodeNumber)
      );

      if (existing) {
        const updated: WatchHistory = {
          ...existing,
          ...data,
          watchedAt: new Date(),
        };
        this.memoryWatchHistory.set(existing.id, updated);
        return updated;
      } else {
        const newHistory: WatchHistory = {
          ...data,
          id: randomUUID(),
          watchedAt: new Date(),
        };
        this.memoryWatchHistory.set(newHistory.id, newHistory);
        return newHistory;
      }
    }
  }

  async markAsWatched(profileId: string, contentId: string): Promise<void> {
    await this.updateWatchProgress({
      profileId,
      contentId,
      progress: 100,
      completed: true,
    });
  }
}

export const storage = new DatabaseStorage();
