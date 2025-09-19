import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, index, jsonb } from "drizzle-orm/pg-core";
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
  trailerUrl: text("trailer_url"),
  director: text("director"),
  cast: text("cast").array(),
  ageRating: text("age_rating"), // "L", "10", "12", "14", "16", "18"
  releaseDate: text("release_date"),
  country: text("country"),
  language: text("language"),
  subtitleOptions: text("subtitle_options").array(), // ["português", "inglês", "espanhol"]
  dubOptions: text("dub_options").array(), // ["português", "inglês", "japonês"]
  totalEpisodes: integer("total_episodes"),
  totalSeasons: integer("total_seasons"),
  episodeDuration: text("episode_duration"), // "24min" for series/anime
  categories: text("categories").array(), // ["terror", "aventura", "comédia"]
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

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Profiles table - Multiple profiles per user (like Netflix)
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(),
  avatarUrl: varchar("avatar_url"),
  isKids: boolean("is_kids").default(false),
  language: varchar("language").default("pt-BR"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

// Watch History table
export const watchHistory = pgTable("watch_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  contentId: varchar("content_id").notNull().references(() => content.id, { onDelete: "cascade" }),
  watchedAt: timestamp("watched_at").defaultNow(),
  progress: integer("progress").default(0), // Progress percentage (0-100)
  episodeNumber: integer("episode_number"), // For series/anime
  seasonNumber: integer("season_number"), // For series/anime
  completed: boolean("completed").default(false),
});

export const insertWatchHistorySchema = createInsertSchema(watchHistory).omit({
  id: true,
  watchedAt: true,
});

export type InsertWatchHistory = z.infer<typeof insertWatchHistorySchema>;
export type WatchHistory = typeof watchHistory.$inferSelect;

// Subscription Plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Mensal", "Anual", "Semanal"
  description: text("description"),
  durationDays: integer("duration_days").notNull(), // 30, 365, 7, etc
  price: integer("price").notNull(), // Price in cents
  isActive: boolean("is_active").default(true),
  features: text("features").array(), // ["HD Quality", "Multiple Devices", etc]
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// User Subscriptions table
export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  autoRenew: boolean("auto_renew").default(true),
  paymentStatus: text("payment_status").default("pending"), // "pending", "paid", "failed", "cancelled"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // "subscription_expiring", "subscription_expired", "payment_failed", "welcome", etc
  isRead: boolean("is_read").default(false),
  actionUrl: text("action_url"), // URL to redirect when notification is clicked
  metadata: jsonb("metadata"), // Additional data like subscription_id, etc
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
