import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const repositories = sqliteTable('repositories', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  branch: text('branch').notNull(),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  uniqueIndex('idx_repositories_name').on(table.name),
]);

export const builds = sqliteTable('builds', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  repositoryId: integer('repository_id').notNull().references(() => repositories.id),
  status: text('status').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time'),
  logs: text('logs'),
}, (table) => [
  index('idx_builds_status').on(table.status),
]);

export const tests = sqliteTable('tests', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  buildId: integer('build_id').notNull().references(() => builds.id),
  result: text('result').notNull(),
  coverage: real('coverage'),
  errors: text('errors'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_tests_result').on(table.result),
]);

export const deployments = sqliteTable('deployments', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  buildId: integer('build_id').notNull().references(() => builds.id),
  environmentId: integer('environment_id').notNull().references(() => environments.id),
  status: text('status').notNull(),
  logs: text('logs'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_deployments_status').on(table.status),
]);

export const environments = sqliteTable('environments', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  configuration: text('configuration'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const secrets = sqliteTable('secrets', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  environmentId: integer('environment_id').notNull().references(() => environments.id),
  key: text('key').notNull(),
  value: text('value').notNull(),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const notifications = sqliteTable('notifications', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  type: text('type').notNull(),
  recipient: text('recipient').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});