import type { Locale } from '@/lib/observatory-i18n'
import type { ScenarioContextView } from '@/components/observatory/scenario-context-panel'
import type { UseCaseId } from './registry'

type LocalizedContext = Record<Locale, ScenarioContextView>

const resourceAllocation: LocalizedContext = {
  en: {
    situation: 'Teams must be assigned across communities over a planning horizon while demand, availability and movement costs compete for limited capacity.',
    decisionQuestion: 'Which daily team allocation best covers weighted demand while respecting availability and operational constraints?',
    dataSummary: ['Communities and demand by day/service', 'Teams, capabilities and availability', 'Current allocation / optional baseline'],
    constraints: ['Team availability and eligibility', 'Planning horizon', 'Movement/reassignment limits and business priorities'],
    uncertainty: ['Imported data is validated before use; synthetic demo inputs are explicitly marked as demo data.'],
    testPurpose: 'Tests whether QDIP finds a feasible allocation with measurable demand coverage and operational trade-offs compared with the baseline.',
  },
  uk: {
    situation: 'Команди потрібно розподілити між громадами на горизонті планування, коли попит, доступність і вартість переміщень конкурують за обмежену потужність.',
    decisionQuestion: 'Який щоденний розподіл команд найкраще покриває зважений попит за наявних обмежень доступності й операційних правил?',
    dataSummary: ['Громади та попит за днями/сервісами', 'Команди, спроможності та доступність', 'Поточний розподіл / опційний baseline'],
    constraints: ['Доступність і eligibility команд', 'Горизонт планування', 'Ліміти переміщення/перепризначення та бізнес-пріоритети'],
    uncertainty: ['Імпортовані дані проходять validation; synthetic demo inputs явно позначені як demo data.'],
    testPurpose: 'Перевіряє, чи QDIP знаходить допустимий розподіл із вимірюваним покриттям попиту та операційними компромісами відносно baseline.',
  },
  pl: {
    situation: 'Zespoły trzeba rozdzielić między społeczności w horyzoncie planowania, gdy popyt, dostępność i koszt przesunięć konkurują o ograniczoną moc.',
    decisionQuestion: 'Który dzienny przydział zespołów najlepiej pokrywa ważony popyt przy ograniczeniach dostępności i regułach operacyjnych?',
    dataSummary: ['Społeczności i popyt według dnia/usługi', 'Zespoły, zdolności i dostępność', 'Bieżący przydział / opcjonalny baseline'],
    constraints: ['Dostępność i kwalifikacja zespołów', 'Horyzont planowania', 'Limity przesunięć i priorytety biznesowe'],
    uncertainty: ['Importowane dane są walidowane przed użyciem; dane demo są jawnie oznaczone.'],
    testPurpose: 'Sprawdza, czy QDIP znajduje wykonalny przydział z mierzalnym pokryciem popytu i kompromisami operacyjnymi względem baseline.',
  },
}

const supplyNetwork: LocalizedContext = {
  en: {
    situation: 'A distribution network must keep demand served when warehouses, routes or capacity become constrained or unavailable.',
    decisionQuestion: 'How should inventory, inbound supply, transfers and fulfillment be reallocated while preserving service floors and minimizing economic loss?',
    dataSummary: ['Warehouses, inventory and throughput capacities', 'Demand points and product classes', 'Suppliers, inbound supply, delivery/transfer routes and baseline fulfillment'],
    constraints: ['Storage/receiving/dispatch capacity', 'Route capacity and lead time', 'Minimum service and concentration policy'],
    uncertainty: ['Scenario analysis explicitly distinguishes hard constraints from soft policy penalties; solver optimality and MIP gap are reported.'],
    testPurpose: 'Tests disruption recovery, candidate warehouse evaluation and economic comparison under the same normalized network.',
  },
  uk: {
    situation: 'Розподільча мережа має зберігати обслуговування попиту, коли склади, маршрути або потужності обмежені чи недоступні.',
    decisionQuestion: 'Як перерозподілити запаси, inbound supply, transfers і fulfillment, зберігаючи service floor та мінімізуючи економічні втрати?',
    dataSummary: ['Склади, запаси й пропускна здатність', 'Точки попиту та класи продуктів', 'Постачальники, inbound supply, delivery/transfer routes і baseline fulfillment'],
    constraints: ['Storage/receiving/dispatch capacity', 'Пропускна здатність і lead time маршрутів', 'Мінімальний service level і concentration policy'],
    uncertainty: ['Сценарій явно розділяє hard constraints і soft penalties; показуються solver optimality та MIP gap.'],
    testPurpose: 'Перевіряє відновлення після disruption, оцінку нового складу та economic comparison на одному normalized network.',
  },
  pl: {
    situation: 'Sieć dystrybucyjna musi utrzymać obsługę popytu, gdy magazyny, trasy lub przepustowość są ograniczone albo niedostępne.',
    decisionQuestion: 'Jak przealokować zapasy, dostawy, transfery i realizację, zachowując minima obsługi i minimalizując stratę ekonomiczną?',
    dataSummary: ['Magazyny, zapasy i przepustowość', 'Punkty popytu i klasy produktów', 'Dostawcy, dostawy wejściowe, trasy i baseline realizacji'],
    constraints: ['Pojemność i przepustowość magazynów', 'Przepustowość i lead time tras', 'Minimalny poziom obsługi i polityka koncentracji'],
    uncertainty: ['Scenariusz rozdziela twarde ograniczenia i miękkie kary; raportowane są status solvera i MIP gap.'],
    testPurpose: 'Sprawdza odtworzenie po zakłóceniu, ocenę nowego magazynu i porównanie ekonomiczne na tej samej znormalizowanej sieci.',
  },
}

const gtmLab: LocalizedContext = {
  en: {
    situation: 'A commercial team must prioritize companies/opportunities when evidence quality, uncertainty, QDIP fit and potential value vary.',
    decisionQuestion: 'Which opportunities should be pursued, researched, watched or skipped, and what evidence is missing before a stronger commitment?',
    dataSummary: ['Company/opportunity records', 'Evidence with source/provenance', 'Optional commercial context and production pipeline results'],
    constraints: ['Evidence quality and freshness', 'QDIP capability fit', 'Explicit uncertainty and missing-information handling'],
    uncertainty: ['Hypotheses and unknowns remain visibly distinct from sourced evidence.'],
    testPurpose: 'Tests evidence-aware prioritization; it must not convert missing evidence into false confidence.',
  },
  uk: {
    situation: 'Комерційна команда має пріоритезувати компанії/можливості, коли якість evidence, uncertainty, QDIP fit і потенційна цінність різняться.',
    decisionQuestion: 'Які можливості слід pursue, research, watch або skip, і яких evidence бракує до сильнішого рішення?',
    dataSummary: ['Записи компаній/можливостей', 'Evidence із source/provenance', 'Опційний commercial context та результати production pipeline'],
    constraints: ['Якість і freshness evidence', 'QDIP capability fit', 'Явне опрацювання uncertainty і missing information'],
    uncertainty: ['Hypotheses та unknowns залишаються явно відокремленими від sourced evidence.'],
    testPurpose: 'Перевіряє evidence-aware prioritization і не повинен перетворювати відсутні докази на фальшиву впевненість.',
  },
  pl: {
    situation: 'Zespół komercyjny musi priorytetyzować firmy i szanse, gdy jakość dowodów, niepewność, dopasowanie do QDIP i potencjalna wartość są różne.',
    decisionQuestion: 'Które szanse należy pursue, research, watch lub skip i jakich dowodów brakuje przed mocniejszym zobowiązaniem?',
    dataSummary: ['Rekordy firm/szans', 'Dowody ze źródłem i pochodzeniem', 'Opcjonalny kontekst komercyjny i wyniki pipeline produkcyjnego'],
    constraints: ['Jakość i świeżość dowodów', 'Dopasowanie do możliwości QDIP', 'Jawna obsługa niepewności i brakujących informacji'],
    uncertainty: ['Hipotezy i niewiadome pozostają oddzielone od dowodów źródłowych.'],
    testPurpose: 'Sprawdza priorytetyzację opartą na dowodach bez zamiany brakujących danych w fałszywą pewność.',
  },
}

const contexts: Partial<Record<UseCaseId, LocalizedContext>> = {
  'resource-allocation': resourceAllocation,
  'supply-network-optimization': supplyNetwork,
  'gtm-lab': gtmLab,
}

export function applicationScenarioContext(id: UseCaseId, locale: Locale): ScenarioContextView | null {
  return contexts[id]?.[locale] ?? null
}
