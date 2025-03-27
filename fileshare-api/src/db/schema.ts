import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const files = sqliteTable('files', {
  id: text('id').primaryKey().notNull(),
  fileName: text('file_name').notNull(),
  contentType: text('content_type').notNull(),
  size: integer('size', { mode: 'number' }).notNull(),
  uploadedAt: text('uploaded_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  r2Key: text('r2_key').notNull(),
}, (table) => [
  index('idx_files_id').on(table.id),
]);