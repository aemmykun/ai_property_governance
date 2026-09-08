# TenantSage Governed-Evidence Benchmark

## Objective

Demonstrate a system-level difference, not a model competition.

- Computer A: a general-purpose AI assistant such as ChatGPT, Gemini, or Copilot.
- Computer B: a TenantSage-governed assistant using a closed, sourced evidence corpus.
- The same 10 questions are asked one by one.
- Similar answers are acceptable; the primary comparison is evidence control, provenance, eligibility and replayability.

## TenantSage path

```text
Question
  -> S0 Request Envelope
  -> S1 Authority Resolution
  -> S2 Governance/Purpose Resolution
  -> S3 Eligible Evidence Boundary (EEB)
  -> S4 Governed Retrieval
  -> S5 Governed Context
  -> S6 LLM Generation
  -> S7 Claim/Evidence Validation
  -> Answer + Evidence Proof
```

The LLM is downstream. No evidence is provided to generation unless it is admitted through the governed boundary.

## Corpus

Initial target sources:

1. EU AI Act
2. NIST AI RMF 1.0
3. OECD AI Principles
4. UNESCO Recommendation on the Ethics of AI

The ingestion process SHALL verify source URL, version, reuse/licence status, raw-source hash and structural parser version before chunks are accepted.

## Data model

A `GovernanceSource` is the provenance root for a document/version. A `GovernanceChunk` is a structurally derived evidence object linked to exactly one source.

Chunking SHALL follow native document structure rather than arbitrary visual/PDF segmentation where authoritative HTML/XML or structured text is available.

## Benchmark controls

The live demonstration is not intended to prove that one model is smarter. Record the following for each TenantSage run:

- question ID and exact question
- request context
- dataset/source versions
- candidate evidence count
- eligible chunk IDs
- denied chunk IDs and reason codes
- EEB identifier
- retrieved chunk IDs
- final citations
- answer
- latency

Do not claim comparative model accuracy unless both systems are tested under an independently controlled evaluation design.

## Demo UI

The TenantSage screen should expose:

- question
- request context
- candidate / eligible / denied counts
- EEB ID
- final answer
- cited sources and structural paths
- denial reason codes without exposing denied content
- provenance hashes

The strongest expected result may be: answers are materially similar, while TenantSage can prove exactly which evidence was permitted to reach generation and why.
