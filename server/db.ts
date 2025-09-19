import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL environment variable not set");
    }
    const sql = neon(url);
    db = drizzle(sql);
  }
  return db;
}

export function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}