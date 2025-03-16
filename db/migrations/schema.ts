import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { ArticleEntities, ArticleFormat } from "~/types/articleFormat.ts";

export const articles = sqliteTable("articles", {
  id: integer().primaryKey({ autoIncrement: true }),
  gid: integer().notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
  thumbnail: text(),
  citations: text({ mode: "json" }).$type<string[]>(),
  entities: text({ mode: "json" }).$type<ArticleEntities>(),
});

export const translations = sqliteTable("translations", {
  id: integer().primaryKey({ autoIncrement: true }),
  articleId: integer().notNull().references(() => articles.id),
  languageCode: text().notNull().references(() => languages.code),
  article: text({ mode: "json" }).$type<ArticleFormat>(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
  deletedAt: text("deleted_at"),
});

export const languages = sqliteTable("languages", {
  code: text().primaryKey(), // 'en', 'ko', 'fr', etc.
  name: text().notNull(), // 'english', 'korean', 'french', etc.
  isEnabled: integer({ mode: "boolean" }).notNull().default(true),
  direction: text().notNull().default("ltr"), // For RTL languages like Arabic
});

export const genTimes = sqliteTable("gen_times", {
  id: integer().primaryKey({ autoIncrement: true }),
  time: text().notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const rawTopics = sqliteTable("raw_topics", {
  id: integer().primaryKey({ autoIncrement: true }).notNull(),
  topics: text(),
  gid: integer().notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const hotTopics = sqliteTable("hot_topics", {
  id: integer().primaryKey({ autoIncrement: true }).notNull(),
  topics: text(),
  gid: integer().notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});
