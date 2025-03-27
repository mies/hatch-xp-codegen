import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  clerkId: text('clerk_id').notNull(),
  username: text('username').notNull(),
  profileImageUrl: text('profile_image_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  uniqueIndex('clerk_id_idx').on(table.clerkId),
  index('users_username_idx').on(table.username),
]);

export const photos = sqliteTable('photos', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  imageUrl: text('image_url').notNull(),
  caption: text('caption'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('photos_user_id_idx').on(table.userId),
]);

export const comments = sqliteTable('comments', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  photoId: integer('photo_id').notNull().references(() => photos.id),
  userId: integer('user_id').notNull().references(() => users.id),
  comment: text('comment').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('comments_photo_id_idx').on(table.photoId),
]);

export const likes = sqliteTable('likes', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  photoId: integer('photo_id').notNull().references(() => photos.id),
  userId: integer('user_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  uniqueIndex('likes_photo_id_user_id_idx').on(table.photoId, table.userId),
]);

import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
  photos: many(photos),
  comments: many(comments),
  likes: many(likes),
}));

export const photosRelations = relations(photos, ({ one, many }) => ({
  user: one(users, {
    fields: [photos.userId],
    references: [users.id],
  }),
  comments: many(comments),
  likes: many(likes),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  photo: one(photos, {
    fields: [comments.photoId],
    references: [photos.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  photo: one(photos, {
    fields: [likes.photoId],
    references: [photos.id],
  }),
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
}));