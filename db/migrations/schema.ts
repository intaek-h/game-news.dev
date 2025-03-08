import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const rawTopics = sqliteTable("raw_topics", {
  id: integer().primaryKey({ autoIncrement: true }).notNull(),
  topics: text(),
  genTime: text("gen_time").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const articles = sqliteTable("articles", {
  id: integer().primaryKey({ autoIncrement: true }),
  article: text(),
  topic: text(),
  genTime: text("gen_time").notNull(),
  citations: text(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
  thumnail: text(),
});
