import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const content = pgTable("content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  year: integer("year").notNull(),
  rating: integer("rating").notNull(), // rating out of 100
  genre: text("genre").notNull(),
  type: text("type").notNull(), // 'movie', 'series', 'anime'
  imageUrl: text("image_url").notNull(),
  isTrending: boolean("is_trending").default(false),
  isNewRelease: boolean("is_new_release").default(false),
  isPopular: boolean("is_popular").default(false),
  duration: text("duration"), // "2h 30min" or "3 seasons"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
  createdAt: true,
});

export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof content.$inferSelect;
