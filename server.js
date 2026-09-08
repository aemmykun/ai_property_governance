import express from 'express';
import Database from 'better-sqlite3';
import OpenAI from 'openai';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'rag.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    source_url TEXT NOT NULL,
    publisher TEXT,
    version TEXT,
    retrieved_at TEXT NOT NULL,
    content_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS chunks (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    embedding_json TEXT NOT NULL,
    FOREIGN KEY(source_id) REFERENCES sources(id)
  );
  CREATE INDEX IF NOT EXISTS idx_chunks_source ON chunks(source_id);
`);

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL || undefined })
  : null;

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const sha256 = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex');

function chunkText(text, maxChars = 1600, overlapChars = 240) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!normalized) return [];
  const paragraphs = normalized.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let current = '';

  const pushCurrent = () => {
    const value = current.trim();
    if (!value) return;
    chunks.push(value);
    current = value.slice(Math.max(0, value.length - overlapChars));
  };

  for (const p of paragraphs) {
    if ((current + '\n\n' + p).length <= maxChars) {
      current = current ? `${current}\n\n${p}` : p;
      continue;
    }
    if (current) pushCurrent();
    if (p.length <= maxChars) {
      current = current ? `${current}\n\n${p}` : p;
    } else {
      for (let i = 0; i < p.length; i += maxChars - overlapChars) {
        chunks.push(p.slice(i, i + maxChars));
      }
      current = '';
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return [...new Set(chunks)];
}

async function embedMany(inputs) {
  if (!openai) throw new Error('OPENAI_API_KEY is not configured');
  const model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
  const result = await openai.embeddings.create({ model, input: inputs });
  return result.data.map((item) => item.embedding);
}

function cosine(a, b) {
  let dot = 0;
  let a2 = 0;
  let b2 = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    a2 += a[i] * a[i];
    b2 += b[i] * b[i];
  }
  if (!a2 || !b2) return 0;
  return dot / (Math.sqrt(a2) * Math.sqrt(b2));
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    llmConfigured: Boolean(openai),
    sourceCount: db.prepare('SELECT COUNT(*) AS n FROM sources').get().n,
    chunkCount: db.prepare('SELECT COUNT(*) AS n FROM chunks').get().n
  });
});

app.get('/api/sources', (_req, res) => {
  const rows = db.prepare(`
    SELECT s.*, COUNT(c.id) AS chunk_count
    FROM sources s LEFT JOIN chunks c ON c.source_id = s.id
    GROUP BY s.id ORDER BY s.retrieved_at DESC
  `).all();
  res.json(rows);
});

app.post('/api/ingest', async (req, res) => {
  try {
    const { title, sourceUrl, publisher = '', version = '', content } = req.body || {};
    if (!title?.trim() || !sourceUrl?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'title, sourceUrl and content are required' });
    }
    const pieces = chunkText(content);
    if (!pieces.length) return res.status(400).json({ error: 'No ingestible text found' });

    const embeddings = await embedMany(pieces);
    const sourceHash = sha256(content);
    const sourceId = `src_${sourceHash.slice(0, 20)}`;
    const now = new Date().toISOString();

    const write = db.transaction(() => {
      db.prepare(`INSERT OR REPLACE INTO sources
        (id,title,source_url,publisher,version,retrieved_at,content_hash)
        VALUES (?,?,?,?,?,?,?)`)
        .run(sourceId, title.trim(), sourceUrl.trim(), publisher.trim(), version.trim(), now, sourceHash);
      db.prepare('DELETE FROM chunks WHERE source_id = ?').run(sourceId);
      const insertChunk = db.prepare(`INSERT INTO chunks
        (id,source_id,chunk_index,content,content_hash,embedding_json)
        VALUES (?,?,?,?,?,?)`);
      pieces.forEach((piece, i) => {
        const h = sha256(piece);
        insertChunk.run(`chk_${h.slice(0, 24)}`, sourceId, i, piece, h, JSON.stringify(embeddings[i]));
      });
    });
    write();
    res.json({ ok: true, sourceId, sourceHash, chunks: pieces.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Ingestion failed' });
  }
});

app.post('/api/ask', async (req, res) => {
  try {
    const question = String(req.body?.question || '').trim();
    if (!question) return res.status(400).json({ error: 'question is required' });
    if (!openai) return res.status(503).json({ error: 'OPENAI_API_KEY is not configured' });

    const [qEmbedding] = await embedMany([question]);
    const rows = db.prepare(`
      SELECT c.id AS chunk_id, c.content, c.content_hash, c.chunk_index, c.embedding_json,
             s.id AS source_id, s.title, s.source_url, s.publisher, s.version, s.content_hash AS source_hash
      FROM chunks c JOIN sources s ON s.id = c.source_id
    `).all();
    if (!rows.length) return res.status(409).json({ error: 'No sources have been ingested yet' });

    const topK = Math.max(1, Math.min(Number(process.env.TOP_K || 5), 10));
    const evidence = rows
      .map((r) => ({ ...r, score: cosine(qEmbedding, JSON.parse(r.embedding_json)) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    const context = evidence.map((e, i) =>
      `[E${i + 1}] ${e.title}${e.version ? ` (${e.version})` : ''}\nSource: ${e.source_url}\nChunk: ${e.chunk_id}\n${e.content}`
    ).join('\n\n---\n\n');

    const model = process.env.CHAT_MODEL || 'gpt-5.6-luna';
    const response = await openai.responses.create({
      model,
      input: [
        {
          role: 'system',
          content: 'Answer only from the supplied retrieved evidence. If the evidence is insufficient, say so. Cite supporting evidence inline as [E1], [E2], etc. Do not invent sources or claims.'
        },
        {
          role: 'user',
          content: `Question:\n${question}\n\nRetrieved evidence:\n${context}`
        }
      ]
    });

    const answer = response.output_text?.trim() || 'No answer returned.';
    res.json({
      answer,
      model,
      evidence: evidence.map((e, i) => ({
        ref: `E${i + 1}`,
        sourceId: e.source_id,
        sourceTitle: e.title,
        sourceUrl: e.source_url,
        publisher: e.publisher,
        version: e.version,
        sourceHash: e.source_hash,
        chunkId: e.chunk_id,
        chunkHash: e.content_hash,
        chunkIndex: e.chunk_index,
        similarity: Number(e.score.toFixed(4)),
        excerpt: e.content.slice(0, 420)
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Question failed' });
  }
});

app.listen(port, () => console.log(`AI Data Provenance RAG listening on :${port}`));
