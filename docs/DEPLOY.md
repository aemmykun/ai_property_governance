# Deployment notes

This app needs a writable filesystem because the minimal database is SQLite.

Required runtime settings:

- `OPENAI_API_KEY`
- `APP_API_KEY` (a secret bearer token required for source, ingest, and question endpoints)
- optional `CHAT_MODEL`
- optional `EMBEDDING_MODEL`
- optional `TOP_K`
- optional `DB_PATH`

For container hosting, mount a persistent volume at `/app/data` and set `DB_PATH=/app/data/rag.db` so ingested evidence survives restarts/redeploys.

The service exposes port `3000` by default and includes `GET /api/health` for health checks.

Set `APP_API_KEY` in the deployment environment (for example, generate one with `openssl rand -hex 32`). Authorized users enter this key in the app's API access key field. The protected endpoints have an in-memory limit of 30 requests per minute per service instance.

This first build is intentionally single-instance. If you later run multiple replicas, move source/chunk storage to a shared database/vector store before scaling horizontally.
