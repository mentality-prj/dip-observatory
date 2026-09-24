'use client'

import { useCallback, useMemo, useState } from 'react'
import { AlertTriangle, MapPin, Network, Play, Plus, Warehouse as WarehouseIcon } from 'lucide-react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/design-system'
import type { Locale } from '@/lib/observatory-i18n'
import {
  runCandidateAreas,
  runManualCandidate,
  runOptimization,
  runUnavailableScenario,
} from './api'
import { SUPPLY_NETWORK_CURRENT_FLOWS, SUPPLY_NETWORK_DEMO } from './demo-data'
import { LazyNetworkMap } from './lazy-map'
import {
  candidateOptionLabel,
  demandDisplayLabel,
  entityDisplayLabel,
  formatMoney,
  formatNumber,
  productClassDisplayLabel,
  storageClassDisplayLabel,
  warehouseDisplayLabel,
} from './presentation'
import { ExecutiveDecisionSummary } from './executive-decision-summary'
import type {
  CandidateResult,
  CandidateWarehouse,
  DemandPoint,
  OptimizationResult,
  ScenarioComparison,
  StorageClass,
  SupplyNetwork,
  Warehouse,
} from './domain'

const copy = {
  en: {
    featureName: 'Supply Network Optimization',
    title: 'See how the network handles a disruption and how supply can be protected.',
    intro: 'QDIP shows what happens when a warehouse becomes unavailable, how goods can be rerouted and which options can reduce the impact.',
    optimize: 'Calculate current plan', optimizing: 'Calculating…', current: 'Current network', optimized: 'Current plan',
    unavailable: 'Warehouse unavailable', reallocated: 'Updated network', newWarehouse: 'New warehouse',
    makeUnavailable: 'Simulate warehouse loss', confirmUnavailable: 'Simulate this warehouse becoming completely unavailable?', disruptionHelp: 'Check what happens to supply if this warehouse becomes completely unavailable.', disruptionDone: 'Warehouse unavailable. QDIP rebuilt the supply plan.', disruptionDoneHelp: 'The map shows the rerouted flows. The results below show how much demand is protected, the cost change and the remaining bottlenecks.', cancel: 'Cancel', addHere: 'Add warehouse here',
    candidateArea: 'Improvement options', findImprovements: 'Find options to strengthen the network', findingImprovements: 'Finding improvement options…', decisionSummary: 'Decision summary', serviceChange: 'Change in demand fulfilled',
    unservedChange: 'Change in unfulfilled demand', costChange: 'Change in logistics cost', paretoAlternatives: 'Improvement options',
    frontierHint: 'Each option offers a different balance between demand fulfilled and cost. Compare them before deciding.',
    disruptionReallocated: 'Disruption + new plan', noCandidate: 'None of the locations tested materially improves the network under the current conditions.',
    service: 'Demand fulfilled', unserved: 'Unfulfilled demand', logistics: 'Estimated logistics cost', risk: 'Inventory at risk',
    utilization: 'Peak warehouse utilization', businessLoss: 'Estimated business impact', affected: 'Regions affected by the disruption',
    evidence: 'Why this result', capacity: 'Capacity', receiving: 'Receiving per day', dispatch: 'Dispatch per day',
    operating: 'Warehouse operating cost, ₴', storage: 'Storage requirements', evaluate: 'Check this warehouse',
    candidateNotUsed: 'Adding a warehouse at this location is not worthwhile. Under the current conditions it does not improve the network, so QDIP finds a better plan without using it.',
    candidateUsed: 'This warehouse improves the network. QDIP included it in the updated supply plan.',
    demand: 'Demand', source: 'Supplying warehouse', status: 'Demand coverage', served: 'fulfilled', pending: 'Calculating the plan…',
    clickHint: 'Click anywhere on the map to check whether a new warehouse at that location would help.',
    improvement: 'Plan improvement', requiredCapacity: 'Inventory at warehouse', pareto: 'Worth considering',
    peakReceiving: 'Peak receiving per day', peakDispatch: 'Peak dispatch per day', scenarioComparison: 'Before and after the disruption',
    endingInventory: 'Remaining inventory', inboundAllocation: 'Incoming supply allocation', bindingConstraints: 'What limits the result',
    none: 'None', used: 'included in plan', notUsed: 'not needed in this plan', technicalDetails: 'Technical details',
    demoNotice: 'Demo model · synthetic data · calculations are performed by QDIP', warehouses: 'warehouses', demandClusters: 'demand regions',
    productClasses: 'product groups', manualCandidate: 'Selected location', validationError: 'Enter positive capacity values and select at least one storage option.',
    requestFailed: 'The calculation could not be completed. Please try again.', invalidError: 'Some input values are invalid. Check the warehouse parameters and try again.', infeasibleError: 'No workable plan meets all of the current limits. Check warehouse availability, capacities and the required demand coverage.', unavailableError: 'The calculation service is temporarily unavailable. Please try again.', perDay: 'per day',
  },
  uk: {
    featureName: 'Оптимізація мережі постачання',
    title: 'Перевірте, як мережа впорається зі збоєм і як зберегти постачання.',
    intro: 'QDIP показує, що станеться при втраті складу, як можна перенаправити товар і які варіанти допоможуть зменшити втрати.',
    optimize: 'Розрахувати поточний план', optimizing: 'Розраховуємо…', current: 'Поточна мережа', optimized: 'Поточний план',
    unavailable: 'Склад недоступний', reallocated: 'Оновлена мережа', newWarehouse: 'Новий склад',
    makeUnavailable: 'Змоделювати втрату складу', confirmUnavailable: 'Змоделювати повну недоступність цього складу?', disruptionHelp: 'Перевірте, що станеться з постачанням, якщо цей склад стане повністю недоступним.', disruptionDone: 'Склад недоступний. QDIP перебудував план постачання.', disruptionDoneHelp: 'На мапі показано перенаправлені потоки, а нижче — який попит вдалося зберегти, як змінилися витрати та де залишилися обмеження.', cancel: 'Скасувати', addHere: 'Додати склад тут',
    candidateArea: 'Варіанти покращення', findImprovements: 'Знайти варіанти посилення мережі', findingImprovements: 'Шукаємо варіанти посилення…', decisionSummary: 'Підсумок рішення', serviceChange: 'Зміна виконаного попиту',
    unservedChange: 'Зміна непокритого попиту', costChange: 'Зміна вартості логістики', paretoAlternatives: 'Варіанти покращення',
    frontierHint: 'Кожен варіант має свій баланс між виконанням попиту та витратами. Порівняйте їх перед рішенням.',
    disruptionReallocated: 'Збій + новий план', noCandidate: 'Серед перевірених місць немає варіанта, який помітно покращує роботу мережі за заданих умов.',
    service: 'Виконано попиту', unserved: 'Непокритий попит', logistics: 'Орієнтовні логістичні витрати', risk: 'Запаси під ризиком',
    utilization: 'Максимальне завантаження складів', businessLoss: 'Оцінений вплив на бізнес', affected: 'Регіони, яких торкнувся збій',
    evidence: 'Чому отримано такий результат', capacity: 'Місткість', receiving: 'Приймання за день', dispatch: 'Відвантаження за день',
    operating: 'Витрати на роботу складу, ₴', storage: 'Умови зберігання', evaluate: 'Перевірити цей склад',
    candidateNotUsed: 'Додавати склад у цій точці недоцільно. За поточних умов він не покращує роботу мережі, тому QDIP знаходить кращий план без нього.',
    candidateUsed: 'Цей склад покращує роботу мережі. QDIP включив його до оновленого плану постачання.',
    demand: 'Попит', source: 'Склад, з якого постачаємо', status: 'Виконання попиту', served: 'виконано', pending: 'Розраховуємо план…',
    clickHint: 'Натисніть на будь-яке місце на мапі, щоб перевірити, чи допоможе новий склад у цій точці.',
    improvement: 'Покращення плану', requiredCapacity: 'Запас на складі', pareto: 'Вартий розгляду',
    peakReceiving: 'Максимальне приймання за день', peakDispatch: 'Максимальне відвантаження за день', scenarioComparison: 'До і після збою',
    endingInventory: 'Залишок запасів', inboundAllocation: 'Куди спрямувати нові поставки', bindingConstraints: 'Що обмежує результат',
    none: 'Немає', used: 'включено до плану', notUsed: 'не потрібен у цьому плані', technicalDetails: 'Технічні деталі',
    demoNotice: 'Демонстраційна модель · синтетичні дані · розрахунок виконує QDIP', warehouses: 'склади', demandClusters: 'регіони попиту',
    productClasses: 'групи товарів', manualCandidate: 'Обрана точка', validationError: 'Вкажіть додатні значення місткості та виберіть хоча б одну умову зберігання.',
    requestFailed: 'Не вдалося виконати розрахунок. Спробуйте ще раз.', invalidError: 'Деякі введені значення некоректні. Перевірте параметри складу та повторіть спробу.', infeasibleError: 'За поточних умов неможливо побудувати план, який виконує всі обмеження. Перевірте доступність складів, потужності та потрібний рівень виконання попиту.', unavailableError: 'Сервіс розрахунку тимчасово недоступний. Спробуйте ще раз.', perDay: 'за день',
  },
  pl: {
    featureName: 'Optymalizacja sieci dostaw',
    title: 'Sprawdź, jak sieć poradzi sobie z zakłóceniem i jak utrzymać dostawy.',
    intro: 'QDIP pokazuje, co stanie się po utracie magazynu, jak przekierować towar i które warianty mogą ograniczyć skutki zakłócenia.',
    optimize: 'Oblicz bieżący plan', optimizing: 'Obliczamy…', current: 'Bieżąca sieć', optimized: 'Bieżący plan',
    unavailable: 'Magazyn niedostępny', reallocated: 'Zaktualizowana sieć', newWarehouse: 'Nowy magazyn',
    makeUnavailable: 'Zasymuluj utratę magazynu', confirmUnavailable: 'Zasymulować całkowitą niedostępność tego magazynu?', disruptionHelp: 'Sprawdź, co stanie się z dostawami, jeśli ten magazyn stanie się całkowicie niedostępny.', disruptionDone: 'Magazyn niedostępny. QDIP przebudował plan dostaw.', disruptionDoneHelp: 'Mapa pokazuje przekierowane przepływy, a poniżej widać, jaki popyt udało się zabezpieczyć, zmianę kosztów i pozostałe ograniczenia.', cancel: 'Anuluj', addHere: 'Dodaj magazyn tutaj',
    candidateArea: 'Warianty poprawy', findImprovements: 'Znajdź warianty wzmocnienia sieci', findingImprovements: 'Szukamy wariantów wzmocnienia…', decisionSummary: 'Podsumowanie decyzji', serviceChange: 'Zmiana zrealizowanego popytu',
    unservedChange: 'Zmiana niezaspokojonego popytu', costChange: 'Zmiana kosztu logistyki', paretoAlternatives: 'Warianty poprawy',
    frontierHint: 'Każdy wariant oznacza inny kompromis między realizacją popytu a kosztami. Porównaj je przed podjęciem decyzji.',
    disruptionReallocated: 'Zakłócenie + nowy plan', noCandidate: 'Żadna ze sprawdzonych lokalizacji nie poprawia istotnie działania sieci w obecnych warunkach.',
    service: 'Zrealizowany popyt', unserved: 'Niezaspokojony popyt', logistics: 'Szacowany koszt logistyki', risk: 'Zapasy zagrożone',
    utilization: 'Maksymalne wykorzystanie magazynów', businessLoss: 'Szacowany wpływ na biznes', affected: 'Regiony dotknięte zakłóceniem',
    evidence: 'Dlaczego otrzymaliśmy taki wynik', capacity: 'Pojemność', receiving: 'Przyjęcia dziennie', dispatch: 'Wysyłki dziennie',
    operating: 'Koszt działania magazynu, ₴', storage: 'Warunki składowania', evaluate: 'Sprawdź ten magazyn',
    candidateNotUsed: 'Dodanie magazynu w tej lokalizacji nie jest opłacalne. W obecnych warunkach nie poprawia działania sieci, dlatego QDIP znajduje lepszy plan bez jego wykorzystania.',
    candidateUsed: 'Ten magazyn poprawia działanie sieci. QDIP uwzględnił go w zaktualizowanym planie dostaw.',
    demand: 'Popyt', source: 'Magazyn realizujący dostawy', status: 'Realizacja popytu', served: 'zrealizowano', pending: 'Obliczamy plan…',
    clickHint: 'Kliknij dowolne miejsce na mapie, aby sprawdzić, czy nowy magazyn w tej lokalizacji pomoże.',
    improvement: 'Poprawa planu', requiredCapacity: 'Zapas w magazynie', pareto: 'Warto rozważyć',
    peakReceiving: 'Maksymalne przyjęcia dziennie', peakDispatch: 'Maksymalne wysyłki dziennie', scenarioComparison: 'Przed i po zakłóceniu',
    endingInventory: 'Pozostały zapas', inboundAllocation: 'Gdzie skierować nowe dostawy', bindingConstraints: 'Co ogranicza wynik',
    none: 'Brak', used: 'uwzględniony w planie', notUsed: 'niepotrzebny w tym planie', technicalDetails: 'Szczegóły techniczne',
    demoNotice: 'Model demonstracyjny · dane syntetyczne · obliczenia wykonuje QDIP', warehouses: 'magazyny', demandClusters: 'regiony popytu',
    productClasses: 'grupy produktów', manualCandidate: 'Wybrana lokalizacja', validationError: 'Podaj dodatnie wartości pojemności i wybierz co najmniej jeden warunek składowania.',
    requestFailed: 'Nie udało się wykonać obliczenia. Spróbuj ponownie.', invalidError: 'Niektóre wartości są nieprawidłowe. Sprawdź parametry magazynu i spróbuj ponownie.', infeasibleError: 'Przy obecnych warunkach nie da się zbudować planu spełniającego wszystkie ograniczenia. Sprawdź dostępność magazynów, przepustowość i wymagany poziom realizacji popytu.', unavailableError: 'Usługa obliczeniowa jest chwilowo niedostępna. Spróbuj ponownie.', perDay: 'dziennie',
  },
} as const

const pct = (value: number) => `${Math.round(value * 100)}%`

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[.025] p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-medium text-slate-100">{value}</div>
    </div>
  )
}

function highestUtilization(result: OptimizationResult) {
  return Math.max(0, ...result.warehouse_utilization.filter((item) => item.used).map((item) => item.capacity_utilization))
}

function humanizeConstraint(value: string, locale: Locale) {
  const [kind, ...parts] = value.split(':')
  const labels: Record<Locale, Record<string, string>> = {
    en: {
      'inventory-balance': 'Inventory balance',
      'available-capacity': 'Available storage capacity',
      'warehouse-capacity': 'Ending storage capacity',
      'receiving-capacity': 'Receiving capacity',
      'dispatch-capacity': 'Dispatch capacity',
      'delivery-route-capacity': 'Delivery route capacity',
      'transfer-route-capacity': 'Transfer route capacity',
      'point-service-level': 'Demand-point service level',
      'minimum-service-level': 'Network minimum service level',
      'inventory-exposure': 'Inventory exposure limit',
      'concentration-target': 'Inventory concentration target',
    },
    uk: {
      'inventory-balance': 'Баланс запасів',
      'available-capacity': 'Доступна місткість зберігання',
      'warehouse-capacity': 'Кінцева місткість складу',
      'receiving-capacity': 'Потужність приймання',
      'dispatch-capacity': 'Потужність відвантаження',
      'delivery-route-capacity': 'Пропускна здатність маршруту доставки',
      'transfer-route-capacity': 'Пропускна здатність міжскладського маршруту',
      'point-service-level': 'Рівень сервісу точки попиту',
      'minimum-service-level': 'Мінімальний рівень сервісу мережі',
      'inventory-exposure': 'Ліміт концентрації запасів',
      'concentration-target': 'Цільова концентрація запасів',
    },
    pl: {
      'inventory-balance': 'Bilans zapasów',
      'available-capacity': 'Dostępna pojemność składowania',
      'warehouse-capacity': 'Końcowa pojemność magazynu',
      'receiving-capacity': 'Przepustowość przyjęć',
      'dispatch-capacity': 'Przepustowość wysyłek',
      'delivery-route-capacity': 'Przepustowość trasy dostawy',
      'transfer-route-capacity': 'Przepustowość trasy między magazynami',
      'point-service-level': 'Poziom obsługi punktu popytu',
      'minimum-service-level': 'Minimalny poziom obsługi sieci',
      'inventory-exposure': 'Limit koncentracji zapasów',
      'concentration-target': 'Docelowa koncentracja zapasów',
    },
  }
  const label = labels[locale][kind]
  if (!label) return value.replaceAll(':', ' · ')
  const readableParts = parts.map((part) => entityDisplayLabel(part, locale))
  return readableParts.length ? `${label} · ${readableParts.join(' · ')}` : label
}

function requestErrorKey(reason: unknown): 'invalidError' | 'infeasibleError' | 'unavailableError' | 'requestFailed' {
  if (typeof reason === 'object' && reason !== null && 'kind' in reason) {
    const kind = (reason as { kind?: unknown }).kind
    if (kind === 'invalid') return 'invalidError'
    if (kind === 'infeasible') return 'infeasibleError'
    if (kind === 'unavailable') return 'unavailableError'
  }
  return 'requestFailed'
}

function withUnavailable(network: SupplyNetwork, warehouseId: string): SupplyNetwork {
  return {
    ...network,
    unavailable_warehouse_ids: Array.from(new Set([...network.unavailable_warehouse_ids, warehouseId])),
  }
}

export function SupplyNetworkOptimizationWorkspace({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const number = (value: number) => formatNumber(value, locale)
  const [baseline, setBaseline] = useState<OptimizationResult | null>(null)
  const [scenario, setScenario] = useState<ScenarioComparison | null>(null)
  const [candidateAreas, setCandidateAreas] = useState<CandidateResult[]>([])
   const [manualResult, setManualResult] = useState<OptimizationResult | null>(null)
  const [manualEvaluation, setManualEvaluation] = useState<CandidateResult | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [selectedStore, setSelectedStore] = useState<DemandPoint | null>(null)
  const [confirmWarehouseId, setConfirmWarehouseId] = useState<string | null>(null)
  const [candidateLocation, setCandidateLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [candidateCapacity, setCandidateCapacity] = useState(1800)
  const [candidateReceiving, setCandidateReceiving] = useState(340)
  const [candidateDispatch, setCandidateDispatch] = useState(380)
  const [candidateOperatingCost, setCandidateOperatingCost] = useState(88000)
  const [candidateStorage, setCandidateStorage] = useState<StorageClass[]>(['ambient', 'controlled'])
  const [pending, setPending] = useState(false)
  const [candidatePending, setCandidatePending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unavailableIds = scenario ? [scenario.unavailable_warehouse_id] : []
  const activeNetwork = useMemo(
    () => scenario ? withUnavailable(SUPPLY_NETWORK_DEMO, scenario.unavailable_warehouse_id) : SUPPLY_NETWORK_DEMO,
    [scenario]
  )
  const visibleResult = manualResult ?? scenario?.disrupted ?? baseline

  const manualCandidate = useMemo<CandidateWarehouse | null>(() => {
    if (!candidateLocation) return null
    return {
      id: 'manual-candidate',
      label: t.manualCandidate,
      latitude: candidateLocation.latitude,
      longitude: candidateLocation.longitude,
      capacity_units: candidateCapacity,
      receiving_capacity_units_per_day: candidateReceiving,
      dispatch_capacity_units_per_day: candidateDispatch,
      supported_storage_classes: candidateStorage,
      operating_cost: candidateOperatingCost,
    }
  }, [
    candidateCapacity,
    candidateDispatch,
    candidateLocation,
    candidateOperatingCost,
    candidateReceiving,
    candidateStorage,
  ])

  const selectedService = selectedStore && visibleResult
    ? visibleResult.demand_service.find((item) => item.demand_point_id === selectedStore.id)
    : null
  const selectedUtilization = selectedWarehouse && visibleResult
    ? visibleResult.warehouse_utilization.find((item) => item.warehouse_id === selectedWarehouse.id)
    : null
   const paretoCandidates = candidateAreas.filter((item) => item.feasible && item.pareto_efficient)
  const optimize = useCallback(async () => {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      setBaseline(await runOptimization(SUPPLY_NETWORK_DEMO))
      setScenario(null)
      setCandidateAreas([])
       setManualResult(null)
      setManualEvaluation(null)
    } catch (reason) {
      setError(t[requestErrorKey(reason)])
    } finally {
      setPending(false)
    }
  }, [pending])

  const makeUnavailable = useCallback(async (warehouseId: string) => {
    if (pending) return
    setPending(true)
    setError(null)
    setConfirmWarehouseId(null)
    try {
      const comparison = await runUnavailableScenario(SUPPLY_NETWORK_DEMO, warehouseId)
      setBaseline(comparison.baseline)
      setScenario(comparison)
      setManualResult(null)
      setManualEvaluation(null)
      setCandidateAreas([])
     } catch (reason) {
      setError(t[requestErrorKey(reason)])
    } finally {
      setPending(false)
    }
  }, [pending])

  const findImprovementOptions = useCallback(async () => {
    if (!scenario || candidatePending) return
    setCandidatePending(true)
    setError(null)
    try {
      const disruptedNetwork = withUnavailable(SUPPLY_NETWORK_DEMO, scenario.unavailable_warehouse_id)
      const candidates = await runCandidateAreas(disruptedNetwork)
      setCandidateAreas(candidates.candidates)
    } catch (reason) {
      setError(t[requestErrorKey(reason)])
    } finally {
      setCandidatePending(false)
    }
  }, [candidatePending, scenario])

  const evaluateManual = useCallback(async () => {
    if (pending || !manualCandidate) return
    if (
      manualCandidate.capacity_units <= 0 ||
      manualCandidate.receiving_capacity_units_per_day <= 0 ||
      manualCandidate.dispatch_capacity_units_per_day <= 0 ||
      manualCandidate.supported_storage_classes.length === 0
    ) {
      setError(t.validationError)
      return
    }
    setPending(true)
    setError(null)
    try {
      const result = await runManualCandidate(activeNetwork, manualCandidate)
      setManualEvaluation(result.candidate)
      setManualResult(result.optimized_network)
    } catch (reason) {
      setError(t[requestErrorKey(reason)])
    } finally {
      setPending(false)
    }
  }, [activeNetwork, manualCandidate, pending])

  const selectWarehouse = useCallback((warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse)
    setSelectedStore(null)
    setConfirmWarehouseId(null)
  }, [])
  const selectStore = useCallback((store: DemandPoint) => {
    setSelectedStore(store)
    setSelectedWarehouse(null)
  }, [])
  const selectMapLocation = useCallback((latitude: number, longitude: number) => {
    setCandidateLocation({ latitude, longitude })
    setManualResult(null)
    setManualEvaluation(null)
  }, [])

  const stages = [
    { label: t.current, active: !baseline },
    { label: t.optimized, active: Boolean(baseline && !scenario) },
    { label: t.disruptionReallocated, active: Boolean(scenario && !manualResult) },
    { label: t.newWarehouse, active: Boolean(manualResult) },
  ]

  return (
    <main className="mx-auto w-full max-w-[1640px] px-4 pb-20 sm:px-5 md:px-8 lg:px-10">
      <section className="grid gap-6 py-8 xl:grid-cols-[1.5fr_.7fr] xl:items-end">
        <div>
          <Badge variant="cyan">QDIP OBSERVATORY · {t.featureName}</Badge>
          <p className="mt-3 text-xs text-slate-500">{t.demoNotice}</p>
          <h1 className="ds-h1 mt-4 max-w-5xl">{t.title}</h1>
          <p className="ds-lead mt-4 max-w-4xl text-slate-300">{t.intro}</p>
        </div>
        <Card>
          <CardContent style={{ paddingTop: 'var(--ds-space-6)' }}>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><WarehouseIcon className="mx-auto mb-2 h-5 w-5 text-[var(--ds-accent)]" /><strong>{SUPPLY_NETWORK_DEMO.warehouses.length}</strong><p className="text-xs text-slate-500">{t.warehouses}</p></div>
              <div><MapPin className="mx-auto mb-2 h-5 w-5 text-[var(--ds-accent)]" /><strong>{SUPPLY_NETWORK_DEMO.demand_points.length}</strong><p className="text-xs text-slate-500">{t.demandClusters}</p></div>
              <div><Network className="mx-auto mb-2 h-5 w-5 text-[var(--ds-accent)]" /><strong>{SUPPLY_NETWORK_DEMO.product_classes.length}</strong><p className="text-xs text-slate-500">{t.productClasses}</p></div>
            </div>
            <Button className="mt-6 w-full" onClick={optimize} disabled={pending}>
              <Play className="h-4 w-4" /> {pending ? t.optimizing : t.optimize}
            </Button>
          </CardContent>
        </Card>
      </section>

      <div className="mb-5 flex flex-wrap gap-2">
        {stages.map((stage, index) => (
          <Badge key={stage.label} variant={stage.active ? 'cyan' : 'neutral'}>
            {index + 1}. {stage.label}
          </Badge>
        ))}
      </div>

      {pending ? <p className="mb-4 text-sm text-slate-400" role="status">{t.pending}</p> : null}
      {error ? (
        <div className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100" role="alert">
          <AlertTriangle className="mr-2 inline h-4 w-4" />{error}
        </div>
      ) : null}

      {scenario ? (
        <div className="mb-5 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4" role="status">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div>
              <p className="font-medium text-slate-100">{t.disruptionDone}</p>
              <p className="mt-1 text-sm text-slate-300">{t.disruptionDoneHelp}</p>
            </div>
          </div>
        </div>
      ) : null}

      {visibleResult ? (
        <ExecutiveDecisionSummary result={visibleResult} baseline={scenario?.baseline ?? null} hasDisruption={Boolean(scenario)} locale={locale} network={activeNetwork} />
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.65fr)]">
        <LazyNetworkMap
          locale={locale}
          network={activeNetwork}
          result={visibleResult}
          unavailableWarehouseIds={unavailableIds}
          candidateAreas={candidateAreas}
          manualCandidate={manualCandidate}
          currentFlows={SUPPLY_NETWORK_CURRENT_FLOWS}
          onWarehouseSelect={selectWarehouse}
          onStoreSelect={selectStore}
          onMapClick={selectMapLocation}
        />

        <div className="space-y-4">
          {selectedWarehouse ? (
            <Card>
              <CardHeader><CardTitle>{warehouseDisplayLabel(selectedWarehouse.id, locale, selectedWarehouse.label)}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Metric label={t.capacity} value={number(selectedWarehouse.capacity_units)} />
                  <Metric label={t.utilization} value={selectedUtilization ? pct(selectedUtilization.capacity_utilization) : '—'} />
                  <Metric label={t.peakReceiving} value={selectedUtilization ? number(selectedUtilization.peak_receiving_units_per_day) : '—'} />
                  <Metric label={t.peakDispatch} value={selectedUtilization ? number(selectedUtilization.peak_dispatch_units_per_day) : '—'} />
                </div>
                {!unavailableIds.includes(selectedWarehouse.id) ? (
                  <>
                    <p className="mt-4 text-sm text-slate-300">{t.disruptionHelp}</p>
                    {confirmWarehouseId === selectedWarehouse.id ? (
                    <div className="mt-4 space-y-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
                      <p className="text-sm text-slate-200">{t.confirmUnavailable}</p>
                      <div className="flex gap-2">
                        <Button onClick={() => makeUnavailable(selectedWarehouse.id)} disabled={pending}>{t.makeUnavailable}</Button>
                        <Button variant="secondary" onClick={() => setConfirmWarehouseId(null)} disabled={pending}>{t.cancel}</Button>
                      </div>
                    </div>
                  ) : (
                    <Button className="mt-4 w-full" onClick={() => setConfirmWarehouseId(selectedWarehouse.id)} disabled={pending}>
                      <AlertTriangle className="h-4 w-4" /> {t.makeUnavailable}
                    </Button>
                  )}
                  </>
                ) : (
                  <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3">
                    <Badge variant="amber">{t.unavailable}</Badge>
                    <p className="mt-2 text-sm text-slate-300">{t.disruptionDoneHelp}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {selectedStore ? (
            <Card>
              <CardHeader><CardTitle>{demandDisplayLabel(selectedStore.id, locale, selectedStore.label)}</CardTitle></CardHeader>
              <CardContent>
                
                <div className="mt-3 space-y-2 text-sm">
                  {Object.entries(selectedStore.demand_per_day).map(([product, demand]) => (
                    <div key={product} className="flex justify-between"><span>{productClassDisplayLabel(product, locale)}</span><strong>{number(demand)} {t.perDay}</strong></div>
                  ))}
                </div>
                {selectedService ? (
                  <div className="mt-4 grid gap-2">
                    <Metric label={t.source} value={selectedService.source_warehouse_ids.map((id) => warehouseDisplayLabel(id, locale)).join(', ') || '—'} />
                    <Metric label={t.status} value={`${pct(selectedService.service_level)} ${t.served}`} />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {candidateLocation && manualCandidate ? (
            <Card>
              <CardHeader><CardTitle>{t.addHere}</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-slate-500">{candidateLocation.latitude.toFixed(4)}, {candidateLocation.longitude.toFixed(4)}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-slate-400">{t.capacity}<input aria-label={t.capacity} className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm" type="number" min="1" value={candidateCapacity} onChange={(event) => setCandidateCapacity(Number(event.target.value))} /></label>
                  <label className="text-xs text-slate-400">{t.receiving}<input aria-label={t.receiving} className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm" type="number" min="1" value={candidateReceiving} onChange={(event) => setCandidateReceiving(Number(event.target.value))} /></label>
                  <label className="text-xs text-slate-400">{t.dispatch}<input aria-label={t.dispatch} className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm" type="number" min="1" value={candidateDispatch} onChange={(event) => setCandidateDispatch(Number(event.target.value))} /></label>
                  <label className="text-xs text-slate-400">{t.operating}<input aria-label={t.operating} className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm" type="number" min="0" value={candidateOperatingCost} onChange={(event) => setCandidateOperatingCost(Number(event.target.value))} /></label>
                </div>
                <div className="mt-3">
                  <span className="text-xs text-slate-400">{t.storage}</span>
                  <div className="mt-2 flex gap-4 text-sm">
                    {(['ambient', 'controlled'] as StorageClass[]).map((storageClass) => (
                      <label key={storageClass} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={candidateStorage.includes(storageClass)}
                          onChange={(event) => setCandidateStorage((current) =>
                            event.target.checked
                              ? Array.from(new Set([...current, storageClass]))
                              : current.filter((item) => item !== storageClass)
                          )}
                        />
                        {storageClassDisplayLabel(storageClass, locale)}
                      </label>
                    ))}
                  </div>
                </div>
                <Button className="mt-4 w-full" onClick={evaluateManual} disabled={pending}>
                  <Plus className="h-4 w-4" /> {t.evaluate}
                </Button>
                {manualEvaluation ? (
                  <p className={`mt-3 text-sm ${manualEvaluation.used ? 'text-emerald-300' : 'text-amber-200'}`}>
                    {manualEvaluation.used ? t.candidateUsed : t.candidateNotUsed}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="pt-6 text-sm text-slate-400">{t.clickHint}</CardContent></Card>
          )}
        </div>
      </section>

      {scenario ? (
        <section id="supply-alternatives" className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader><CardTitle>{t.affected}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {scenario.affected_demand_point_ids.map((id) => {
                  const point = SUPPLY_NETWORK_DEMO.demand_points.find((item) => item.id === id)
                  return <Badge key={id} variant="amber">{demandDisplayLabel(id, locale, point?.label)}</Badge>
                })}
                {scenario.affected_demand_point_ids.length === 0 ? <span className="text-sm text-slate-500">{t.none}</span> : null}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t.candidateArea}</CardTitle></CardHeader>
            <CardContent>
              {candidateAreas.length === 0 ? (
                <Button className="w-full" variant="secondary" onClick={findImprovementOptions} disabled={candidatePending}>
                  <Plus className="h-4 w-4" /> {candidatePending ? t.findingImprovements : t.findImprovements}
                </Button>
              ) : paretoCandidates.length ? (
                <div>
                  <p className="mb-3 text-sm text-slate-400">{t.frontierHint}</p>
                  <div className="space-y-2">
                    {paretoCandidates.slice(0, 5).map((candidate, index) => (
                      <div key={candidate.candidate_id} className="rounded-md border border-cyan-400/15 p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span>{candidateOptionLabel(index, locale)}</span>
                          <span className="text-cyan-300">{t.pareto}</span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-400">
                          <span>{t.service}: {pct(candidate.service_level ?? 0)}</span>
                          <span>{t.requiredCapacity}: {number(candidate.required_capacity_units ?? 0)}</span>
                          <span>{t.logistics}: {candidate.logistics_cost == null ? '—' : formatMoney(candidate.logistics_cost, locale)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p className="text-sm text-slate-400">{t.noCandidate}</p>}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {scenario ? (
        <section className="mt-8">
          <h2 className="ds-h2 mb-4">{t.scenarioComparison}</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { label: t.optimized, result: scenario.baseline },
              { label: t.reallocated, result: scenario.disrupted },
              ...(manualResult ? [{ label: t.newWarehouse, result: manualResult }] : []),
            ].map((item) => (
              <Card key={item.label}>
                <CardHeader><CardTitle>{item.label}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <Metric label={t.service} value={pct(item.result.kpis.service_level)} />
                    <Metric label={t.unserved} value={number(item.result.kpis.unserved_demand_units)} />
                    <Metric label={t.logistics} value={formatMoney(item.result.kpis.logistics_cost, locale)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {visibleResult ? (
        <section className="mt-8">
          <Card>
            <details>
              <summary className="cursor-pointer list-none p-6 text-base font-medium text-slate-200">{t.evidence} · {t.technicalDetails}</summary>
              <CardContent>
              <div className="grid gap-4 lg:grid-cols-3">
                <div>
                  <h3 className="text-sm font-medium text-slate-200">{t.endingInventory}</h3>
                  <div className="mt-2 space-y-1 text-xs text-slate-400">
                    {visibleResult.ending_inventory.slice(0, 8).map((item) => (
                      <p key={`${item.warehouse_id}-${item.product_class_id}`}>{productClassDisplayLabel(item.product_class_id, locale)} → {warehouseDisplayLabel(item.warehouse_id, locale)}: {number(item.units)}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-200">{t.inboundAllocation}</h3>
                  <div className="mt-2 space-y-1 text-xs text-slate-400">
                    {visibleResult.inbound_allocation.map((item) => (
                      <p key={`${item.supply_id}-${item.warehouse_id}`}>{productClassDisplayLabel(item.product_class_id, locale)} → {warehouseDisplayLabel(item.warehouse_id, locale)}: {number(item.units)}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-200">{t.bindingConstraints}</h3>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {visibleResult.binding_constraints.slice(0, 8).map((item) => <Badge key={item} variant="neutral">{humanizeConstraint(item, locale)}</Badge>)}
                  </div>
                </div>
              </div>
              </CardContent>
            </details>
          </Card>
        </section>
      ) : null}
    </main>
  )
}
