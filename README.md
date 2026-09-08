# TenantSage Governed-Evidence Benchmark

Controlled demonstration of the difference between a general-purpose AI system and a TenantSage-governed evidence system.

## Purpose

This repository is not a model benchmark. TenantSage can call the same class of LLM used by other assistants. The experiment compares **system architecture**:

- General-purpose assistant: broad provider-controlled knowledge/retrieval path.
- TenantSage: sourced closed corpus -> deterministic eligibility -> EEB -> governed retrieval -> LLM -> validation/provenance.

The expected result is not necessarily a different answer. The intended proof is that TenantSage can show which exact evidence was eligible, which evidence was denied, why the decision occurred, and what evidence reached generation.

## Current scaffold

- `lib/models.dart` — typed source, chunk, request, decision, and result models.
- `lib/tenantsage_middleware.dart` — fail-closed eligibility prototype and EEB identifier generation.
- `data/source_registry.json` — source registry skeleton for EU AI Act, NIST AI RMF, OECD AI Principles, and UNESCO AI Ethics Recommendation.
- `data/chunk_schema.example.json` — structural chunk and provenance contract.
- `benchmark/questions.json` — 10-question live demonstration sequence.
- `docs/ARCHITECTURE.md` — system comparison, claim boundary, and evidence-capture design.

## Important status

This branch is an architecture/prototype scaffold. It does **not yet** contain copied regulatory source text, production vector search, live TenantSage core adapters, or an LLM provider connection. Those should be added only after authoritative-source ingestion, licence verification, and integration testing.

## Core invariant

> No evidence is provided to generation unless it has been admitted through the governed evidence boundary.

## Next implementation stages

1. Authoritative HTML/XML ingestion and source hashing.
2. Structural chunk creation with stable IDs and metadata.
3. Vector datastore and retrieval adapter.
4. TenantSage S1-S3 middleware adapter.
5. LLM generation using only eligible retrieved context.
6. S7 citation/claim validation.
7. Browser UI showing answer, sources, EEB, allow/deny counts, reason codes, and provenance.
8. Record/replay benchmark runner for the 10 fixed questions.
