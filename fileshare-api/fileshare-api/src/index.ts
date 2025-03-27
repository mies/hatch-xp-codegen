import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "./db/schema";

// Define bindings interfaces for Cloudflare Workers.
type Bindings = {
  DB: D1Database;
  R2: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// Health check endpoint
app.get("/", (c) => c.text("Filesharing Service is running!"));

// POST /upload 
app.post("/upload", async (c) => {
  try {
    const formData = await c.req.parseBody();
    const fileField = formData?.file;
    if (!fileField || !(fileField instanceof File)) {
      return c.json({ error: "No file provided" }, 400);
    }

    const id = crypto.randomUUID();
    const fileName = fileField.name;
    const key = `files/${id}-${fileName}`;

    await c.env.R2.put(key, fileField.stream());

    const contentType = fileField.type;
    const size = fileField.size;

    const db = drizzle(c.env.DB);
    await db.insert(schema.files).values({
      id,
      fileName,
      contentType,
      size,
      r2Key: key
    });

    const link = `${c.req.url.replace(/\/upload$/, "/files/" + id)}`;
    return c.json({ link });
  } catch (error) {
    return c.json({ error: 'File upload failed', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// GET /files/:id
app.get("/files/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = drizzle(c.env.DB);
    const [fileMetadata] = await db.select().from(schema.files).where(eq(schema.files.id, id));

    if (!fileMetadata) {
      return c.json({ error: "File not found" }, 404);
    }

    const object = await c.env.R2.get(fileMetadata.r2Key);
    if (!object) {
      return c.json({ error: "File data not found" }, 404);
    }

    const headers = new Headers();
    headers.set("Content-Type", fileMetadata.contentType);
    headers.set("Content-Disposition", `attachment; filename=\"${fileMetadata.fileName}\"`);

    return new Response(object.body, { headers });
  } catch (error) {
    return c.json({ error: 'File download failed', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

export default app;