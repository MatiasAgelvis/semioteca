import { json } from '@sveltejs/kit';
import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const db = createClient({
  url: env.TURSO_DATABASE_URL ?? '',
  authToken: env.TURSO_AUTH_TOKEN ?? '',
});

const MAX_COMMENT_LENGTH = 500;
const MAX_CARD_ID_LENGTH = 200;

async function ensureTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tag_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id TEXT NOT NULL,
      incorrect_tags TEXT NOT NULL DEFAULT '[]',
      corrected_tags TEXT NOT NULL DEFAULT '[]',
      comment TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

export const POST: RequestHandler = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Honeypot — bots fill in hidden fields
  if (body.website) {
    return json({ ok: true }); // silently accept but don't store
  }

  const cardId = typeof body.card_id === 'string' ? body.card_id.trim() : '';
  const comment = typeof body.comment === 'string' ? body.comment : '';

  if (!cardId || cardId.length > MAX_CARD_ID_LENGTH) {
    return json({ error: 'Invalid card_id' }, { status: 400 });
  }
  if (comment.length > MAX_COMMENT_LENGTH) {
    return json({ error: 'Comment too long' }, { status: 400 });
  }

  const incorrectTags = Array.isArray(body.incorrect_tags)
    ? body.incorrect_tags.filter((t): t is string => typeof t === 'string')
    : [];
  const correctedTags = Array.isArray(body.corrected_tags)
    ? body.corrected_tags.filter((t): t is string => typeof t === 'string')
    : [];

  await ensureTable();
  await db.execute({
    sql: `INSERT INTO tag_reports (card_id, incorrect_tags, corrected_tags, comment, user_agent) VALUES (?, ?, ?, ?, ?)`,
    args: [
      cardId,
      JSON.stringify(incorrectTags),
      JSON.stringify(correctedTags),
      comment,
      request.headers.get('user-agent') ?? '',
    ],
  });

  return json({ ok: true });
};

export const GET: RequestHandler = async ({ url }) => {
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 200);
  const cardId = url.searchParams.get('card_id');

  await ensureTable();

  const result = cardId
    ? await db.execute({
        sql: `SELECT * FROM tag_reports WHERE card_id = ? ORDER BY created_at DESC LIMIT ?`,
        args: [cardId, limit],
      })
    : await db.execute({
        sql: `SELECT * FROM tag_reports ORDER BY created_at DESC LIMIT ?`,
        args: [limit],
      });

  return json({ reports: result.rows });
};
