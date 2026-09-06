import { bigint, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const episodesTable = pgTable("sfa_episodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const receiptEventsTable = pgTable("sfa_receipt_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workingFilesTable = pgTable("sfa_working_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  objectPath: text("object_path").notNull().unique(),
  name: text("name").notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  contentType: text("content_type").notNull(),
  state: text("state").notNull().default("pending"),
  parseStatus: text("parse_status").notNull(),
  parsedContent: text("parsed_content"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEpisodeSchema = createInsertSchema(episodesTable).omit({ id: true, createdAt: true });
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Episode = typeof episodesTable.$inferSelect;
export const insertReceiptEventSchema = createInsertSchema(receiptEventsTable).omit({ id: true, createdAt: true });
export type InsertReceiptEvent = z.infer<typeof insertReceiptEventSchema>;
export type ReceiptEvent = typeof receiptEventsTable.$inferSelect;
export const insertWorkingFileSchema = createInsertSchema(workingFilesTable).omit({ id: true, createdAt: true });
export type InsertWorkingFile = z.infer<typeof insertWorkingFileSchema>;
export type WorkingFile = typeof workingFilesTable.$inferSelect;