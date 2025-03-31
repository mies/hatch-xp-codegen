import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const places = sqliteTable('places', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  address: text('address'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  uniqueIndex('name_idx').on(table.name),
]);

export const checkins = sqliteTable('checkins', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  placeId: integer('place_id').notNull().references(() => places.id),
  checkinTime: text('checkin_time').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_checkins_user_id').on(table.userId),
]);

export const followers = sqliteTable('followers', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  followerId: text('follower_id').notNull(),
  followedId: text('followed_id').notNull(),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_followers_follower_id').on(table.followerId),
]);