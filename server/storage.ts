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
        trailerUrl: "https://youtube.com/watch?v=gCcx85zbxz4",
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
        title: "Missão Impossível",
        description: "Ethan Hunt e sua equipe enfrentam sua missão mais perigosa até agora.",
        year: 2023,
        rating: 88,
        genre: "Ação",
        type: "movie",
        imageUrl: "https://images.unsplash.com/photo-1635805737707-575885ab0820?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        trailerUrl: "https://youtube.com/watch?v=avz06PDqDbM",
        director: "Christopher McQuarrie",
        cast: ["Tom Cruise", "Hayley Atwell", "Ving Rhames"],
        ageRating: "12",
        releaseDate: "12 de julho de 2023",
        country: "Estados Unidos",
        language: "Inglês",
        subtitleOptions: ["português", "inglês", "espanhol"],
        dubOptions: ["português", "inglês"],
        totalEpisodes: null,
        totalSeasons: null,
        episodeDuration: null,
        categories: ["ação", "aventura", "thriller"],
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
        trailerUrl: "https://youtube.com/watch?v=RvAOuhyunhY",
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
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        trailerUrl: "https://youtube.com/watch?v=VQGCKyvzIM4",
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
        trailerUrl: "https://youtube.com/watch?v=b9EkMc79ZSU",
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
        trailerUrl: "https://youtube.com/watch?v=mqqft2x_Aa4",
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
        trailerUrl: "https://youtube.com/watch?v=8g18jFHCLXk",
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
        title: "Your Name",
        description: "Uma história de amor que transcende tempo e espaço.",
        year: 2016,
        rating: 87,
        genre: "Romance",
        type: "anime",
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        trailerUrl: "https://youtube.com/watch?v=xU47nhruN-Q",
        director: "Makoto Shinkai",
        cast: ["Ryunosuke Kamiki", "Mone Kamishiraishi", "Masami Nagasawa"],
        ageRating: "L",
        releaseDate: "26 de agosto de 2016",
        country: "Japão",
        language: "Japonês",
        subtitleOptions: ["português", "inglês", "espanhol"],
        dubOptions: ["português", "inglês", "japonês"],
        totalEpisodes: null,
        totalSeasons: null,
        episodeDuration: null,
        categories: ["romance", "drama", "sobrenatural"],
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
        trailerUrl: "https://youtube.com/watch?v=HhesaQXLuRY",
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
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        trailerUrl: "https://youtube.com/watch?v=luYOt2-c2TI",
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
