import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

export const articles = sqliteTable("articles", {
  id: integer().primaryKey({ autoIncrement: true }),
  article: text(),
  gid: integer().notNull(),
  citations: text(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
  thumnail: text(),
  articleKor: text("article_kor"),
});

export const genTimes = sqliteTable("gen_times", {
  id: integer().primaryKey({ autoIncrement: true }),
  time: text().notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});
