# AI Data Provenance RAG

A deliberately small retrieval-augmented generation app for answering questions from an ingested evidence corpus while showing exactly which source and chunk supported the answer.

This repository also contains a separate TenantSage governed-evidence benchmark scaffold. It is not integrated into the RAG application described below.

## What it does

1. User pastes source text plus its canonical URL, publisher, and version.
2. The server chunks the text and creates embeddings.
3. Source and chunk records are stored in SQLite with SHA-256 hashes.
4. A user asks a question in the chat UI.
5. The server retrieves the most similar stored chunks.
6. The LLM is instructed to answer only from those retrieved chunks.
7. The UI shows the answer plus source URL, source ID/hash, chunk ID/hash, excerpt, and similarity score.

The RAG application is a minimal retrieval layer. It does not implement TenantSage DAR/EEB governance; it can later sit behind TenantSage middleware.

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

## TenantSage Governed-Evidence Benchmark scaffold

This is a system-architecture demonstration, not a model benchmark. It compares a general-purpose assistant's broad provider-controlled knowledge/retrieval path with a TenantSage-governed path using a closed, sourced evidence corpus. The intended proof is which evidence was eligible or denied, why, and what reached generation.

The scaffold currently includes:

- `lib/models.dart` — typed source, chunk, request, decision, and result models.
- `lib/tenantsage_middleware.dart` — fail-closed eligibility prototype and EEB identifier generation.
- `data/source_registry.json` — source registry skeleton for EU AI Act, NIST AI RMF, OECD AI Principles, and UNESCO AI Ethics Recommendation.
- `data/chunk_schema.example.json` — structural chunk and provenance contract.
- `benchmark/questions.json` — 10-question live demonstration sequence.
- `docs/ARCHITECTURE.md` — system comparison, claim boundary, and evidence-capture design.

The benchmark scaffold does not yet include copied regulatory source text, production vector search, live TenantSage core adapters, or an LLM provider connection. Its core invariant is that no evidence reaches generation unless it passes the governed evidence boundary.

## Run locally

Requires Node.js 20+, an OpenAI API key, and an API access key for protected app endpoints.

```bash
cp .env.example .env
# set OPENAI_API_KEY and APP_API_KEY in .env
# generate APP_API_KEY with: openssl rand -hex 32
npm install
npm start
```

Open `http://localhost:3000`.

Environment variables:

- `OPENAI_API_KEY` — required for embeddings and answer generation
- `OPENAI_BASE_URL` — optional compatible endpoint
- `APP_API_KEY` — required to access sources, ingest evidence, and ask questions; enter it in the app's API access key field
- `CHAT_MODEL` — defaults to `gpt-5.6-luna`
- `EMBEDDING_MODEL` — defaults to `text-embedding-3-small`
- `TOP_K` — retrieved chunks, default `5`
- `DB_PATH` — SQLite location, default `./data/rag.db`
- `PORT` — default `3000`

## Ingesting evidence

The first version intentionally does not fetch arbitrary remote URLs. Use the ingestion panel to paste text you are permitted to store and give it the canonical source URL. This avoids an unnecessary web-scraping/SSRF surface while keeping provenance explicit.

The ingest, source-list, and question endpoints require a bearer token matching `APP_API_KEY`. The service also limits these authenticated endpoints to 30 requests per minute per instance. Configure `APP_API_KEY` as a secret in the deployment environment and share it only with authorized users.

Good initial subjects for the corpus include AI data provenance, data lineage, AI governance, evidence traceability, RAG governance, and public regulatory/framework material whose reuse conditions you have verified.

## Important claim boundary

A provenance record proves which stored source/chunk was retrieved and supplied to generation. It does **not**, by itself, prove that the underlying source is true or legally authoritative.
