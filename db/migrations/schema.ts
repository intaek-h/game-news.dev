import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { ArticleEntities, ArticleFormat } from "~/types/articleFormat.ts";

export const articles = sqliteTable("articles", {
  id: integer().primaryKey({ autoIncrement: true }),
  gid: integer().notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
  thumbnail: text(),
  thumbnailSource: text("thumbnail_source"),
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

/**
 * Better-Auth schema
 */

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, {
    onDelete: "cascade",
  }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, {
    onDelete: "cascade",
  }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});
