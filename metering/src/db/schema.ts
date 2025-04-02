import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const userUsage = sqliteTable('user_usage', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().unique(),
  totalTokens: integer('total_tokens', { mode: 'number' }).notNull(),
  totalMessages: integer('total_messages', { mode: 'number' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  index('user_id_index').on(table.userId),
]);