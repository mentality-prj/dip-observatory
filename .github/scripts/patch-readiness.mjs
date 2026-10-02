import fs from 'node:fs'

// Idempotent migration for the readiness benchmark branch.
const plannerPath = 'src/use-cases/readiness-recovery/planner.ts'
let planner = fs.readFileSync(plannerPath, 'utf8')

planner = planner.replace(
`  if (kind === 'FIFO') return { primary: 0, secondary: faultOrder }
  if (kind === 'CRITICALITY') return { primary: -gain, secondary: action.actionId }
  const cost = Math.max(1, actionTechnicianHours(action) + action.workshopHours + actionPartUnits(action))
  return { primary: -(gain * action.successProbability) / cost, secondary: action.actionId }`,
`  if (kind === 'FIFO') return { primary: 0, secondary: faultOrder }
  if (kind === 'CRITICALITY') return { primary: -gain, secondary: action.actionId }
  const cost = Math.max(1, actionTechnicianHours(action) + action.workshopHours + actionPartUnits(action))
  const expectedGain = gain * action.successProbability
  if (kind === 'RISK_AWARE_GREEDY') {
    const risk = 1 - action.successProbability * (1 - action.repeatFailureProbability)
    return { primary: -(expectedGain * (1 - risk)) / cost, secondary: action.actionId }
  }
  return { primary: -expectedGain / cost, secondary: action.actionId }`
)

planner = planner.replace(
`function evaluateBaselines(input: ReadinessRecoveryInput): BaselineResult[] {
  return (['FIFO', 'CRITICALITY', 'GREEDY_READINESS'] as const).map((kind, index) => {`,
`function evaluateBaselines(input: ReadinessRecoveryInput): BaselineResult[] {
  return (['FIFO', 'CRITICALITY', 'GREEDY_READINESS', 'RISK_AWARE_GREEDY', 'LOOKAHEAD_2'] as const).map((kind, index) => {`
)

planner = planner.replace(
`  const actions = input.recoveryActions
    .filter((action) => MATERIAL_ACTIONS.has(action.type))
    .sort((a, b) => {
      const pa = actionPriority(input, a, kind)
      const pb = actionPriority(input, b, kind)
      return pa.primary - pb.primary || pa.secondary.localeCompare(pb.secondary)
    })`,
`  const materialActions = input.recoveryActions.filter((action) => MATERIAL_ACTIONS.has(action.type))
  const lookaheadValue = (action: RecoveryAction) => {
    const first = expectedActionGain(input, action) * action.successProbability
    if (kind !== 'LOOKAHEAD_2') return 0
    const second = materialActions
      .filter((other) => other.assetId !== action.assetId && !(action.incompatibleActionIds ?? []).includes(other.actionId))
      .map((other) => expectedActionGain(input, other) * other.successProbability)
      .sort((a, b) => b - a)[0] ?? 0
    return first + second
  }
  const actions = materialActions.sort((a, b) => {
    if (kind === 'LOOKAHEAD_2') {
      const av = lookaheadValue(a)
      const bv = lookaheadValue(b)
      if (av !== bv) return bv - av
    }
    const pa = actionPriority(input, a, kind)
    const pb = actionPriority(input, b, kind)
    return pa.primary - pb.primary || pa.secondary.localeCompare(pb.secondary)
  })`
)

fs.writeFileSync(plannerPath, planner)

const testPath = 'src/use-cases/readiness-recovery/cascading-resource-conflict.vitest.test.ts'
let test = fs.readFileSync(testPath, 'utf8')
test = test.replace(
`    expect(result.frontier.length).toBeGreaterThan(0)`,
`    expect(result.frontier.length).toBeGreaterThan(0)
    expect(result.baselines.map((baseline) => baseline.kind)).toEqual([
      'FIFO',
      'CRITICALITY',
      'GREEDY_READINESS',
      'RISK_AWARE_GREEDY',
      'LOOKAHEAD_2',
    ])`
)
fs.writeFileSync(testPath, test)
