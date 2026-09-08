# AI Data Provenance RAG

A deliberately small retrieval-augmented generation app for answering questions from an ingested evidence corpus while showing exactly which source and chunk supported the answer.

## What it does

1. User pastes source text plus its canonical URL, publisher, and version.
2. The server chunks the text and creates embeddings.
3. Source and chunk records are stored in SQLite with SHA-256 hashes.
4. A user asks a question in the chat UI.
5. The server retrieves the most similar stored chunks.
6. The LLM is instructed to answer only from those retrieved chunks.
7. The UI shows the answer plus source URL, source ID/hash, chunk ID/hash, excerpt, and similarity score.

This is the minimal RAG layer only. It does not implement TenantSage DAR/EEB governance yet; it is intended to be a small real retrieval application that can later sit behind TenantSage middleware.

## Architecture

```text
Ingestion UI
   ↓
source text + canonical URL
   ↓
chunk + embed
   ↓
SQLite
  ├─ sources
  └─ chunks + embeddings

Chat UI
   ↓
question embedding
   ↓
cosine retrieval (top K)
   ↓
retrieved evidence
   ↓
LLM
   ↓
answer + exact source/chunk provenance
```

## Run locally

Requires Node.js 20+ and an OpenAI API key.

```bash
cp .env.example .env
# add OPENAI_API_KEY to your environment
npm install
OPENAI_API_KEY=your_key npm start
```

Open `http://localhost:3000`.

Environment variables:

- `OPENAI_API_KEY` — required for embeddings and answer generation
- `OPENAI_BASE_URL` — optional compatible endpoint
- `CHAT_MODEL` — defaults to `gpt-5.6-luna`
- `EMBEDDING_MODEL` — defaults to `text-embedding-3-small`
- `TOP_K` — retrieved chunks, default `5`
- `DB_PATH` — SQLite location, default `./data/rag.db`
- `PORT` — default `3000`

## Ingesting evidence

The first version intentionally does not fetch arbitrary remote URLs. Use the ingestion panel to paste text you are permitted to store and give it the canonical source URL. This avoids an unnecessary web-scraping/SSRF surface while keeping provenance explicit.

Good initial subjects for the corpus include AI data provenance, data lineage, AI governance, evidence traceability, RAG governance, and public regulatory/framework material whose reuse conditions you have verified.

## Important claim boundary

A provenance record proves which stored source/chunk was retrieved and supplied to generation. It does **not**, by itself, prove that the underlying source is true or legally authoritative.
