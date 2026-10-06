# Minimal architecture

```text
Browser UI
  ├─ Ingest form
  │    └─ POST /api/ingest
  │         ├─ chunk text
  │         ├─ embed chunks
  │         └─ SQLite: sources + chunks
  │
  └─ Chat form
       └─ POST /api/ask
            ├─ embed question
            ├─ cosine similarity over stored chunk embeddings
            ├─ top-K evidence
            ├─ LLM answer constrained to retrieved evidence
            └─ response with answer + provenance
```

The app deliberately keeps retrieval and generation in one service for the first deployment. The seam for later TenantSage integration is immediately before retrieval: a middleware can evaluate the request and restrict which chunk records are eligible before cosine ranking runs.
