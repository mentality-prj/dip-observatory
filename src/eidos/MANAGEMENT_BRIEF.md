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
- the prototype includes a decision replay panel for inspection and reasoning
- the prototype shows twelve months of synthetic history
- the prototype tracks synthetic outcomes: expected vs. actual cost and a simple
  favourable/neutral/unfavourable verdict

## 3. How the product supports daily work

The current product concept is aimed at the daily oversight workflow inside
EIDOS:

- it narrows a broad client portfolio to the cases that need attention now
- it lets an expert inspect the current strategy and the recommended strategy
  for a given client in one place
- it explains why a recommendation changed instead of showing a black-box output
- it compares procurement alternatives under different market assumptions
- it keeps decision history and tracked outcomes visible for retrospective
  review and learning

## 4. What the prototype proves

This branch is suitable for answering workflow and product questions such as:

- Is an exception-oriented portfolio view more useful than reviewing one client
  at a time?
- Do experts need to see only the recommendation, or also the alternatives and
  the trade-offs?
- Is scenario switching a useful exploration tool during client oversight?
- Does outcome tracking strengthen trust and retrospective learning?
- Is the proposed interaction model practical in everyday portfolio oversight?

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

## 6. Value for EIDOS

If real users confirm the workflow, the prototype suggests a path to several
practical gains:

- one expert can monitor more client portfolios without reading every stable case
- changed decisions become visible faster
- management gets a clearer audit trail for why decisions changed
- experts can compare alternatives before overriding or accepting a suggestion
- outcomes can be reviewed later to improve trust and calibration

In short: the interface aims to scale expert oversight, not replace expert
judgment.

## 7. Key limitations management should understand

The current prototype intentionally simplifies reality.

- all client data is synthetic
- the scenario set is small and fixed
- the recommendation model is a compact heuristic
- there is no user workflow for approval, override persistence, or collaboration
- there is no tenant-aware live data access
- there is no real audit store

Those limits are acceptable for an early prototype and unacceptable for
production use.

## 8. Main delivery risks on the road to a real product

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

## 9. Recommended next steps

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

## 10. Go / no-go questions for management

Before funding a production path, management should be able to answer:

- Which exact user role owns the final procurement decision?
- Which decisions truly require explanation and auditability?
- Which outcome metric matters most: cost variance, exposure reduction,
  contract stability, or another KPI?
- Is the goal oversight, recommendation support, or approval workflow?
- What level of model transparency is required for internal adoption?

## 11. Bottom line

This branch already delivers a credible, interactive prototype of an EIDOS
Decision Observatory. It is strong enough for stakeholder review and product
discussion.

It should be treated as an early product prototype, not as a production-ready
decision system.
