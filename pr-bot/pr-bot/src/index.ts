import { Hono } from "hono";
import * as ts from "typescript";

type Bindings = {
  WEBHOOK_SECRET: string;
  GITHUB_TOKEN: string;
};

interface GitHubFile {
  filename: string;
  raw_url: string;
}

const app = new Hono<{ Bindings: Bindings }>();

async function verifySignature(c: any, rawBody: string): Promise<boolean> {
  const signatureHeader = c.req.header('x-hub-signature-256');
  if (!signatureHeader) {
    return false;
  }
  const secret = c.env.WEBHOOK_SECRET;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const rawBodyEncoded = encoder.encode(rawBody);
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, rawBodyEncoded);
  const computedSignature = 'sha256=' + Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return signatureHeader === computedSignature;
}

app.post('/webhook', async (c) => {
  try {
    const rawBody = await c.req.text();
    const isValid = await verifySignature(c, rawBody);
    if (!isValid) {
      return c.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    if (!payload.pull_request) {
      return c.text('Event ignored');
    }

    const prAction: string = payload.action || '';
    const prNumber: number = payload.pull_request.number;
    const repoFullName: string = payload.repository.full_name;

    const filesUrl = payload.pull_request.url + "/files";
    const filesResponse = await fetch(filesUrl, {
      headers: {
        Authorization: `token ${c.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    if (!filesResponse.ok) {
      return c.json({ error: 'Failed to fetch changed files from GitHub' }, { status: filesResponse.status });
    }
    const files: GitHubFile[] = await filesResponse.json() as GitHubFile[];

    const syntaxErrors: { [fileName: string]: string[] } = {};

    for (const file of files) {
      const fileName: string = file.filename;
      if (!fileName.endsWith('.ts')) {
        continue;
      }

      const fileResponse = await fetch(file.raw_url, {
        headers: {
          Authorization: `token ${c.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3.raw'
        }
      });
      if (!fileResponse.ok) {
        syntaxErrors[fileName] = [`Failed to fetch file content from ${file.raw_url}`];
        continue;
      }
      const fileContent = await fileResponse.text();

      const transpileOutput = ts.transpileModule(fileContent, { reportDiagnostics: true });
      const diagnostics = transpileOutput.diagnostics;
      if (diagnostics && diagnostics.length > 0) {
        const errors: string[] = diagnostics.map(diag => {
          const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
          const line = diag.file && diag.start !== undefined
            ? diag.file.getLineAndCharacterOfPosition(diag.start).line + 1
            : 'unknown';
          return `Line ${line}: ${message}`;
        });
        syntaxErrors[fileName] = errors;
      }
    }

    if (Object.keys(syntaxErrors).length > 0) {
      let commentBody = '### Syntax Errors Detected\n';
      for (const file in syntaxErrors) {
        commentBody += `\n**${file}**\n`;
        syntaxErrors[file].forEach(errorMsg => {
          commentBody += `- ${errorMsg}\n`;
        });
      }

      const commentUrl = `https://api.github.com/repos/${repoFullName}/issues/${prNumber}/comments`;
      const postResponse = await fetch(commentUrl, {
        method: 'POST',
        headers: {
          Authorization: `token ${c.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body: commentBody })
      });
      if (!postResponse.ok) {
        return c.json({ error: 'Failed to post comment to GitHub' }, { status: postResponse.status });
      }
    }

    return c.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    return c.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
});

export default app;