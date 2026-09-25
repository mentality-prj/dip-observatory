import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { OptimizationResult } from './domain'
import { SupplyNetworkOptimizationWorkspace } from './workspace'

const api = vi.hoisted(() => ({
  runOptimization: vi.fn(),
  runUnavailableScenario: vi.fn(),
  runCandidateAreas: vi.fn(),
  runManualCandidate: vi.fn(),
}))

vi.mock('./api', () => api)

vi.mock('./lazy-map', () => ({
  LazyNetworkMap: (props: {
    network: {
      warehouses: Array<{ id: string; label?: string }>
      demand_points: Array<{ id: string; label: string }>
    }
    selectedWarehouseId: string | null
    selectedCandidateId: string | null
    onWarehouseSelect: (warehouse: unknown) => void
    onStoreSelect: (store: unknown) => void
    onMapClick: (latitude: number, longitude: number) => void
  }) => (
    <div
      data-testid="mock-map"
      data-selected-warehouse={props.selectedWarehouseId ?? ''}
      data-selected-candidate={props.selectedCandidateId ?? ''}
    >
      <button onClick={() => props.onWarehouseSelect(props.network.warehouses[0])}>select warehouse</button>
      <button onClick={() => props.onStoreSelect(props.network.demand_points[0])}>select store</button>
      <button onClick={() => props.onMapClick(51.5, 20.2)}>select map location</button>
    </div>
  ),
}))

const optimized: OptimizationResult = {
  ending_inventory: [],
  fulfillment: [
    {
      warehouse_id: 'north-hub',
      demand_point_id: 'north-coast',
      product_class_id: 'core',
      units: 100,
      lead_time_days: 1,
      departure_period: 0,
      cost: 800,
    },
  ],
  inbound_allocation: [
    {
      supply_id: 'incoming-core',
      supplier_id: 'supplier-main',
      warehouse_id: 'north-hub',
      product_class_id: 'core',
      units: 100,
      lead_time_days: 1,
      cost: 400,
    },
  ],
  transfers: [],
  warehouse_utilization: [
    {
      warehouse_id: 'north-hub',
      used: true,
      inventory_units: 500,
      peak_storage_units: 500,
      capacity_units: 2300,
      capacity_utilization: 0.217,
      receiving_units: 100,
      receiving_capacity_units: 1680,
      peak_receiving_units_per_day: 100,
      receiving_capacity_units_per_day: 240,
      dispatch_units: 100,
      dispatch_capacity_units: 1880,
      peak_dispatch_units_per_day: 100,
      dispatch_capacity_units_per_day: 269,
    },
  ],
  demand_service: [
    {
      demand_point_id: 'north-coast',
      demand_units: 169,
      unserved_units: 0,
      service_level: 1,
      source_warehouse_ids: ['north-hub'],
    },
  ],
  kpis: {
    service_level: 0.95,
    maximum_fulfillment_share: 0.55,
    maximum_inventory_share: 0.45,
    unserved_demand_units: 20,
    unserved_demand_value: 2400,
    stockout_cost: 2400,
    logistics_cost: 12000,
    holding_cost: 1000,
    facility_fixed_cost: 0,
    handling_cost: 0,
    reallocation_cost: 0,
    lead_time_penalty: 0,
    inbound_cancellation_cost: 0,
    inventory_value_at_risk: 0,
    objective_value: 15400,
    estimated_business_impact: 15400,
    business_loss: 15400,
  },
  objective_components: { outbound_cost: 8000 },
  candidate_warehouse_ids_used: [],
  binding_constraints: ['warehouse-capacity:north-hub'],
  solver_status: 'optimal',
  solve_time_ms: 12,
  mip_gap: 0,
  optimal: true,
}

describe('SupplyNetworkOptimizationWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.runOptimization.mockResolvedValue(optimized)
    api.runUnavailableScenario.mockResolvedValue({
      result: {
        baseline: optimized,
        disrupted: {
          ...optimized,
          kpis: { ...optimized.kpis, service_level: 0.9, inventory_value_at_risk: 28000 },
        },
        unavailable_warehouse_id: 'north-hub',
        affected_demand_point_ids: ['north-coast'],
        kpi_change: { service_level: -0.05 },
      },
      decisionValue: {
        baseline: { nominal_value: 15400 },
        candidate: { nominal_value: 18000 },
        delta: {
          nominal_delta: -2600,
          expected_delta: null,
          downside_delta: -4000,
          worst_case_observed_delta: -4000,
          worst_case_delta: null,
          realized_delta: null,
        },
        regret: { max_observed_regret: 4000, mean_observed_regret: 2500, expected_regret: null, max_regret: null },
        value_stability: {
          nominal_advantage: -2600,
          minimum_observed_advantage: -4000,
          maximum_observed_advantage: -1200,
          positive_advantage_frequency: 0,
          positive_advantage_probability: null,
          economically_material_threshold: null,
          materially_positive_frequency: null,
        },
      },
    })
    api.runCandidateAreas.mockResolvedValue({
      disrupted_network: optimized,
      candidates: [
        {
          candidate_id: 'recommended-central',
          label: 'Central demand area',
          latitude: 52.2,
          longitude: 21.0,
          feasible: true,
          used: true,
          pareto_efficient: true,
          objective_value: 14000,
          objective_improvement: 1400,
          required_capacity_units: 410,
          service_level: 0.96,
        },
        {
          candidate_id: 'dominated-west',
          label: 'Western demand area',
          latitude: 50.1,
          longitude: 23.4,
          feasible: true,
          used: true,
          pareto_efficient: false,
          objective_value: 14500,
          objective_improvement: 900,
          required_capacity_units: 420,
          service_level: 0.95,
        },
        {
          candidate_id: 'infeasible-south',
          label: 'Southern demand area',
          latitude: 47.1,
          longitude: 31.2,
          feasible: false,
          used: false,
          pareto_efficient: false,
        },
      ],
      pareto_frontier_candidate_ids: ['recommended-central'],
      connectivity_rule: 'demo-geographic-v1',
    })
    api.runManualCandidate.mockResolvedValue({
      result: {
        baseline: optimized,
        candidate: {
          candidate_id: 'manual-candidate',
          latitude: 51.5,
          longitude: 20.2,
          feasible: true,
          used: false,
          objective_value: optimized.kpis.objective_value,
          objective_improvement: 0,
        },
        optimized_network: optimized,
        connectivity_rule: 'demo-geographic-v1',
      },
      decisionValue: undefined,
    })
  })

  it('renders the map surface before optimization and runs baseline optimization', async () => {
    const user = userEvent.setup()
    render(<SupplyNetworkOptimizationWorkspace locale="en" />)

    expect(screen.getByTestId('mock-map')).toBeVisible()
    expect(screen.getByText(/When a warehouse drops out/)).toBeVisible()
    expect(screen.getByText('Try the disruption in 3 steps')).toBeVisible()
    expect(screen.getByText('What this demonstrates')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'See current network plan' }))
    await waitFor(() => expect(api.runOptimization).toHaveBeenCalledTimes(1))
    expect(screen.getByText('95%')).toBeVisible()
  })

  it('shows the disruption result before candidate analysis and runs improvements only on request', async () => {
    const user = userEvent.setup()
    render(<SupplyNetworkOptimizationWorkspace locale="en" />)

    await user.click(screen.getByRole('button', { name: 'select warehouse' }))
    await user.click(screen.getByRole('button', { name: 'Simulate warehouse loss' }))
    await user.click(screen.getByRole('button', { name: 'Simulate warehouse loss' }))

    await waitFor(() => expect(api.runUnavailableScenario).toHaveBeenCalledWith(expect.anything(), 'north-hub'))
    expect(api.runCandidateAreas).not.toHaveBeenCalled()
    expect(screen.getByText('Kyiv region')).toBeVisible()
    expect(screen.getByText('Decision summary')).toBeVisible()
    expect(screen.getByText('Estimated economic value')).toBeVisible()
    expect(screen.getByText('Advantage under observed stress')).toBeVisible()
    expect(
      screen.getByText(
        'Model estimate, not realized savings. Stress scenarios are deterministic and do not imply probability.'
      )
    ).toBeVisible()
    expect(screen.getByText('Ending storage capacity · Kyiv warehouse')).toBeVisible()
    expect(screen.getByText('Disruption + new plan')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Find the best recovery options' }))
    await waitFor(() => expect(api.runCandidateAreas).toHaveBeenCalledTimes(1))
    expect(screen.getByText('Warehouse option 1')).toBeVisible()
    expect(screen.getByText('Warehouse option 2')).toBeVisible()
    expect(screen.getByText('Warehouse option 3')).toBeVisible()
    expect(screen.getByText('Worth considering')).toBeVisible()
    expect(screen.getByText('Dominated')).toBeVisible()
    expect(screen.getByText('Infeasible')).toBeVisible()
    expect(screen.getByText(/Locations tested: 3/)).toBeVisible()

    await user.click(screen.getByRole('button', { name: /Warehouse option 2/ }))
    expect(screen.getByTestId('mock-map')).toHaveAttribute('data-selected-candidate', 'dominated-west')
  })

  it('lets the user select a warehouse from the list without using the map', async () => {
    const user = userEvent.setup()
    render(<SupplyNetworkOptimizationWorkspace locale="uk" />)

    await user.click(screen.getByRole('button', { name: /Львівський склад/ }))
    expect(screen.getByTestId('mock-map')).toHaveAttribute('data-selected-warehouse', 'west-hub')
    expect(screen.getByText(/якщо цей склад стане повністю недоступним/)).toBeVisible()
  })

  it('keeps decision evidence visible without a disclosure control', async () => {
    const user = userEvent.setup()
    render(<SupplyNetworkOptimizationWorkspace locale="uk" />)

    await user.click(screen.getByRole('button', { name: 'Показати поточний план мережі' }))
    await waitFor(() => expect(api.runOptimization).toHaveBeenCalledTimes(1))
    expect(screen.getByText('Чому отримано такий результат')).toBeVisible()
    expect(screen.queryByText('Технічні деталі')).not.toBeInTheDocument()
  })

  it('opens the add-warehouse workflow and validates capacity fields before solving', async () => {
    const user = userEvent.setup()
    render(<SupplyNetworkOptimizationWorkspace locale="en" />)

    await user.click(screen.getByRole('button', { name: 'select map location' }))
    expect(screen.getByText('Add warehouse here')).toBeVisible()

    const capacity = screen.getByRole('spinbutton', { name: 'Capacity' })
    fireEvent.change(capacity, { target: { value: '0' } })
    await user.click(screen.getByRole('button', { name: 'Check this warehouse' }))

    expect(api.runManualCandidate).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/Enter positive capacity values/)
  })

  it('shows the actual fulfillment share and warehouse distribution when a manual candidate is used', async () => {
    const user = userEvent.setup()
    api.runManualCandidate.mockResolvedValueOnce({
      result: {
        baseline: optimized,
        candidate: {
          candidate_id: 'manual-candidate',
          latitude: 51.5,
          longitude: 20.2,
          feasible: true,
          used: true,
          objective_value: 14000,
          objective_improvement: 1400,
        },
        optimized_network: {
          ...optimized,
          fulfillment: [
            { ...optimized.fulfillment[0], warehouse_id: 'manual-candidate', units: 29 },
            { ...optimized.fulfillment[0], warehouse_id: 'north-hub', units: 25 },
            { ...optimized.fulfillment[0], warehouse_id: 'central-hub', units: 24 },
            { ...optimized.fulfillment[0], warehouse_id: 'south-hub', units: 22 },
          ],
          kpis: { ...optimized.kpis, maximum_fulfillment_share: 0.29 },
          candidate_warehouse_ids_used: ['manual-candidate'],
        },
        connectivity_rule: 'demo-geographic-v1',
      },
      decisionValue: undefined,
    })
    render(<SupplyNetworkOptimizationWorkspace locale="uk" />)

    await user.click(screen.getByRole('button', { name: 'select map location' }))
    await user.click(screen.getByRole('button', { name: 'Перевірити цей склад' }))

    expect(await screen.findByText('QDIP включив цей склад до оновленого плану.')).toBeVisible()
    expect(screen.getByText('Частка виконаного попиту через цей склад:')).toBeVisible()
    expect(screen.getByText('Розподіл виконаного попиту за складами')).toBeVisible()
    expect(screen.getAllByText('29%').length).toBeGreaterThan(0)
    expect(screen.queryByText(/зберігши розподіл постачання/)).not.toBeInTheDocument()
  })

  it('submits a valid manual candidate and renders a not-used decision', async () => {
    const user = userEvent.setup()
    render(<SupplyNetworkOptimizationWorkspace locale="en" />)

    await user.click(screen.getByRole('button', { name: 'select map location' }))
    await user.click(screen.getByRole('button', { name: 'Check this warehouse' }))

    await waitFor(() => expect(api.runManualCandidate).toHaveBeenCalledTimes(1))
    expect(screen.getByText(/Adding a warehouse at this location is not worthwhile/)).toBeVisible()
  })

  it.each([
    ['uk', 'Якщо склад вибуває з мережі'],
    ['pl', 'Gdy magazyn wypada z sieci'],
  ] as const)('renders localized %s copy', (locale, heading) => {
    render(<SupplyNetworkOptimizationWorkspace locale={locale} />)
    expect(screen.getByText(new RegExp(heading))).toBeVisible()
  })

  it('uses business-facing Ukrainian labels instead of internal dataset labels', async () => {
    const user = userEvent.setup()
    render(<SupplyNetworkOptimizationWorkspace locale="uk" />)

    await user.click(screen.getByRole('button', { name: 'select store' }))

    expect(screen.getByText('Київський регіон')).toBeVisible()
    expect(screen.getByText('Основний асортимент')).toBeVisible()
    expect(screen.queryByText('Kyiv demand cluster')).not.toBeInTheDocument()
    expect(screen.queryByText('core')).not.toBeInTheDocument()
  })

  it('shows a localized safe message instead of a backend error', async () => {
    const user = userEvent.setup()
    api.runOptimization.mockRejectedValueOnce({ kind: 'unavailable', message: 'DIP request failed with status 503' })
    render(<SupplyNetworkOptimizationWorkspace locale="uk" />)

    await user.click(screen.getByRole('button', { name: 'Розрахувати поточний план' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Сервіс розрахунку тимчасово недоступний'))
    expect(screen.getByRole('alert')).not.toHaveTextContent('DIP request failed')
  })

  it('makes the warehouse-loss scenario explicit in the primary interaction', async () => {
    const user = userEvent.setup()
    render(<SupplyNetworkOptimizationWorkspace locale="uk" />)

    await user.click(screen.getByRole('button', { name: 'select warehouse' }))
    expect(screen.getByText(/якщо цей склад стане повністю недоступним/)).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Змоделювати втрату складу' }))
    expect(screen.getByText('Змоделювати повну недоступність цього складу?')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Змоделювати втрату складу' }))
    await waitFor(() => expect(api.runUnavailableScenario).toHaveBeenCalled())
    expect(await screen.findByText('Склад недоступний. QDIP перебудував план постачання.')).toBeVisible()
  })
})
