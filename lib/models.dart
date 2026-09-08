class GovernanceSource {
  GovernanceSource({
    required this.sourceId,
    required this.title,
    required this.publisher,
    required this.frameworkId,
    required this.jurisdictions,
    required this.bindingStatus,
    required this.authorityType,
    required this.canonicalUrl,
    required this.sourceVersion,
    required this.licenceId,
  });

  final String sourceId;
  final String title;
  final String publisher;
  final String frameworkId;
  final List<String> jurisdictions;
  final String bindingStatus;
  final String authorityType;
  final String canonicalUrl;
  final String sourceVersion;
  final String licenceId;

  factory GovernanceSource.fromJson(Map<String, dynamic> json) => GovernanceSource(
        sourceId: json['sourceId'] as String,
        title: json['title'] as String,
        publisher: json['publisher'] as String,
        frameworkId: json['frameworkId'] as String,
        jurisdictions: List<String>.from(json['jurisdictions'] as List),
        bindingStatus: json['bindingStatus'] as String,
        authorityType: json['authorityType'] as String,
        canonicalUrl: json['canonicalUrl'] as String,
        sourceVersion: json['sourceVersion'] as String,
        licenceId: json['licenceId'] as String,
      );
}

class GovernanceChunk {
  GovernanceChunk({
    required this.chunkId,
    required this.sourceId,
    required this.frameworkId,
    required this.content,
    required this.structuralPath,
    required this.chunkType,
    required this.jurisdictions,
    required this.bindingStatus,
    required this.classification,
    required this.visibility,
    required this.effectiveFrom,
    required this.effectiveTo,
    required this.contentHash,
    required this.tags,
  });

  final String chunkId;
  final String sourceId;
  final String frameworkId;
  final String content;
  final String structuralPath;
  final String chunkType;
  final List<String> jurisdictions;
  final String bindingStatus;
  final String classification;
  final String visibility;
  final DateTime? effectiveFrom;
  final DateTime? effectiveTo;
  final String contentHash;
  final List<String> tags;

  factory GovernanceChunk.fromJson(Map<String, dynamic> json) => GovernanceChunk(
        chunkId: json['chunkId'] as String,
        sourceId: json['sourceId'] as String,
        frameworkId: json['frameworkId'] as String,
        content: json['content'] as String,
        structuralPath: json['structuralPath'] as String,
        chunkType: json['chunkType'] as String,
        jurisdictions: List<String>.from(json['jurisdictions'] as List),
        bindingStatus: json['bindingStatus'] as String,
        classification: json['classification'] as String,
        visibility: json['visibility'] as String,
        effectiveFrom: json['effectiveFrom'] == null
            ? null
            : DateTime.parse(json['effectiveFrom'] as String),
        effectiveTo: json['effectiveTo'] == null
            ? null
            : DateTime.parse(json['effectiveTo'] as String),
        contentHash: json['contentHash'] as String,
        tags: List<String>.from(json['tags'] as List),
      );
}

class BenchmarkRequest {
  BenchmarkRequest({
    required this.question,
    required this.tenantId,
    required this.role,
    required this.jurisdiction,
    required this.purpose,
    required this.asOf,
  });

  final String question;
  final String tenantId;
  final String role;
  final String jurisdiction;
  final String purpose;
  final DateTime asOf;
}

class EvidenceDecision {
  EvidenceDecision({
    required this.chunk,
    required this.allowed,
    required this.reasons,
  });

  final GovernanceChunk chunk;
  final bool allowed;
  final List<String> reasons;
}

class BenchmarkResult {
  BenchmarkResult({
    required this.answer,
    required this.candidateCount,
    required this.allowed,
    required this.denied,
    required this.eebId,
  });

  final String answer;
  final int candidateCount;
  final List<EvidenceDecision> allowed;
  final List<EvidenceDecision> denied;
  final String eebId;
}
