import { describe, expect, it } from 'vitest'
import { SUPPLY_NETWORK_DEMO } from './demo-data'

describe('retail-scale Supply Network demo topology', () => {
  it('models 37 synthetic stores across 15 regions', () => {
    expect(SUPPLY_NETWORK_DEMO.demand_points).toHaveLength(37)
    expect(new Set(SUPPLY_NETWORK_DEMO.demand_points.map((point) => point.region)).size).toBe(15)
  })

  it('gives every store at least two delivery options', () => {
    for (const point of SUPPLY_NETWORK_DEMO.demand_points) {
      const routes = SUPPLY_NETWORK_DEMO.delivery_routes.filter(
        (route) => route.to_demand_point_id === point.id,
      )
      expect(routes.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('keeps the current plan fully allocated for every store and product class', () => {
    for (const point of SUPPLY_NETWORK_DEMO.demand_points) {
      for (const product of SUPPLY_NETWORK_DEMO.product_classes) {
        const allocated = SUPPLY_NETWORK_DEMO.baseline_fulfillment
          .filter(
            (item) =>
              item.demand_point_id === point.id &&
              item.product_class_id === product.id,
          )
          .reduce((sum, item) => sum + item.units_per_day, 0)

        expect(allocated).toBe(point.demand_per_day[product.id] ?? 0)
      }
    }
  })
})


  it('keeps baseline dispatch within warehouse capacity', () => {
    for (const warehouse of SUPPLY_NETWORK_DEMO.warehouses) {
      const allocated = SUPPLY_NETWORK_DEMO.baseline_fulfillment
        .filter((item) => item.warehouse_id === warehouse.id)
        .reduce((sum, item) => sum + item.units_per_day, 0)

      expect(allocated).toBeLessThanOrEqual(warehouse.dispatch_capacity_units_per_day)
    }
  })

  it('never assigns a baseline product to an incompatible warehouse', () => {
    const productById = new Map(
      SUPPLY_NETWORK_DEMO.product_classes.map((product) => [product.id, product]),
    )
    const warehouseById = new Map(
      SUPPLY_NETWORK_DEMO.warehouses.map((warehouse) => [warehouse.id, warehouse]),
    )

    for (const item of SUPPLY_NETWORK_DEMO.baseline_fulfillment) {
      const product = productById.get(item.product_class_id)
      const warehouse = warehouseById.get(item.warehouse_id)
      expect(product).toBeDefined()
      expect(warehouse).toBeDefined()
      expect(warehouse?.supported_storage_classes).toContain(product?.storage_class)
    }
  })
