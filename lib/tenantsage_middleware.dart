import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'models.dart';

class TenantSageMiddleware {
  const TenantSageMiddleware();

  BenchmarkResult evaluate({
    required BenchmarkRequest request,
    required List<GovernanceChunk> candidates,
  }) {
    final decisions = candidates.map((chunk) => _decide(request, chunk)).toList();
    final allowed = decisions.where((d) => d.allowed).toList();
    final denied = decisions
        .where((d) => !d.allowed)
        .map(
          (d) => DeniedEvidenceDecision(
            chunkId: d.chunk.chunkId,
            sourceId: d.chunk.sourceId,
            frameworkId: d.chunk.frameworkId,
            structuralPath: d.chunk.structuralPath,
            reasons: d.reasons,
          ),
        )
        .toList();
    final eligibleChunks = allowed.map((d) => d.chunk).toList()
      ..sort((a, b) => a.chunkId.compareTo(b.chunkId));
    final eligibleBoundary = eligibleChunks
        .map(
          (chunk) => [
            chunk.chunkId,
            chunk.contentHash,
            chunk.provenance.sourceHash,
            chunk.provenance.sourceVersion ?? '',
          ].join(':'),
        )
        .join('|');

    final canonical = [
      request.tenantId,
      request.role,
      request.jurisdiction,
      request.purpose,
      request.asOf.toUtc().toIso8601String(),
      eligibleBoundary,
    ].join('|');

    final eebId = sha256.convert(utf8.encode(canonical)).toString();

    return BenchmarkResult(
      answer: allowed.isEmpty
          ? 'No eligible evidence is available for this request.'
          : 'Eligible evidence prepared for generation. Connect the configured LLM adapter to synthesize only from the allowed chunks.',
      candidateCount: candidates.length,
      allowed: allowed,
      denied: denied,
      eebId: eebId,
    );
  }

  EvidenceDecision _decide(BenchmarkRequest request, GovernanceChunk chunk) {
    final reasons = <String>[];

    if (chunk.classification != 'public') {
      reasons.add('classification_not_public');
    }
    final accessPolicy = chunk.accessPolicy;
    if (accessPolicy == null) {
      reasons.add('missing_access_policy');
    } else {
      final tenantAllowed = accessPolicy.tenantIds.contains('GLOBAL') ||
          accessPolicy.tenantIds.contains(request.tenantId);
      final roleAllowed =
          accessPolicy.roles.contains('GLOBAL') || accessPolicy.roles.contains(request.role);
      if (!tenantAllowed) {
        reasons.add('tenant_not_authorized');
      }
      if (!roleAllowed) {
        reasons.add('role_not_authorized');
      }
    }
    if (chunk.effectiveFrom != null && request.asOf.isBefore(chunk.effectiveFrom!)) {
      reasons.add('not_yet_effective');
    }
    if (chunk.effectiveTo != null && !request.asOf.isBefore(chunk.effectiveTo!)) {
      reasons.add('expired_or_superseded');
    }
    if (!chunk.jurisdictions.contains('GLOBAL') &&
        !chunk.jurisdictions.contains(request.jurisdiction)) {
      reasons.add('jurisdiction_mismatch');
    }

    return EvidenceDecision(
      chunk: chunk,
      allowed: reasons.isEmpty,
      reasons: reasons.isEmpty ? const ['eligible'] : reasons,
    );
  }
}
