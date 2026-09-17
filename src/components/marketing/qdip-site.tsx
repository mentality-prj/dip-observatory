import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Blocks,
  Braces,
  Check,
  ChevronRight,
  CircleGauge,
  Eye,
  Factory,
  FileSearch,
  GitBranch,
  Globe2,
  KeyRound,
  Network,
  Play,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Workflow,
} from "lucide-react";

import { observatoryHref, studioHref } from "@/lib/platform-urls";

import { QdipLogo } from "./qdip-logo";
import styles from "./qdip-site.module.css";

const demos = [
  {
    title: "European gas forecasting",
    description:
      "Forecast market conditions, compare BUY / WAIT / SPLIT alternatives and inspect calibration evidence.",
    domain: "ENERGY",
    href: observatoryHref("en/gas-forecast"),
    icon: BarChart3,
    accent: "indigo",
  },
  {
    title: "Production replanning",
    description:
      "Respond to live disruptions, test recovery scenarios and expose propagation risk before acting.",
    domain: "MANUFACTURING",
    href: observatoryHref("en/production-replanning"),
    icon: Factory,
    accent: "amber",
  },
  {
    title: "Resource allocation",
    description:
      "Allocate mobile teams across demand, skills, capacity, accessibility and travel constraints.",
    domain: "OPERATIONS",
    href: observatoryHref("en/resource-allocation"),
    icon: Network,
    accent: "cyan",
  },
  {
    title: "Supplier decision",
    description:
      "Compare suppliers across cost, resilience, uncertainty and explicit operational constraints.",
    domain: "SUPPLY CHAIN",
    href: observatoryHref("en/supplier-decision"),
    icon: Scale,
    accent: "violet",
  },
  {
    title: "Production scheduling",
    description:
      "Explore capacity, deadlines and disruptions in an interactive scheduling decision lab.",
    domain: "PLANNING",
    href: observatoryHref("en/production-scheduling"),
    icon: Workflow,
    accent: "rose",
  },
  {
    title: "Decision core lab",
    description:
      "Run reference scenarios through state, alternatives, risk, uncertainty and evidence.",
    domain: "PLATFORM",
    href: observatoryHref("en/scenarios"),
    icon: GitBranch,
    accent: "azure",
  },
] as const;

const capabilities = [
  ["Hybrid reasoning", "Combine rules, analytical models and optimization in one traceable execution path.", Blocks],
  ["Decision evidence", "See which conditions passed, which rules matched and why an alternative ranked first.", FileSearch],
  ["Human control", "Keep experts in the loop for review, adjustment, approval and outcome feedback.", SlidersHorizontal],
  ["Tenant boundaries", "Scope API keys, decision profiles and audit records to the organization that owns them.", KeyRound],
] as const;

export function QdipSite() {
  return (
    <main className={styles.site}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link aria-label="QDIP home" href="/">
            <QdipLogo />
          </Link>
          <nav aria-label="Primary navigation" className={styles.nav}>
            <a href="#platform">Platform</a>
            <a href="#products">Products</a>
            <a href="#demos">Live demos</a>
            <a href="#trust">Trust</a>
          </nav>
          <div className={styles.headerActions}>
            <Link className={styles.textLink} href={studioHref()}>
              Open Studio
            </Link>
            <Link className={styles.primaryButton} href={observatoryHref("en")}>
              Explore demos <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div aria-hidden="true" className={styles.heroGrid} />
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>
            <span /> Quality-driven decision intelligence
          </div>
          <h1>
            From complex signals to decisions <em>you can defend.</em>
          </h1>
          <p>
            QDIP models alternatives, quantifies uncertainty and preserves the
            evidence behind every recommendation—before people or systems act.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButtonLarge} href={observatoryHref("en")}>
              <Play fill="currentColor" size={16} /> Explore live demos
            </Link>
            <Link className={styles.secondaryButton} href={studioHref()}>
              Build in Studio <ArrowRight size={16} />
            </Link>
          </div>
          <div className={styles.heroProof}>
            <ShieldCheck size={17} />
            Explainable by design · Human-governed · API-first
          </div>
        </div>

        <div className={styles.heroVisual} aria-label="QDIP decision trace preview">
          <div className={styles.visualTopbar}>
            <span>LIVE DECISION TRACE</span>
            <span className={styles.liveIndicator}>ENGINE ONLINE</span>
          </div>
          <div className={styles.visualBody}>
            <div className={styles.stateHeader}>
              <div>
                <small>CURRENT STATE</small>
                <strong>Supply disruption</strong>
              </div>
              <div className={styles.confidenceRing}>
                <span>87%</span>
                <small>confidence</small>
              </div>
            </div>
            <div className={styles.traceFlow}>
              <div className={styles.flowStep} data-active="true">
                <i><CircleGauge size={16} /></i>
                <span>STATE</span>
              </div>
              <b />
              <div className={styles.flowStep} data-active="true">
                <i><GitBranch size={16} /></i>
                <span>OPTIONS</span>
              </div>
              <b />
              <div className={styles.flowStep} data-active="true">
                <i><Scale size={16} /></i>
                <span>RISK</span>
              </div>
              <b />
              <div className={styles.flowStep} data-active="true">
                <i><Check size={16} /></i>
                <span>DECISION</span>
              </div>
            </div>
            <div className={styles.alternatives}>
              <div>
                <span><i className={styles.signalDot} /> Reroute supply</span>
                <strong>82.4</strong>
                <small>RECOMMENDED</small>
              </div>
              <div>
                <span><i className={styles.amberDot} /> Hold schedule</span>
                <strong>61.8</strong>
                <small>HIGHER RISK</small>
              </div>
            </div>
            <div className={styles.explanation}>
              <Sparkles size={17} />
              <p>
                <strong>Why this decision?</strong>
                Rerouting protects the service threshold while keeping cost and
                propagation risk inside policy limits.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.proofStrip} aria-label="Platform qualities">
        <span>One decision layer</span>
        <div><Check size={15} /> Rules + models + optimization</div>
        <div><Check size={15} /> Evidence on every run</div>
        <div><Check size={15} /> Human approval when it matters</div>
      </section>

      <section className={styles.problem}>
        <div className={styles.problemGrid}>
          <div>
            <div className={styles.darkEyebrow}>THE PROBLEM</div>
            <h2>More AI.<br />More dashboards.<br /><span>Still no accountable decision.</span></h2>
          </div>
          <div className={styles.problemAnswer}>
            <div className={styles.darkEyebrow}>THE QDIP SHIFT</div>
            <h3>Move from insight to a decision—with the reasoning attached.</h3>
            <div className={styles.answerRows}>
              <div><strong>01</strong><span>Uncertainty is explicit</span></div>
              <div><strong>02</strong><span>Alternatives are comparable</span></div>
              <div><strong>03</strong><span>Every outcome is auditable</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.platform} id="platform">
        <div className={styles.sectionIntro}>
          <div className={styles.eyebrow}><span /> One platform, full decision lifecycle</div>
          <h2>Model. Decide. Observe. Improve.</h2>
          <p>
            QDIP keeps authoring, execution and observation connected without
            collapsing them into one opaque AI workflow.
          </p>
        </div>

        <div className={styles.platformLayers} id="products">
          <article className={styles.layerCard}>
            <div className={styles.layerNumber}>01</div>
            <div className={styles.layerIcon}><Braces size={24} /></div>
            <div>
              <span>QDIP ENGINE</span>
              <h3>Execute governed decisions</h3>
              <p>Evaluate rules, models, constraints, uncertainty and alternatives behind one stable API.</p>
              <ul>
                <li>Hybrid rule + ML execution</li>
                <li>Risk and uncertainty analysis</li>
                <li>Versioned traces and evidence</li>
              </ul>
            </div>
          </article>

          <article className={styles.layerCard}>
            <div className={styles.layerNumber}>02</div>
            <div className={styles.layerIcon}><SlidersHorizontal size={24} /></div>
            <div>
              <span>QDIP STUDIO</span>
              <h3>Design decision systems</h3>
              <p>Configure profiles, plugins, dimensions and output bindings without hiding the execution contract.</p>
              <ul>
                <li>Decision profile authoring</li>
                <li>Plugin and capability registry</li>
                <li>Schema-driven configuration</li>
              </ul>
              <Link href={studioHref()}>Open Studio <ArrowRight size={15} /></Link>
            </div>
          </article>

          <article className={styles.layerCard}>
            <div className={styles.layerNumber}>03</div>
            <div className={styles.layerIcon}><Eye size={24} /></div>
            <div>
              <span>QDIP OBSERVATORY</span>
              <h3>See decisions before they scale</h3>
              <p>Replay scenarios, compare alternatives and inspect risk, evidence and outcomes in context.</p>
              <ul>
                <li>Interactive scenario analysis</li>
                <li>State and trajectory views</li>
                <li>Human feedback and audit</li>
              </ul>
              <Link href={observatoryHref("en")}>Open Observatory <ArrowRight size={15} /></Link>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.demoSection} id="demos">
        <div className={styles.demoHeading}>
          <div>
            <div className={styles.eyebrow}><span /> QDIP in action</div>
            <h2>Live decision demonstrators</h2>
          </div>
          <p>
            Explore domain-specific workspaces with explicit alternatives,
            uncertainty, constraints and decision evidence—not static mockups.
          </p>
        </div>
        <div className={styles.demoGrid}>
          {demos.map(({ title, description, domain, href, icon: Icon, accent }) => (
            <Link className={styles.demoCard} data-accent={accent} href={href} key={title}>
              <div className={styles.demoCardTop}>
                <span className={styles.demoIcon}><Icon size={20} /></span>
                <span>{domain}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <div className={styles.demoLink}>Run demo <ArrowRight size={16} /></div>
            </Link>
          ))}
        </div>
        <div className={styles.allDemos}>
          <Link className={styles.secondaryButtonDark} href={observatoryHref("en")}>
            View every demonstrator <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className={styles.trust} id="trust">
        <div className={styles.trustLead}>
          <div className={styles.eyebrow}><span /> Built for accountable automation</div>
          <h2>Trust is part of the execution path.</h2>
          <p>
            QDIP does not ask teams to accept an unexplained score. Evidence,
            ownership and review remain attached to the decision lifecycle.
          </p>
          <div className={styles.trustBadge}>
            <ShieldCheck size={20} /> Explainable and auditable by design
          </div>
        </div>
        <div className={styles.capabilityGrid}>
          {capabilities.map(([title, description, Icon]) => (
            <article key={title}>
              <Icon size={21} />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.finalCta}>
        <div aria-hidden="true" className={styles.ctaGlow} />
        <div>
          <Globe2 size={28} />
          <h2>See the decision—not just the dashboard.</h2>
          <p>Run a live scenario, inspect the evidence and challenge the recommended action.</p>
        </div>
        <div className={styles.ctaActions}>
          <Link className={styles.primaryButtonLarge} href={observatoryHref("en")}>
            Explore Observatory <ArrowRight size={16} />
          </Link>
          <Link className={styles.darkTextLink} href={studioHref()}>
            Configure in Studio <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>
          <QdipLogo inverse />
          <p>Quality-driven Decision Intelligence Platform.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href={studioHref()}>Studio</Link>
          <Link href={observatoryHref("en")}>Observatory</Link>
          <a href="#demos">Demos</a>
          <a href="#platform">Platform</a>
        </nav>
        <span>© {new Date().getFullYear()} QDIP</span>
      </footer>
    </main>
  );
}
