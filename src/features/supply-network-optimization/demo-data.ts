import type { CurrentFlow, SupplyNetwork } from './domain'

export const SUPPLY_NETWORK_CURRENT_FLOWS: CurrentFlow[] = [
  { warehouse_id: 'north-hub', demand_point_id: 'north-coast' },
  { warehouse_id: 'north-hub', demand_point_id: 'north-east' },
  { warehouse_id: 'west-hub', demand_point_id: 'west' },
  { warehouse_id: 'central-hub', demand_point_id: 'central' },
  { warehouse_id: 'central-hub', demand_point_id: 'south-east' },
  { warehouse_id: 'south-hub', demand_point_id: 'south' },
  { warehouse_id: 'south-hub', demand_point_id: 'south-east' },
]

export const SUPPLY_NETWORK_DEMO: SupplyNetwork = {
  product_classes: [
    { id: 'core', unit_value: 120, holding_cost_per_unit_day: 0.18, storage_class: 'ambient' },
    { id: 'premium', unit_value: 310, holding_cost_per_unit_day: 0.42, storage_class: 'controlled' },
    { id: 'gift', unit_value: 190, holding_cost_per_unit_day: 0.27, storage_class: 'ambient' },
  ],
  warehouses: [
    {
      id: 'north-hub', label: 'North Hub', latitude: 54.12, longitude: 18.58,
      capacity_units: 2300, receiving_capacity_units_per_day: 420, dispatch_capacity_units_per_day: 470,
      supported_storage_classes: ['ambient', 'controlled'],
      current_inventory: { core: 620, premium: 210, gift: 260 },
    },
    {
      id: 'west-hub', label: 'West Hub', latitude: 52.36, longitude: 16.82,
      capacity_units: 1900, receiving_capacity_units_per_day: 360, dispatch_capacity_units_per_day: 400,
      supported_storage_classes: ['ambient', 'controlled'],
      current_inventory: { core: 520, premium: 170, gift: 240 },
    },
    {
      id: 'central-hub', label: 'Central Hub', latitude: 52.08, longitude: 21.18,
      capacity_units: 2500, receiving_capacity_units_per_day: 480, dispatch_capacity_units_per_day: 520,
      supported_storage_classes: ['ambient', 'controlled'],
      current_inventory: { core: 700, premium: 230, gift: 300 },
    },
    {
      id: 'south-hub', label: 'South Hub', latitude: 50.05, longitude: 19.78,
      capacity_units: 1550, receiving_capacity_units_per_day: 300, dispatch_capacity_units_per_day: 340,
      supported_storage_classes: ['ambient'],
      current_inventory: { core: 430, gift: 210 },
    },
  ],
  demand_points: [
    { id: 'north-coast', latitude: 54.36, longitude: 18.64, region: 'North', label: 'North Coast cluster', demand_per_day: { core: 92, premium: 42, gift: 35 } },
    { id: 'north-east', latitude: 53.12, longitude: 23.12, region: 'North East', label: 'North East cluster', demand_per_day: { core: 63, premium: 18, gift: 29 } },
    { id: 'west', latitude: 51.12, longitude: 17.04, region: 'West', label: 'West cluster', demand_per_day: { core: 86, premium: 31, gift: 46 } },
    { id: 'central', latitude: 52.23, longitude: 21.01, region: 'Central', label: 'Central cluster', demand_per_day: { core: 130, premium: 58, gift: 71 }, minimum_service_level: 0.92 },
    { id: 'south', latitude: 50.06, longitude: 19.94, region: 'South', label: 'South cluster', demand_per_day: { core: 104, premium: 39, gift: 48 } },
    { id: 'south-east', latitude: 50.04, longitude: 22.00, region: 'South East', label: 'South East cluster', demand_per_day: { core: 77, premium: 22, gift: 34 } },
  ],
  suppliers: [
    { id: 'supplier-main', label: 'Inbound supplier', latitude: 50.30, longitude: 18.65 },
  ],
  inbound_supply: [
    {
      id: 'incoming-core', supplier_id: 'supplier-main', product_class_id: 'core', available_units: 520,
      routes: [
        { to_warehouse_id: 'north-hub', transport_cost_per_unit: 8.4, lead_time_days: 2, capacity_units: 300 },
        { to_warehouse_id: 'west-hub', transport_cost_per_unit: 5.2, lead_time_days: 1, capacity_units: 360 },
        { to_warehouse_id: 'central-hub', transport_cost_per_unit: 6.8, lead_time_days: 1, capacity_units: 390 },
        { to_warehouse_id: 'south-hub', transport_cost_per_unit: 4.4, lead_time_days: 1, capacity_units: 260 },
      ],
    },
    {
      id: 'incoming-premium', supplier_id: 'supplier-main', product_class_id: 'premium', available_units: 170,
      routes: [
        { to_warehouse_id: 'north-hub', transport_cost_per_unit: 9.3, lead_time_days: 2, capacity_units: 150 },
        { to_warehouse_id: 'west-hub', transport_cost_per_unit: 6.4, lead_time_days: 1, capacity_units: 150 },
        { to_warehouse_id: 'central-hub', transport_cost_per_unit: 7.1, lead_time_days: 1, capacity_units: 170 },
      ],
    },
  ],
  delivery_routes: [
    ['north-hub','north-coast',0,180,8.2], ['north-hub','north-east',0,120,15.5], ['north-hub','central',2,120,17.8],
    ['west-hub','west',0,175,7.5], ['west-hub','central',2,140,14.2], ['west-hub','south',2,105,15.6],
    ['central-hub','central',0,230,6.8], ['central-hub','north-east',2,125,13.9], ['central-hub','south-east',0,125,14.7], ['central-hub','south',2,150,12.8],
    ['south-hub','south',0,190,7.1], ['south-hub','south-east',1,155,9.4], ['south-hub','central',2,115,13.6],
    ['north-hub','west',2,80,20.0], ['west-hub','north-coast',3,70,22.5], ['central-hub','west',2,95,16.1],
  ].map(([from_node_id,to_demand_point_id,lead_time_days,capacity_units_per_day,cost_per_unit]) => ({
    from_node_id: String(from_node_id), to_demand_point_id: String(to_demand_point_id),
    lead_time_days: Number(lead_time_days), capacity_units_per_day: Number(capacity_units_per_day), cost_per_unit: Number(cost_per_unit),
  })),
  transfer_routes: [
    ['north-hub','central-hub',2,180,5.8], ['central-hub','north-hub',2,180,5.8],
    ['west-hub','central-hub',1,210,4.9], ['central-hub','west-hub',1,210,4.9],
    ['south-hub','central-hub',1,170,4.5], ['central-hub','south-hub',1,170,4.5],
    ['west-hub','south-hub',2,120,6.2], ['south-hub','west-hub',2,120,6.2],
  ].map(([from_node_id,to_node_id,lead_time_days,capacity_units_per_day,cost_per_unit]) => ({
    from_node_id: String(from_node_id), to_node_id: String(to_node_id),
    lead_time_days: Number(lead_time_days), capacity_units_per_day: Number(capacity_units_per_day), cost_per_unit: Number(cost_per_unit),
  })),
  unavailable_warehouse_ids: [],
  policy: {
    planning_horizon_days: 4,
    minimum_service_level: 0.88,
    maximum_node_inventory_exposure: 0.55,
    solver_time_limit_seconds: 10,
    stockout_penalty_multiplier: 2,
    concentration_penalty_per_unit: 0.45,
    concentration_target_share: 0.38,
    lead_time_penalty_per_unit_day: 0.08,
  },
}
