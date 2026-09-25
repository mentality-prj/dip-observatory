import type {
  BaselineFulfillment,
  DeliveryRoute,
  DemandPoint,
  InboundSupply,
  ProductClass,
  Supplier,
  SupplyNetwork,
  TransferRoute,
  Warehouse,
} from './domain'

const PRODUCT_CLASSES: ProductClass[] = [
  { id: 'core', unit_value: 4800, holding_cost_per_unit_day: 7.2, storage_class: 'ambient' },
  { id: 'premium', unit_value: 12400, holding_cost_per_unit_day: 16.8, storage_class: 'controlled' },
  { id: 'gift', unit_value: 7600, holding_cost_per_unit_day: 10.8, storage_class: 'ambient' },
]

const WAREHOUSES: Warehouse[] = [
  {
    id: 'north-hub',
    label: 'Kyiv Hub',
    latitude: 50.4501,
    longitude: 30.5234,
    capacity_units: 2300,
    receiving_capacity_units_per_day: 420,
    dispatch_capacity_units_per_day: 470,
    supported_storage_classes: ['ambient', 'controlled'],
    current_inventory: { core: 620, premium: 210, gift: 260 },
  },
  {
    id: 'west-hub',
    label: 'Lviv Hub',
    latitude: 49.8397,
    longitude: 24.0297,
    capacity_units: 1900,
    receiving_capacity_units_per_day: 360,
    dispatch_capacity_units_per_day: 400,
    supported_storage_classes: ['ambient', 'controlled'],
    current_inventory: { core: 520, premium: 170, gift: 240 },
  },
  {
    id: 'central-hub',
    label: 'Dnipro Hub',
    latitude: 48.4647,
    longitude: 35.0462,
    capacity_units: 2500,
    receiving_capacity_units_per_day: 480,
    dispatch_capacity_units_per_day: 520,
    supported_storage_classes: ['ambient', 'controlled'],
    current_inventory: { core: 700, premium: 230, gift: 300 },
  },
  {
    id: 'south-hub',
    label: 'Odesa Hub',
    latitude: 46.4825,
    longitude: 30.7233,
    capacity_units: 1550,
    receiving_capacity_units_per_day: 300,
    dispatch_capacity_units_per_day: 340,
    supported_storage_classes: ['ambient'],
    current_inventory: { core: 430, gift: 210 },
  },
]

const STORE_REGION_FOOTPRINT = [
  { region: 'Kyiv City', count: 14, latitude: 50.4501, longitude: 30.5234 },
  { region: 'Kyiv Oblast', count: 3, latitude: 50.3400, longitude: 30.4800 },
  { region: 'Dnipro', count: 2, latitude: 48.4647, longitude: 35.0462 },
  { region: 'Chernihiv', count: 1, latitude: 51.4982, longitude: 31.2893 },
  { region: 'Uzhhorod', count: 1, latitude: 48.6208, longitude: 22.2879 },
  { region: 'Cherkasy', count: 1, latitude: 49.4444, longitude: 32.0598 },
  { region: 'Lutsk', count: 1, latitude: 50.7472, longitude: 25.3254 },
  { region: 'Lviv', count: 2, latitude: 49.8397, longitude: 24.0297 },
  { region: 'Ivano-Frankivsk', count: 3, latitude: 48.9226, longitude: 24.7111 },
  { region: 'Khmelnytskyi', count: 1, latitude: 49.4229, longitude: 26.9871 },
  { region: 'Poltava', count: 2, latitude: 49.5883, longitude: 34.5514 },
  { region: 'Rivne', count: 2, latitude: 50.6199, longitude: 26.2516 },
  { region: 'Ternopil', count: 1, latitude: 49.5535, longitude: 25.5948 },
  { region: 'Vinnytsia', count: 2, latitude: 49.2331, longitude: 28.4682 },
  { region: 'Chernivtsi', count: 1, latitude: 48.2921, longitude: 25.9358 },
] as const

function buildRetailStores(): DemandPoint[] {
  let storeIndex = 0
  return STORE_REGION_FOOTPRINT.flatMap((group) =>
    Array.from({ length: group.count }, (_, localIndex) => {
      const index = storeIndex++
      const longitudeOffset = ((localIndex % 5) - 2) * 0.032
      const latitudeOffset = (Math.floor(localIndex / 5) - 1) * 0.025
      return {
        id: `store-${String(index + 1).padStart(2, '0')}`,
        latitude: group.latitude + latitudeOffset,
        longitude: group.longitude + longitudeOffset,
        region: group.region,
        label: `Store ${index + 1} · ${group.region}`,
        demand_per_day: {
          core: 12 + (index % 7),
          premium: 4 + (index % 4),
          gift: 5 + (index % 5),
        },
        ...(index % 11 === 0 ? { minimum_service_level: 0.92 } : {}),
      }
    })
  )
}

function buildDeliveryRoutes(stores: DemandPoint[]): DeliveryRoute[] {
  return stores.flatMap((store) =>
    WAREHOUSES
      .map((warehouse) => ({
        warehouse,
        distance: Math.hypot(
          warehouse.latitude - store.latitude,
          warehouse.longitude - store.longitude,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2)
      .map(({ warehouse, distance }, optionIndex) => ({
        from_node_id: warehouse.id,
        to_demand_point_id: store.id,
        lead_time_days: optionIndex === 0 ? 0 : 1,
        capacity_units_per_day: 120,
        cost_per_unit: Math.round(120 + distance * 95),
        transport_mode: 'road',
      }))
  )
}

function buildCurrentStorePlan(
  stores: DemandPoint[],
  routes: DeliveryRoute[],
): BaselineFulfillment[] {
  return stores.flatMap((store) => {
    const primaryRoute = routes.find((route) => route.to_demand_point_id === store.id)
    if (!primaryRoute) return []
    return Object.entries(store.demand_per_day).map(([product_class_id, units_per_day]) => ({
      warehouse_id: primaryRoute.from_node_id,
      demand_point_id: store.id,
      product_class_id,
      units_per_day,
    }))
  })
}

const RETAIL_STORES = buildRetailStores()
const DELIVERY_ROUTES = buildDeliveryRoutes(RETAIL_STORES)
const BASELINE_FULFILLMENT = buildCurrentStorePlan(RETAIL_STORES, DELIVERY_ROUTES)

const SUPPLIERS: Supplier[] = [
  { id: 'supplier-main', label: 'Western inbound supplier', latitude: 48.6208, longitude: 22.2879 },
]

const INBOUND_SUPPLY: InboundSupply[] = [
  {
    id: 'incoming-core',
    supplier_id: 'supplier-main',
    product_class_id: 'core',
    available_units: 520,
    routes: [
      { to_warehouse_id: 'north-hub', transport_cost_per_unit: 336, lead_time_days: 2, capacity_units: 300, transport_mode: 'road' },
      { to_warehouse_id: 'west-hub', transport_cost_per_unit: 208, lead_time_days: 1, capacity_units: 360, transport_mode: 'road' },
      { to_warehouse_id: 'west-hub', transport_cost_per_unit: 154, lead_time_days: 2, capacity_units: 240, transport_mode: 'rail' },
      { to_warehouse_id: 'central-hub', transport_cost_per_unit: 272, lead_time_days: 1, capacity_units: 390, transport_mode: 'road' },
      { to_warehouse_id: 'central-hub', transport_cost_per_unit: 205, lead_time_days: 2, capacity_units: 260, transport_mode: 'rail' },
      { to_warehouse_id: 'south-hub', transport_cost_per_unit: 176, lead_time_days: 1, capacity_units: 260, transport_mode: 'road' },
    ],
  },
  {
    id: 'incoming-premium',
    supplier_id: 'supplier-main',
    product_class_id: 'premium',
    available_units: 170,
    routes: [
      { to_warehouse_id: 'north-hub', transport_cost_per_unit: 372, lead_time_days: 2, capacity_units: 150, transport_mode: 'road' },
      { to_warehouse_id: 'west-hub', transport_cost_per_unit: 256, lead_time_days: 1, capacity_units: 150, transport_mode: 'road' },
      { to_warehouse_id: 'west-hub', transport_cost_per_unit: 198, lead_time_days: 2, capacity_units: 100, transport_mode: 'rail' },
      { to_warehouse_id: 'central-hub', transport_cost_per_unit: 284, lead_time_days: 1, capacity_units: 170, transport_mode: 'road' },
      { to_warehouse_id: 'central-hub', transport_cost_per_unit: 218, lead_time_days: 2, capacity_units: 110, transport_mode: 'rail' },
    ],
  },
]

const TRANSFER_ROUTES: TransferRoute[] = [
  ['north-hub', 'central-hub', 2, 180, 232],
  ['central-hub', 'north-hub', 2, 180, 232],
  ['west-hub', 'central-hub', 1, 210, 196],
  ['central-hub', 'west-hub', 1, 210, 196],
  ['south-hub', 'central-hub', 1, 170, 180],
  ['central-hub', 'south-hub', 1, 170, 180],
  ['west-hub', 'south-hub', 2, 120, 248],
  ['south-hub', 'west-hub', 2, 120, 248],
].map(([from_node_id, to_node_id, lead_time_days, capacity_units_per_day, cost_per_unit]) => ({
  from_node_id: String(from_node_id),
  to_node_id: String(to_node_id),
  lead_time_days: Number(lead_time_days),
  capacity_units_per_day: Number(capacity_units_per_day),
  cost_per_unit: Number(cost_per_unit),
  transport_mode: 'road',
}))

export const SUPPLY_NETWORK_DEMO: SupplyNetwork = {
  product_classes: PRODUCT_CLASSES,
  warehouses: WAREHOUSES,
  demand_points: RETAIL_STORES,
  suppliers: SUPPLIERS,
  inbound_supply: INBOUND_SUPPLY,
  delivery_routes: DELIVERY_ROUTES,
  transfer_routes: TRANSFER_ROUTES,
  baseline_fulfillment: BASELINE_FULFILLMENT,
  unavailable_warehouse_ids: [],
  policy: {
    planning_horizon_days: 4,
    minimum_service_level: 0.88,
    maximum_node_inventory_exposure: 0.55,
    maximum_node_fulfillment_share: 0.55,
    emergency_maximum_node_fulfillment_share: 0.80,
    service_objective_mode: 'economic-with-service-floor',
    reallocation_cost_per_unit: 140,
    inbound_cancellation_penalty_per_unit: 90,
    solver_time_limit_seconds: 10,
    stockout_penalty_multiplier: 2,
    concentration_penalty_per_unit: 18,
    concentration_target_share: 0.38,
    lead_time_penalty_per_unit_day: 3.2,
  },
}
