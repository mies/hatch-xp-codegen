import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";
import { eq } from "drizzle-orm";
import { Context } from "hono";

// Define the bindings expected for Cloudflare Workers
type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// ----------------------- Repositories CRUD -----------------------

// GET /api/repositories - List all repositories
app.get("/api/repositories", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  try {
    const repositories = await db.select().from(schema.repositories);
    return c.json({ repositories });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// GET /api/repositories/:id - Get a single repository by id
app.get("/api/repositories/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    const [repository] = await db.select().from(schema.repositories).where(eq(schema.repositories.id, id));
    if (!repository) return c.json({ error: "Repository not found" }, 404);
    return c.json({ repository });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// POST /api/repositories - Create a new repository
app.post("/api/repositories", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  try {
    const { name, url, branch } = await c.req.json();
    await db.insert(schema.repositories).values({ name, url, branch });
    return c.json({ message: 'Repository created' }, 201);
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// PUT /api/repositories/:id - Update an existing repository
app.put("/api/repositories/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    const { name, url, branch } = await c.req.json();
    const updates: Partial<typeof schema.repositories> = {};
    if (name !== undefined) updates.name = name;
    if (url !== undefined) updates.url = url;
    if (branch !== undefined) updates.branch = branch;
    const [updatedRepository] = await db.update(schema.repositories)
      .set(updates)
      .where(eq(schema.repositories.id, id))
      .returning();
    if (!updatedRepository) return c.json({ error: "Repository not found" }, 404);
    return c.json({ repository: updatedRepository });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// DELETE /api/repositories/:id - Delete a repository
app.delete("/api/repositories/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    await db.delete(schema.repositories).where(eq(schema.repositories.id, id));
    return c.json({ message: 'Repository deleted' });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// ----------------------- Builds CRUD -----------------------

// GET /api/builds - List all builds
app.get("/api/builds", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  try {
    const builds = await db.select().from(schema.builds);
    return c.json({ builds });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// GET /api/builds/:id - Get a single build by id
app.get("/api/builds/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    const [build] = await db.select().from(schema.builds).where(eq(schema.builds.id, id));
    if (!build) return c.json({ error: "Build not found" }, 404);
    return c.json({ build });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// POST /api/builds - Create a new build
app.post("/api/builds", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  try {
    const { repositoryId, status, startTime, endTime, logs } = await c.req.json();
    await db.insert(schema.builds).values({ repositoryId, status, startTime, endTime, logs });
    return c.json({ message: 'Build created' }, 201);
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// PUT /api/builds/:id - Update an existing build
app.put("/api/builds/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    const { repositoryId, status, startTime, endTime, logs } = await c.req.json();
    const updates: Partial<typeof schema.builds> = {};
    if (repositoryId !== undefined) updates.repositoryId = repositoryId;
    if (status !== undefined) updates.status = status;
    if (startTime !== undefined) updates.startTime = startTime;
    if (endTime !== undefined) updates.endTime = endTime;
    if (logs !== undefined) updates.logs = logs;
    const [updatedBuild] = await db.update(schema.builds)
      .set(updates)
      .where(eq(schema.builds.id, id))
      .returning();
    if (!updatedBuild) return c.json({ error: "Build not found" }, 404);
    return c.json({ build: updatedBuild });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// DELETE /api/builds/:id - Delete a build
app.delete("/api/builds/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    await db.delete(schema.builds).where(eq(schema.builds.id, id));
    return c.json({ message: 'Build deleted' });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// ----------------------- Tests CRUD -----------------------

// GET /api/tests - List all tests
app.get("/api/tests", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  try {
    const tests = await db.select().from(schema.tests);
    return c.json({ tests });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// GET /api/tests/:id - Get a single test by id
app.get("/api/tests/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    const [testObj] = await db.select().from(schema.tests).where(eq(schema.tests.id, id));
    if (!testObj) return c.json({ error: "Test not found" }, 404);
    return c.json({ test: testObj });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// POST /api/tests - Create a new test
app.post("/api/tests", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  try {
    const { buildId, result, coverage, errors } = await c.req.json();
    await db.insert(schema.tests).values({ buildId, result, coverage, errors });
    return c.json({ message: 'Test created' }, 201);
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// PUT /api/tests/:id - Update an existing test
app.put("/api/tests/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    const { buildId, result, coverage, errors } = await c.req.json();
    const updates: Partial<typeof schema.tests> = {};
    if (buildId !== undefined) updates.buildId = buildId;
    if (result !== undefined) updates.result = result;
    if (coverage !== undefined) updates.coverage = coverage;
    if (errors !== undefined) updates.errors = errors;
    const [updatedTest] = await db.update(schema.tests)
      .set(updates)
      .where(eq(schema.tests.id, id))
      .returning();
    if (!updatedTest) return c.json({ error: "Test not found" }, 404);
    return c.json({ test: updatedTest });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// DELETE /api/tests/:id - Delete a test
app.delete("/api/tests/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    await db.delete(schema.tests).where(eq(schema.tests.id, id));
    return c.json({ message: 'Test deleted' });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// ----------------------- Deployments CRUD -----------------------

// GET /api/deployments - List all deployments
app.get("/api/deployments", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  try {
    const deployments = await db.select().from(schema.deployments);
    return c.json({ deployments });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// GET /api/deployments/:id - Get a single deployment by id
app.get("/api/deployments/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    const [deployment] = await db.select().from(schema.deployments).where(eq(schema.deployments.id, id));
    if (!deployment) return c.json({ error: "Deployment not found" }, 404);
    return c.json({ deployment });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// POST /api/deployments - Create a new deployment
app.post("/api/deployments", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  try {
    const { buildId, environmentId, status, logs } = await c.req.json();
    await db.insert(schema.deployments).values({ buildId, environmentId, status, logs });
    return c.json({ message: 'Deployment created' }, 201);
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// PUT /api/deployments/:id - Update an existing deployment
app.put("/api/deployments/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    const { buildId, environmentId, status, logs } = await c.req.json();
    const updates: Partial<typeof schema.deployments> = {};
    if (buildId !== undefined) updates.buildId = buildId;
    if (environmentId !== undefined) updates.environmentId = environmentId;
    if (status !== undefined) updates.status = status;
    if (logs !== undefined) updates.logs = logs;
    const [updatedDeployment] = await db.update(schema.deployments)
      .set(updates)
      .where(eq(schema.deployments.id, id))
      .returning();
    if (!updatedDeployment) return c.json({ error: "Deployment not found" }, 404);
    return c.json({ deployment: updatedDeployment });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// DELETE /api/deployments/:id - Delete a deployment
app.delete("/api/deployments/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    await db.delete(schema.deployments).where(eq(schema.deployments.id, id));
    return c.json({ message: 'Deployment deleted' });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// ----------------------- Environments CRUD -----------------------

// GET /api/environments - List all environments
app.get("/api/environments", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  try {
    const environments = await db.select().from(schema.environments);
    return c.json({ environments });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// GET /api/environments/:id - Get a single environment by id
app.get("/api/environments/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    const [environment] = await db.select().from(schema.environments).where(eq(schema.environments.id, id));
    if (!environment) return c.json({ error: "Environment not found" }, 404);
    return c.json({ environment });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// POST /api/environments - Create a new environment
app.post("/api/environments", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  try {
    const { name, configuration } = await c.req.json();
    await db.insert(schema.environments).values({ name, configuration });
    return c.json({ message: 'Environment created' }, 201);
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// PUT /api/environments/:id - Update an existing environment
app.put("/api/environments/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    const { name, configuration } = await c.req.json();
    const updates: Partial<typeof schema.environments> = {};
    if (name !== undefined) updates.name = name;
    if (configuration !== undefined) updates.configuration = configuration;
    const [updatedEnv] = await db.update(schema.environments)
      .set(updates)
      .where(eq(schema.environments.id, id))
      .returning();
    if (!updatedEnv) return c.json({ error: "Environment not found" }, 404);
    return c.json({ environment: updatedEnv });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// DELETE /api/environments/:id - Delete an environment
app.delete("/api/environments/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    await db.delete(schema.environments).where(eq(schema.environments.id, id));
    return c.json({ message: 'Environment deleted' });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// ----------------------- Secrets CRUD -----------------------

// GET /api/secrets - List all secrets
app.get("/api/secrets", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  try {
    const secrets = await db.select().from(schema.secrets);
    return c.json({ secrets });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// GET /api/secrets/:id - Get a single secret by id
app.get("/api/secrets/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    const [secret] = await db.select().from(schema.secrets).where(eq(schema.secrets.id, id));
    if (!secret) return c.json({ error: "Secret not found" }, 404);
    return c.json({ secret });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// POST /api/secrets - Create a new secret
app.post("/api/secrets", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  try {
    const { environmentId, key, value } = await c.req.json();
    await db.insert(schema.secrets).values({ environmentId, key, value });
    return c.json({ message: 'Secret created' }, 201);
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// PUT /api/secrets/:id - Update an existing secret
app.put("/api/secrets/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    const { environmentId, key, value } = await c.req.json();
    const updates: Partial<typeof schema.secrets> = {};
    if (environmentId !== undefined) updates.environmentId = environmentId;
    if (key !== undefined) updates.key = key;
    if (value !== undefined) updates.value = value;
    const [updatedSecret] = await db.update(schema.secrets)
      .set(updates)
      .where(eq(schema.secrets.id, id))
      .returning();
    if (!updatedSecret) return c.json({ error: "Secret not found" }, 404);
    return c.json({ secret: updatedSecret });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// DELETE /api/secrets/:id - Delete a secret
app.delete("/api/secrets/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    await db.delete(schema.secrets).where(eq(schema.secrets.id, id));
    return c.json({ message: 'Secret deleted' });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// ----------------------- Notifications CRUD -----------------------

// GET /api/notifications - List all notifications
app.get("/api/notifications", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  try {
    const notifications = await db.select().from(schema.notifications);
    return c.json({ notifications });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// GET /api/notifications/:id - Get a single notification by id
app.get("/api/notifications/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    const [notification] = await db.select().from(schema.notifications).where(eq(schema.notifications.id, id));
    if (!notification) return c.json({ error: "Notification not found" }, 404);
    return c.json({ notification });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// POST /api/notifications - Create a new notification
app.post("/api/notifications", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  try {
    const { type, recipient, message, status } = await c.req.json();
    await db.insert(schema.notifications).values({ type, recipient, message, status });
    return c.json({ message: 'Notification created' }, 201);
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// PUT /api/notifications/:id - Update an existing notification
app.put("/api/notifications/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    const { type, recipient, message, status } = await c.req.json();
    const updates: Partial<typeof schema.notifications> = {};
    if (type !== undefined) updates.type = type;
    if (recipient !== undefined) updates.recipient = recipient;
    if (message !== undefined) updates.message = message;
    if (status !== undefined) updates.status = status;
    const [updatedNotification] = await db.update(schema.notifications)
      .set(updates)
      .where(eq(schema.notifications.id, id))
      .returning();
    if (!updatedNotification) return c.json({ error: "Notification not found" }, 404);
    return c.json({ notification: updatedNotification });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// DELETE /api/notifications/:id - Delete a notification
app.delete("/api/notifications/:id", async (c: Context<{ Bindings: Bindings }>) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"), 10);
  try {
    await db.delete(schema.notifications).where(eq(schema.notifications.id, id));
    return c.json({ message: 'Notification deleted' });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

export default app;