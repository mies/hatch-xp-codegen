import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql, and } from 'drizzle-orm';
import * as schema from './db/schema';
import type { D1Database } from '@cloudflare/workers-types';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

const getAuthenticatedUserId = (c: any): string | null => {
  const userId = c.req.header('x-clerk-user-id');
  return userId || null;
};

app.post('/checkin', async (c) => {
  try {
    const userId = getAuthenticatedUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { placeName, latitude, longitude, address } = await c.req.json();
    if (!placeName || latitude === undefined || longitude === undefined) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const db = drizzle(c.env.DB);

    let [placeRecord] = await db.select().from(schema.places).where(eq(schema.places.name, placeName));

    if (!placeRecord) {
      await db.insert(schema.places).values({
        name: placeName,
        latitude,
        longitude,
        address
      });
      [placeRecord] = await db.select().from(schema.places).where(eq(schema.places.name, placeName));
    }

    await db.insert(schema.checkins).values({
      userId,
      placeId: placeRecord.id
    });

    return c.json({ message: 'Check-in successful', place: placeRecord });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.post('/follow', async (c) => {
  try {
    const userId = getAuthenticatedUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { followedUserId } = await c.req.json();
    if (!followedUserId) {
      return c.json({ error: 'Missing followedUserId in payload' }, 400);
    }

    const db = drizzle(c.env.DB);

    await db.insert(schema.followers).values({
      followerId: userId,
      followedId: followedUserId
    });

    return c.json({ message: `Now following user ${followedUserId}` });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.post('/unfollow', async (c) => {
  try {
    const userId = getAuthenticatedUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { unfollowUserId } = await c.req.json();
    if (!unfollowUserId) {
      return c.json({ error: 'Missing unfollowUserId in payload' }, 400);
    }

    const db = drizzle(c.env.DB);

    await db.delete(schema.followers).where(and(
      eq(schema.followers.followerId, userId),
      eq(schema.followers.followedId, unfollowUserId)
    ));

    return c.json({ message: `Unfollowed user ${unfollowUserId}` });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.get('/feed', async (c) => {
  try {
    const userId = getAuthenticatedUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const limitParam = c.req.query('limit');
    const pageParam = c.req.query('page');
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 10;
    const page = pageParam ? Number.parseInt(pageParam, 10) : 1;
    const offset = (page - 1) * limit;

    const db = drizzle(c.env.DB);

    const followedResult = await db.select({ followedId: schema.followers.followedId })
      .from(schema.followers)
      .where(eq(schema.followers.followerId, userId));

    const followedIds = followedResult.map((row) => row.followedId);
    if (followedIds.length === 0) {
      return c.json({ feed: [] });
    }

    const feed = await db.select({
      checkinId: schema.checkins.id,
      userId: schema.checkins.userId,
      checkinTime: schema.checkins.checkinTime,
      placeId: schema.places.id,
      placeName: schema.places.name,
      latitude: schema.places.latitude,
      longitude: schema.places.longitude,
      address: schema.places.address
    })
      .from(schema.checkins)
      .leftJoin(schema.places, eq(schema.checkins.placeId, schema.places.id))
      .where(sql`${schema.checkins.userId} IN (${sql.join(followedIds, sql`, `)})`)
      .orderBy(sql`${schema.checkins.checkinTime} DESC`)
      .limit(limit)
      .offset(offset);

    return c.json({ feed });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.get('/places', async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const nameQuery = c.req.query('name');
    const latQuery = c.req.query('lat');
    const lngQuery = c.req.query('lng');

    let query = db.select().from(schema.places);

    if (nameQuery) {
      query = query.where(sql`${schema.places.name} LIKE ${'%' + nameQuery + '%'}`);
    }

    if (latQuery && lngQuery) {
      // Implement proximity search logic if needed
    }

    const placesList = await query;
    return c.json({ places: placesList });
  } catch (error) {
    return c.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

export default app;