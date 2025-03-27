import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";
import { eq, and } from "drizzle-orm";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

function collateIssues(rows: Array<any>) {
  const issuesMap: Record<number, any> = {};
  for (const row of rows) {
    const id = row.id;
    if (!issuesMap[id]) {
      issuesMap[id] = {
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        assignedTo: row.assignedTo,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        tags: []
      };
    }
    if (row.tag && !issuesMap[id].tags.includes(row.tag)) {
      issuesMap[id].tags.push(row.tag);
    }
  }
  return Object.values(issuesMap);
}

app.post('/issues', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const { title, description, assignedTo, status, tags } = body;

  if (!title || !status) {
    return c.json({ error: 'Missing required fields: title and status' }, 400);
  }

  try {
    const insertedIssues = await db.insert(schema.issues).values({
      title,
      description,
      assignedTo,
      status
    }).returning();

    if (!insertedIssues || insertedIssues.length === 0) {
      return c.json({ error: 'Issue creation failed' }, 500);
    }

    const issueId = insertedIssues[0].id;

    if (Array.isArray(tags)) {
      for (const tag of tags) {
        await db.insert(schema.issueTags).values({
          issueId,
          tag
        });
      }
    }

    const createdIssue = {
      id: issueId,
      title,
      description,
      status,
      assignedTo,
      tags: tags || []
    };
    
    return c.json({ issue: createdIssue }, 201);
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.get('/issues', async (c) => {
  const db = drizzle(c.env.DB);
  const url = new URL(c.req.url);
  const statusFilter = url.searchParams.get('status');
  const assignedToFilter = url.searchParams.get('assignedTo');
  const tagFilter = url.searchParams.get('tag');
  const limit = Number.parseInt(url.searchParams.get('limit') || '100', 10);
  const offset = Number.parseInt(url.searchParams.get('offset') || '0', 10);

  try {
    const conditions: any[] = [];
    if (statusFilter) {
      conditions.push(eq(schema.issues.status, statusFilter));
    }
    if (assignedToFilter) {
      conditions.push(eq(schema.issues.assignedTo, assignedToFilter));
    }

    let rows;
    if (tagFilter) {
      conditions.push(eq(schema.issueTags.tag, tagFilter));
      rows = await db
        .select({
          id: schema.issues.id,
          title: schema.issues.title,
          description: schema.issues.description,
          status: schema.issues.status,
          assignedTo: schema.issues.assignedTo,
          createdAt: schema.issues.createdAt,
          updatedAt: schema.issues.updatedAt,
          tag: schema.issueTags.tag
        })
        .from(schema.issues)
        .innerJoin(schema.issueTags, eq(schema.issues.id, schema.issueTags.issueId))
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .limit(limit)
        .offset(offset);
    } else {
      rows = await db
        .select({
          id: schema.issues.id,
          title: schema.issues.title,
          description: schema.issues.description,
          status: schema.issues.status,
          assignedTo: schema.issues.assignedTo,
          createdAt: schema.issues.createdAt,
          updatedAt: schema.issues.updatedAt,
          tag: schema.issueTags.tag
        })
        .from(schema.issues)
        .leftJoin(schema.issueTags, eq(schema.issues.id, schema.issueTags.issueId))
        .where(conditions.length ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined)
        .limit(limit)
        .offset(offset);
    }

    const issues = collateIssues(rows);
    return c.json({ issues });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.get('/issues/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param('id'));

  try {
    const rows = await db
      .select({
        id: schema.issues.id,
        title: schema.issues.title,
        description: schema.issues.description,
        status: schema.issues.status,
        assignedTo: schema.issues.assignedTo,
        createdAt: schema.issues.createdAt,
        updatedAt: schema.issues.updatedAt,
        tag: schema.issueTags.tag
      })
      .from(schema.issues)
      .leftJoin(schema.issueTags, eq(schema.issues.id, schema.issueTags.issueId))
      .where(eq(schema.issues.id, id));

    const issues = collateIssues(rows);
    if (!issues || issues.length === 0) {
      return c.json({ error: 'Issue not found' }, 404);
    }
    return c.json({ issue: issues[0] });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.put('/issues/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param('id'));
  const body = await c.req.json();
  const { title, description, assignedTo, status, tags } = body;

  try {
    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (status !== undefined) updateData.status = status;

    const updatedIssues = await db.update(schema.issues)
      .set(updateData)
      .where(eq(schema.issues.id, id))
      .returning();

    if (!updatedIssues || updatedIssues.length === 0) {
      return c.json({ error: 'Issue not found or update failed' }, 404);
    }

    if (Array.isArray(tags)) {
      await db.delete(schema.issueTags).where(eq(schema.issueTags.issueId, id));
      for (const tag of tags) {
        await db.insert(schema.issueTags).values({
          issueId: id,
          tag
        });
      }
    }

    const rows = await db
      .select({
        id: schema.issues.id,
        title: schema.issues.title,
        description: schema.issues.description,
        status: schema.issues.status,
        assignedTo: schema.issues.assignedTo,
        createdAt: schema.issues.createdAt,
        updatedAt: schema.issues.updatedAt,
        tag: schema.issueTags.tag
      })
      .from(schema.issues)
      .leftJoin(schema.issueTags, eq(schema.issues.id, schema.issueTags.issueId))
      .where(eq(schema.issues.id, id));

    const issues = collateIssues(rows);
    return c.json({ issue: issues[0] });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.delete('/issues/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param('id'));

  try {
    await db.delete(schema.issueTags).where(eq(schema.issueTags.issueId, id));
    await db.delete(schema.issues).where(eq(schema.issues.id, id));
    return c.json({ message: 'Issue deleted' });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

export default app;