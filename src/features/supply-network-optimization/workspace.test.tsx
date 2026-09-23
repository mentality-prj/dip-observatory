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
    onWarehouseSelect: (warehouse: unknown) => void
    onStoreSelect: (store: unknown) => void
    onMapClick: (latitude: number, longitude: number) => void
  }) => (
    <div data-testid="mock-map">
      <button onClick={() => props.onWarehouseSelect(props.network.warehouses[0])}>select warehouse</button>
      <button onClick={() => props.onStoreSelect(props.network.demand_points[0])}>select store</button>
      <button onClick={() => props.onMapClick(51.5, 20.2)}>select map location</button>
    </div>
  ),
}))

const optimized: OptimizationResult = {
  inventory_placement: [
    { warehouse_id: 'north-hub', product_class_id: 'core', units: 500 },
  ],
  fulfillment: [
    {
      warehouse_id: 'north-hub',
      demand_point_id: 'north-coast',
      product_class_id: 'core',
      units: 100,
      lead_time_days: 1,
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
      capacity_units: 2300,
      capacity_utilization: 0.217,
      receiving_units: 100,
      receiving_capacity_units: 1680,
      dispatch_units: 100,
      dispatch_capacity_units: 1880,
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
    unserved_demand_units: 20,
    unserved_demand_value: 2400,
    logistics_cost: 12000,
    holding_cost: 1000,
    inventory_value_at_risk: 0,
    objective_value: 15400,
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
      baseline: optimized,
      disrupted: {
        ...optimized,
        kpis: { ...optimized.kpis, service_level: 0.9, inventory_value_at_risk: 28000 },
      },
      unavailable_warehouse_id: 'north-hub',
      affected_demand_point_ids: ['north-coast'],
      kpi_change: { service_level: -0.05 },
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
          rank: 1,
          objective_value: 14000,
          objective_improvement: 1400,
          required_capacity_units: 410,
          service_level: 0.96,
        },
      ],
      recommended_candidate_id: 'recommended-central',
      connectivity_rule: 'demo-geographic-v1',
    })
    api.runManualCandidate.mockResolvedValue({
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
    })
  })

  it('renders the map surface before optimization and runs baseline optimization', async () => {
    const user = userEvent.setup()
    render(<SupplyNetworkOptimizationWorkspace locale="en" />)

    expect(screen.getByTestId('mock-map')).toBeVisible()
    expect(screen.getByText(/Optimize where inventory should be stored/)).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Optimize current network' }))
    await waitFor(() => expect(api.runOptimization).toHaveBeenCalledTimes(1))
    expect(screen.getByText('95%')).toBeVisible()
  })

  it('selects a warehouse, confirms unavailability and requests reoptimization plus candidate search', async () => {
    const user = userEvent.setup()
    render(<SupplyNetworkOptimizationWorkspace locale="en" />)

    await user.click(screen.getByRole('button', { name: 'select warehouse' }))
    await user.click(screen.getByRole('button', { name: 'Make warehouse unavailable' }))
    await user.click(screen.getByRole('button', { name: 'Make warehouse unavailable' }))

    await waitFor(() => expect(api.runUnavailableScenario).toHaveBeenCalledWith(expect.anything(), 'north-hub'))
    await waitFor(() => expect(api.runCandidateAreas).toHaveBeenCalledTimes(1))
    expect(screen.getByText('Central demand area')).toBeVisible()
    expect(screen.getByText('north-coast')).toBeVisible()
  })

  it('opens the add-warehouse workflow and validates capacity fields before solving', async () => {
    const user = userEvent.setup()
    render(<SupplyNetworkOptimizationWorkspace locale="en" />)

    await user.click(screen.getByRole('button', { name: 'select map location' }))
    expect(screen.getByText('Add warehouse here')).toBeVisible()

    const capacity = screen.getByRole('spinbutton', { name: 'Capacity' })
    fireEvent.change(capacity, { target: { value: '0' } })
    await user.click(screen.getByRole('button', { name: 'Evaluate candidate' }))

    expect(api.runManualCandidate).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/Capacity fields must be positive/)
  })

  it('submits a valid manual candidate and renders a not-used decision', async () => {
    const user = userEvent.setup()
    render(<SupplyNetworkOptimizationWorkspace locale="en" />)

    await user.click(screen.getByRole('button', { name: 'select map location' }))
    await user.click(screen.getByRole('button', { name: 'Evaluate candidate' }))

    await waitFor(() => expect(api.runManualCandidate).toHaveBeenCalledTimes(1))
    expect(screen.getByText(/does not use this warehouse/)).toBeVisible()
  })

  it.each([
    ['uk', 'Оптимізуйте, де зберігати запаси'],
    ['pl', 'Optymalizuj, gdzie przechowywać zapasy'],
  ] as const)('renders localized %s copy', (locale, heading) => {
    render(<SupplyNetworkOptimizationWorkspace locale={locale} />)
    expect(screen.getByText(new RegExp(heading))).toBeVisible()
  })
})
