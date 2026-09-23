import type { GtmDemo } from './contracts'
import type { PipelineProspect, PipelineRun } from './import-contracts'

export type GtmDecision = 'PURSUE' | 'RESEARCH' | 'WATCH' | 'SKIP'
export type EvidenceKind = 'FACT' | 'SIGNAL' | 'HYPOTHESIS' | 'UNKNOWN'

export type PortfolioEvidence = {
  id: string
  kind?: EvidenceKind
  content: string
  source?: string
  sourceType?: string
  observedAt?: string
  freshness?: number
  confidence?: number
}

export type PortfolioItem = {
  id: string
  companyId: string
  opportunityId: string
  name: string
  domain?: string | null
  country?: string | null
  industry?: string | null
  decision: GtmDecision
  opportunity: number
  uncertainty: number
  evidenceQuality: number
  confidence?: number | null
  qdipFit: number
  reasons: string[]
  risks: string[]
  missingInformation: string[]
  researchObjectives: string[]
  evidence: PortfolioEvidence[]
  capability?: { id: string; name: string; problem?: string | null; rationale: string[] } | null
  nextAction?: { type: string; title: string; description?: string | null; targetRole?: string | null; reason?: string | null } | null
  provenance?: { decisionId: string; executedAt: string; pluginId: string; pluginVersion?: string | null; modelVersion?: string | null; traceId?: string | null } | null
  error?: string | null
}

export type PortfolioModel = { source: 'DEMO' | 'IMPORTED'; id: string; status: string; items: PortfolioItem[]; failed: number }

function decisionIdentity(companyId: string, opportunityId: string, decisionId?: string | null) { return `${companyId}:${opportunityId}:${decisionId ?? 'decision'}` }

export function fromDemo(data: GtmDemo): PortfolioModel {
  return {
    source: 'DEMO', id: data.dataset_id, status: 'COMPLETED', failed: 0,
    items: data.prospects.map((prospect) => ({
      id: decisionIdentity(prospect.company.id, prospect.decision.opportunity_id, prospect.decision.opportunity_id),
      companyId: prospect.company.id, opportunityId: prospect.decision.opportunity_id,
      name: prospect.company.name, domain: prospect.company.domain, country: prospect.company.country, industry: prospect.company.industry,
      decision: prospect.decision.decision, opportunity: prospect.opportunity.problem_probability,
      uncertainty: prospect.decision.uncertainty, evidenceQuality: prospect.decision.evidence_quality,
      confidence: prospect.decision.confidence ?? null, qdipFit: prospect.opportunity.qdip_fit,
      reasons: prospect.decision.explanation, risks: [], missingInformation: prospect.decision.missing_information,
      researchObjectives: prospect.decision.research_objectives,
      evidence: prospect.evidence.map((evidence) => ({ id: evidence.id, content: evidence.content, source: evidence.source, sourceType: evidence.source_type, observedAt: evidence.observed_at ?? evidence.collected_at ?? undefined, freshness: evidence.freshness, confidence: evidence.confidence })),
      capability: null, nextAction: null,
      provenance: { decisionId: prospect.decision.opportunity_id, executedAt: '', pluginId: 'gtm-lab', modelVersion: prospect.decision.model_version },
    })),
  }
}

function portfolioItemFromPipeline(prospect: PipelineProspect, opportunityId: string): PortfolioItem | null {
  const decision = prospect.decisions.find((candidate) => candidate.opportunity_id === opportunityId)
  const opportunity = prospect.opportunities.find((candidate) => candidate.id === opportunityId)
  if (!decision || !opportunity) return null
  const details = decision.explanation_details
  const capability = decision.qdip_capability_fit ?? opportunity.capability_fit ?? null
  return {
    id: decisionIdentity(prospect.company.id, opportunity.id, decision.provenance?.decision_id), companyId: prospect.company.id,
    opportunityId: opportunity.id, name: prospect.company.name, domain: prospect.company.domain, country: prospect.company.country,
    industry: prospect.company.industry, decision: decision.decision, opportunity: opportunity.problem_probability,
    uncertainty: decision.uncertainty, evidenceQuality: decision.evidence_quality, confidence: decision.confidence,
    qdipFit: opportunity.qdip_fit, reasons: details?.reasons ?? decision.explanation, risks: details?.risks ?? [],
    missingInformation: details?.missing_information ?? decision.missing_information,
    researchObjectives: details?.research_objectives ?? decision.research_objectives,
    evidence: prospect.evidence.map((evidence) => ({ id: evidence.id, kind: evidence.kind, content: evidence.content, source: evidence.source, sourceType: evidence.source_type, observedAt: evidence.observed_at ?? evidence.collected_at, freshness: evidence.freshness, confidence: evidence.confidence })),
    capability: capability ? { id: capability.capability_id, name: capability.capability_name, problem: capability.problem_statement, rationale: capability.rationale } : null,
    nextAction: decision.next_action ? { type: decision.next_action.type, title: decision.next_action.title, description: decision.next_action.description, targetRole: decision.next_action.target_role, reason: decision.next_action.reason } : null,
    provenance: decision.provenance ? { decisionId: decision.provenance.decision_id, executedAt: decision.provenance.executed_at, pluginId: decision.provenance.plugin_id, pluginVersion: decision.provenance.plugin_version, modelVersion: decision.provenance.model_version, traceId: decision.provenance.trace_id } : null,
    error: prospect.error,
  }
}

export function fromPipeline(run: PipelineRun): PortfolioModel {
  const items: PortfolioItem[] = []
  for (const prospect of run.prospects) {
    for (const decision of prospect.decisions) {
      const item = portfolioItemFromPipeline(prospect, decision.opportunity_id)
      if (item) items.push(item)
    }
  }
  return { source: 'IMPORTED', id: run.run_id, status: run.status, items, failed: run.summary.failed_prospects }
}
