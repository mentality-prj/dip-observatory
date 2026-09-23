import type { MarketingLocale } from '../qdip-copy'
import { useCasesI18n } from './i18n'

export type DepthPageKey = 'how-it-works' | 'use-cases' | 'core' | 'core/research'
export type ContentSection = {
  eyebrow?: string
  title: string
  body: string
  items?: readonly { title: string; body: string }[]
}
export type CaseStudy = {
  pattern: string
  title: string
  question: string
  problem: string
  inputs: string
  evaluation: string
  output: string
  href: string
}

export type DepthContent = {
  nav: readonly [string, string, string, string]
  hero: readonly [string, string, string]
  sections: readonly ContentSection[]
  cases?: readonly CaseStudy[]
  cta: readonly [string, string, string]
}

const en: Record<DepthPageKey, DepthContent> = {
  'how-it-works': {
    nav: ['How it works', 'Solutions', 'Technology', 'Research'],
    hero: [
      'HOW QDIP WORKS',
      'Turn a recurring decision into a repeatable decision system.',
      'QDIP structures the information your team already uses, evaluates explicit alternatives under priorities, constraints, risk and uncertainty, and returns a recommendation with evidence. The responsible person remains in control.',
    ],
    sections: [
      {
        eyebrow: '01 · START WITH THE DECISION',
        title: 'Formalize the decision before optimizing it.',
        body: 'A QDIP implementation starts with one decision your team already makes repeatedly. We identify the trigger, responsible role, available alternatives, objectives, constraints and evidence instead of beginning with a large data or transformation project.',
        items: [
          { title: 'Context', body: 'What is happening now, what changed, and what evidence is available?' },
          { title: 'Alternatives', body: 'What actions are genuinely available to the responsible person?' },
          { title: 'Objectives', body: 'What outcomes matter and how do competing priorities relate?' },
        ],
      },
      {
        eyebrow: '02 · MAKE TRADE-OFFS EXPLICIT',
        title: 'Evaluate what people currently compare in their heads or spreadsheets.',
        body: 'QDIP keeps expected effects, costs, risk, uncertainty and hard constraints separate. That makes the decision model reviewable and prevents an attractive but infeasible option from silently winning.',
        items: [
          { title: 'Effects & costs', body: 'Represent what each alternative is expected to achieve and require.' },
          {
            title: 'Risk & uncertainty',
            body: 'Keep possible downside and confidence in the available information visible.',
          },
          {
            title: 'Constraints',
            body: 'Exclude or penalize choices that violate operational, policy or resource limits.',
          },
        ],
      },
      {
        eyebrow: '03 · EVALUATE',
        title: 'One evaluation path. Comparable recommendations.',
        body: 'QDIP Core applies the configured decision model consistently to the current context. Domain-specific logic plugs into the same engine rather than creating a separate product for every use case.',
        items: [
          {
            title: 'Recommendation',
            body: 'A selected action or prioritized set of actions based on the configured model.',
          },
          { title: 'Evidence', body: 'Supporting information stays connected to the recommendation.' },
          { title: 'Trace', body: 'The evaluated path remains inspectable for review, debugging and governance.' },
        ],
      },
      {
        eyebrow: '04 · HUMAN AUTHORITY',
        title: 'QDIP recommends. Your organization decides.',
        body: 'The purpose is not to remove accountable judgment. It is to make repeated comparison more consistent and inspectable so the responsible person can focus on exceptions, judgment and action.',
      },
      {
        eyebrow: 'FROM PILOT TO USE',
        title: 'Start with one decision, not an enterprise transformation.',
        body: 'A practical adoption path is: describe one recurring decision → formalize its alternatives and constraints → test historical or realistic scenarios → compare QDIP recommendations with the current process → refine the model → integrate only if the result is useful.',
        items: [
          { title: 'Small scope', body: 'Choose one frequent decision with a clear owner and observable inputs.' },
          { title: 'Scenario validation', body: 'Test normal, edge and stress cases before operational use.' },
          {
            title: 'Expand deliberately',
            body: 'Reuse the decision architecture for adjacent decisions only after the first pattern is understood.',
          },
        ],
      },
    ],
    cta: [
      'Have a recurring decision like this?',
      'Show us the decision, the information used today and the constraints that matter. We can map it to a QDIP decision pattern before discussing integration.',
      'Describe your decision',
    ],
  },
  'use-cases': useCasesI18n.en,
  core: {
    nav: ['How it works', 'Solutions', 'Technology', 'Research'],
    hero: [
      'QDIP CORE',
      'A technical foundation for inspectable decision systems.',
      'QDIP Core keeps the decision contract explicit: context, alternatives, rules, constraints, risk, uncertainty, evidence, evaluation and recommendation remain connected through one execution path.',
    ],
    sections: [
      {
        eyebrow: 'ARCHITECTURE',
        title: 'Stable core, extensible decision domains.',
        body: 'Domain capabilities plug into a common decision runtime. This separates reusable decision infrastructure from domain-specific evidence and evaluation logic, so a new use case does not require a new product architecture.',
        items: [
          {
            title: 'Decision Engine',
            body: 'Evaluates explicit alternatives through a consistent execution contract.',
          },
          { title: 'Domain plugins', body: 'Supply domain-specific capabilities without redefining the core runtime.' },
          { title: 'Decision API', body: 'Provides a stable boundary between applications and decision execution.' },
        ],
      },
      {
        eyebrow: 'DECISION MODEL',
        title: 'Keep the important concepts separate.',
        body: 'State, alternatives, objectives, expected effects, costs, risk, uncertainty, constraints and evidence are modeled as distinct decision concepts. This makes the model easier to review, test and evolve than a single opaque score.',
      },
      {
        eyebrow: 'EVIDENCE & EXPLAINABILITY',
        title: 'A recommendation should remain inspectable.',
        body: 'QDIP preserves supporting evidence and execution trace so reviewers can inspect why an alternative was selected and which constraints or assumptions shaped the result.',
        items: [
          { title: 'Evidence', body: 'Supporting information remains attached to the evaluated decision.' },
          { title: 'Execution trace', body: 'The evaluated path is available for technical review and debugging.' },
          {
            title: 'Auditability',
            body: 'Decision context and engine metadata can be retained for governance and reproducibility.',
          },
        ],
      },
      {
        eyebrow: 'PRODUCTION BOUNDARIES',
        title: 'Designed as infrastructure, not a demo-specific calculation.',
        body: 'The platform architecture includes tenant-scoped access, API keys, rate limiting, asynchronous decision jobs, feature definitions and values, and an extensible plugin SDK. These boundaries allow applications such as Observatory and Studio to remain separate from decision execution.',
      },
      {
        eyebrow: 'PRODUCT SURFACES',
        title: 'Configure, evaluate, inspect.',
        body: 'Studio configures decision models. QDIP Core evaluates them. Observatory exposes recommendations, alternatives, evidence and scenario changes for inspection. Demos are configured applications of the same architecture.',
      },
    ],
    cta: [
      'Need the technical model behind the demos?',
      'Continue into the research and architecture material, or open a working decision application to inspect the product behavior directly.',
      'Explore Research',
    ],
  },
  'core/research': {
    nav: ['How it works', 'Solutions', 'Technology', 'Research'],
    hero: [
      'QDIP RESEARCH',
      'Decision engineering grounded in explicit assumptions, baselines and reproducible evaluation.',
      'QDIP treats research as a way to challenge the decision model, not decorate the product. We separate implemented capability, experimental evidence and open research questions, and we do not turn an unsuccessful experiment into a success claim.',
    ],
    sections: [
      {
        eyebrow: 'RESEARCH QUESTION',
        title: 'How should a system support repeated decisions under constraints and uncertainty?',
        body: 'The research layer studies how context, alternatives, expected effects, costs, risk, uncertainty and constraints can be represented and evaluated while keeping the recommendation inspectable and human authority explicit.',
      },
      {
        eyebrow: 'METHODOLOGY',
        title: 'Baseline first. Then complexity only when it earns its place.',
        body: 'Experiments define the task, dataset or scenario, baseline, evaluation metrics and failure criteria before interpreting a more complex method. A model that does not beat a relevant baseline is evidence to revise the hypothesis, not a reason to hide the baseline.',
        items: [
          {
            title: 'Baselines',
            body: 'Simple reference strategies establish whether additional complexity creates measurable value.',
          },
          {
            title: 'Scenario tests',
            body: 'Stable, degradation, stress, recovery, noise, missing-data and anomaly conditions expose brittle behavior.',
          },
          {
            title: 'Reproducibility',
            body: 'Inputs, configuration, engine version and evidence should make an evaluation repeatable and reviewable.',
          },
        ],
      },
      {
        eyebrow: 'CLOSED EXPERIMENT',
        title: 'A failed gate closes a product hypothesis.',
        body: 'The Gas Forecast research program was closed after the frozen out-of-sample economic gate failed. Its code and artifacts remain an R&D record, but Gas Forecast is not a public QDIP application or commercial demo.',
      },
      {
        eyebrow: 'RESOURCE ALLOCATION',
        title: 'Compare recommendations against the same evaluation path.',
        body: 'Resource Allocation evaluates a current/manual allocation through the same backend decision capability used for the recommendation. This avoids presenting a frontend-only comparison formula as scientific evidence and makes Current → QDIP → Δ meaningful only when both plans are feasible and evaluated consistently.',
      },
      {
        eyebrow: 'VALIDATION STATUS',
        title: 'Be explicit about what is known and what is not.',
        body: 'Public demos demonstrate implemented decision patterns. They do not by themselves prove customer ROI, universal optimality, academic validation or superiority over every existing process. Those claims require separate evidence.',
        items: [
          {
            title: 'Implemented',
            body: 'Decision engine, rules and constraints, evidence/trace, domain plugins and the public decision applications.',
          },
          {
            title: 'Experimentally tested',
            body: 'Selected hypotheses and baselines in controlled datasets or scenarios.',
          },
          {
            title: 'Under research',
            body: 'Generalization, advanced risk/uncertainty treatment, causal effects and domain-specific validation.',
          },
        ],
      },
      {
        eyebrow: 'WHY THIS MATTERS',
        title: 'Scientific discipline reduces product risk.',
        body: 'For a client, the practical value of this approach is not academic terminology. It is knowing which assumptions drive a recommendation, what evidence supports it, where uncertainty remains, and whether a more complicated method actually improves the decision process.',
      },
    ],
    cta: [
      'Want to evaluate QDIP on a real decision?',
      'A useful pilot starts with a falsifiable question: can a configured QDIP decision model make this recurring comparison more consistent and inspectable than the current process?',
      'Discuss a pilot',
    ],
  },
}

const translate = (locale: MarketingLocale): Record<DepthPageKey, DepthContent> => {
  if (locale === 'en') return en

  const uk = locale === 'uk'
  const labels = uk
    ? ['ЯК ПРАЦЮЄ QDIP', 'РІШЕННЯ', 'QDIP CORE', 'ДОСЛІДЖЕННЯ QDIP']
    : ['JAK DZIAŁA QDIP', 'ROZWIĄZANIA', 'QDIP CORE', 'BADANIA QDIP']
  const nav = uk
    ? (['Як це працює', 'Рішення', 'Технологія', 'Дослідження'] as const)
    : (['Jak to działa', 'Rozwiązania', 'Technologia', 'Badania'] as const)
  const cta = uk
    ? ([
        'Опишіть ваше регулярне рішення',
        'Покажіть нам один повторюваний вибір, дані та обмеження — ми визначимо, чи підходить для нього QDIP.',
        'Описати рішення',
      ] as const)
    : ([
        'Opisz swoją powtarzalną decyzję',
        'Pokaż nam jeden powtarzalny wybór, dane i ograniczenia — ocenimy, czy QDIP do niego pasuje.',
        'Opisz decyzję',
      ] as const)

  const localizeFallback = (page: DepthContent, i: number): DepthContent => ({
    ...page,
    nav,
    hero: [labels[i], page.hero[1], page.hero[2]],
    cta,
  })

  return {
    'how-it-works': localizeFallback(en['how-it-works'], 0),
    'use-cases': useCasesI18n[locale],
    core: localizeFallback(en.core, 2),
    'core/research': localizeFallback(en['core/research'], 3),
  }
}

export function getDepthContent(locale: MarketingLocale, key: DepthPageKey): DepthContent {
  return translate(locale)[key]
}
