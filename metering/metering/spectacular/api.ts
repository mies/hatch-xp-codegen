import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "./db/schema";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post("/usage", async (c) => {
  const db = drizzle(c.env.DB);

  let body: { userId: string; tokensUsed: number; messagesCount: number };
  try {
    body = await c.req.json<{ userId: string; tokensUsed: number; messagesCount: number }>();
  } catch (error) {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { userId, tokensUsed, messagesCount } = body;
  if (!userId || typeof tokensUsed !== 'number' || typeof messagesCount !== 'number') {
    return c.json({ error: "Missing or invalid parameters" }, 400);
  }

  const now = Date.now();

  try {
    const [existing] = await db.select()
      .from(schema.userUsage)
      .where(eq(schema.userUsage.userId, userId))
      .limit(1);

    if (existing) {
      const newTotalTokens = existing.total_tokens + tokensUsed;
      const newTotalMessages = existing.total_messages + messagesCount;
      const [updated] = await db.update(schema.userUsage)
        .set({
          total_tokens: newTotalTokens,
          total_messages: newTotalMessages,
          updatedAt: now
        })
        .where(eq(schema.userUsage.userId, userId))
        .returning();
      return c.json({ message: "Usage updated", data: updated });
    } else {
      await db.insert(schema.userUsage).values({
        userId,
        total_tokens: tokensUsed,
        total_messages: messagesCount,
        updatedAt: now
      });
      return c.json({ message: "Usage recorded", data: { userId, total_tokens: tokensUsed, total_messages: messagesCount, updatedAt: now } });
    }
  } catch (error) {
    return c.json({
      error: "Database error",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

app.get("/usage/:userId", async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.req.param("userId");

  try {
    const [record] = await db.select()
      .from(schema.userUsage)
      .where(eq(schema.userUsage.userId, userId))
      .limit(1);

    if (!record) {
      return c.json({ error: `Usage data for userId ${userId} not found` }, 404);
    }
    return c.json({ data: record });
  } catch (error) {
    return c.json({
      error: "Database error",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

app.get("/usage", async (c) => {
  const db = drizzle(c.env.DB);
  try {
    const records = await db.select().from(schema.userUsage);
    return c.json({ data: records });
  } catch (error) {
    return c.json({
      error: "Database error",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

export default app;