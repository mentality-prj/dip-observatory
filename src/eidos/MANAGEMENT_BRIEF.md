# EIDOS Decision Observatory Management Brief

Polish version: [`MANAGEMENT_BRIEF.pl.md`](./MANAGEMENT_BRIEF.pl.md)

This document explains the current prototype in product and delivery terms for
EIDOS stakeholders, sponsors, and management.

## 1. Executive summary

The current branch delivers a standalone EIDOS Decision Observatory prototype
inside `dip-observatory`.

Its purpose is to test one product hypothesis:

> An energy-procurement expert can supervise many clients more effectively when
> the interface highlights only decision exceptions, shows why a recommendation
> changed, compares alternatives under different market scenarios, and later
> checks whether the decision turned out well.

The prototype is deliberately safe:

- it uses synthetic data only
- it does not connect to EIDOS systems
- it does not change DIP Core or any database
- it does not make or persist real procurement decisions

## 2. What is already implemented

The prototype already demonstrates a full review workflow for a portfolio of 20
synthetic clients.

### Portfolio overview

- all clients are visible in one place
- the interface collapses attention onto a smaller exception set
- the current synthetic portfolio resolves to:
  `20 total / 12 stable / 4 strategy changed / 2 high risk / 2 action required`

### Exception-first investigation

- a user can search, filter, and sort the portfolio
- a user can jump directly from the list into one client decision
- the detail view clearly distinguishes the current strategy from the
  recommended strategy

### Scenario-based decision exploration

- each client can be inspected under multiple market scenarios
- changing the scenario can change the preferred strategy
- the interface exposes the cost/risk trade-off rather than hiding it

### Explainability and auditability

- the interface explains why a recommendation changed using structured factors
- the prototype includes a decision replay panel for presentation and reasoning
- the prototype shows twelve months of synthetic history
- the prototype tracks synthetic outcomes: expected vs. actual cost and a simple
  favourable/neutral/unfavourable verdict

## 3. What has been technically verified

The branch is not just a static mockup. The following behaviour is covered by
automated validation:

- production build succeeds
- deterministic unit tests verify the synthetic dataset and decision engine
- end-to-end browser tests verify the main user flows

The validated flows include:

- opening the localized EIDOS route
- seeing the synthetic-data disclaimer and summary metrics
- searching clients by name
- narrowing the list by decision status
- selecting a client and opening the detail view
- switching a scenario and observing recommendation changes
- rendering decision history and outcome tracking

## 4. What the prototype proves

This branch is suitable for answering workflow and product questions such as:

- Is an exception-oriented portfolio view more useful than reviewing one client
  at a time?
- Do experts need to see only the recommendation, or also the alternatives and
  the trade-offs?
- Is scenario switching a useful exploration tool during client oversight?
- Does outcome tracking strengthen trust and retrospective learning?
- Is the proposed interaction model understandable within a short live demo?

## 5. What the prototype does not prove

This branch does **not** prove:

- financial accuracy
- quality of any real procurement recommendation
- correctness of a production-grade risk model
- readiness for production rollout
- integration readiness with EIDOS operational systems
- scalability to large real portfolios or real-time data volumes

It validates workflow and product direction, not commercial or quantitative
correctness.

## 6. Recommended demo narrative

The most effective management demo is approximately 5 to 7 minutes.

Suggested storyline:

1. Open `/eidos` and show that the interface immediately narrows 20 clients down
   to 8 that need attention.
2. Start with the default demo client whose recommendation changed from
   `BUY 20%` to `BUY 40%`.
3. Show the explanation panel to answer the management question, "Why did the
   recommendation change?"
4. Show the alternatives table and trade-off chart to demonstrate that the tool
   supports expert judgment instead of hiding it.
5. Switch the scenario from `BASELINE` to `HIGH_PRICE` and show that the
   preferred strategy changes.
6. Close with decision history and outcome tracking to demonstrate learning and
   accountability, not just point-in-time recommendation display.

## 7. Business value if the hypothesis holds

If real users confirm the workflow, the prototype suggests a path to several
practical gains:

- one expert can monitor more client portfolios without reading every stable case
- changed decisions become visible faster
- management gets a clearer audit trail for why decisions changed
- experts can compare alternatives before overriding or accepting a suggestion
- outcomes can be reviewed later to improve trust and calibration

In short: the interface aims to scale expert oversight, not replace expert
judgment.

## 8. Key limitations management should understand

The current prototype intentionally simplifies reality.

- all client data is synthetic
- the scenario set is small and fixed
- the recommendation model is a compact heuristic
- there is no user workflow for approval, override persistence, or collaboration
- there is no tenant-aware live data access
- there is no real audit store

Those limits are acceptable for a hypothesis demo and unacceptable for
production use.

## 9. Main delivery risks on the road to a real product

If EIDOS decides to move beyond the prototype, the main risks are not visual.
They are integration and governance risks:

- connecting real market, client, and decision data cleanly
- defining which engine owns the authoritative recommendation
- storing executed decisions and real outcomes over time
- agreeing how experts can override recommendations and how that override is
  audited
- aligning product language with legal/commercial constraints around decision
  support
- proving that the interface stays useful with real portfolio sizes and noisy
  data

## 10. Recommended next steps

### Product discovery

1. Run live reviews with actual EIDOS decision-makers.
2. Observe whether they trust the exception-first workflow.
3. Capture which explanation and outcome signals they consider mandatory.

### Integration planning

1. Define the read-only API contract for client portfolio, market scenarios,
   recommendation source, history, and outcomes.
2. Decide whether recommendation logic is computed upstream or in the
   Observatory layer.
3. Define the minimum audit trail required for an MVP.

### MVP scoping

1. Start with read-only integration.
2. Keep scenario exploration and explanation.
3. Add persisted outcome tracking before adding write actions.

## 11. Go / no-go questions for management

Before funding a production path, management should be able to answer:

- Which exact user role owns the final procurement decision?
- Which decisions truly require explanation and auditability?
- Which outcome metric matters most: cost variance, exposure reduction,
  contract stability, or another KPI?
- Is the goal oversight, recommendation support, or approval workflow?
- What level of model transparency is required for internal adoption?

## 12. Bottom line

This branch already delivers a credible, interactive prototype of an EIDOS
Decision Observatory. It is strong enough for stakeholder demos, workflow
validation, and product discussion.

It should be treated as a validated prototype, not as a production-ready
decision system.
