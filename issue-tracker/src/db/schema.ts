import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const issues = sqliteTable('issues', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull(),
  assignedTo: text('assigned_to'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('issues_status_idx').on(table.status),
  index('issues_assigned_to_idx').on(table.assignedTo),
]);

export const issueTags = sqliteTable('issue_tags', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  issueId: integer('issue_id').notNull().references(() => issues.id),
  tag: text('tag').notNull(),
}, (table) => [
  index('issue_tags_tag_idx').on(table.tag),
]);