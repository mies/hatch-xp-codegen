import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  clerkId: text('clerk_id').notNull(),
  email: text('email').notNull(),
  name: text('name'),
  profilePhotoUrl: text('profile_photo_url'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  uniqueIndex('users_clerk_id_idx').on(table.clerkId),
  uniqueIndex('users_email_idx').on(table.email),
]);

export const groups = sqliteTable('groups', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  ownerId: integer('owner_id').notNull(),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const groupMembers = sqliteTable('group_members', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull(),
  userId: integer('user_id').notNull(),
  joinedAt: text('joined_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const invitations = sqliteTable('invitations', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull(),
  email: text('email').notNull(),
  token: text('token').notNull(),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  expiresAt: text('expires_at').notNull(),
}, (table) => [
  uniqueIndex('invitations_token_idx').on(table.token),
]);

export const messages = sqliteTable('messages', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull(),
  senderId: integer('sender_id').notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('messages_group_id_idx').on(table.groupId),
]);

// Relations can be defined using the relations function
import { relations } from 'drizzle-orm';

export const groupsRelations = relations(groups, ({ one }) => ({
  owner: one(users, {
    fields: [groups.ownerId],
    references: [users.id],
  }),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  group: one(groups, {
    fields: [invitations.groupId],
    references: [groups.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  group: one(groups, {
    fields: [messages.groupId],
    references: [groups.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));