# Deployment notes

This app needs a writable filesystem because the minimal database is SQLite.

Required runtime settings:

- `OPENAI_API_KEY`
- optional `CHAT_MODEL`
- optional `EMBEDDING_MODEL`
- optional `TOP_K`
- optional `DB_PATH`

For container hosting, mount a persistent volume at `/app/data` and set `DB_PATH=/app/data/rag.db` so ingested evidence survives restarts/redeploys.

The service exposes port `3000` by default and includes `GET /api/health` for health checks.

This first build is intentionally single-instance. If you later run multiple replicas, move source/chunk storage to a shared database/vector store before scaling horizontally.
