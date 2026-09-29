import type { Locale } from '@/lib/observatory-i18n'

import type {
  ClarificationQuestion,
  NextStep,
  SemanticAssumption,
  SemanticParams,
  SemanticReason,
} from './model/contracts'

const roleLabels: Record<Locale, Record<string, string>> = {
  en: {
    action: 'action',
    objective: 'objective',
    constraint: 'constraint',
    outcome: 'outcome',
    information: 'information',
    entity: 'entity',
    timestamp: 'timestamp',
    community_id: 'community',
    team_id: 'team',
    capacity: 'capacity',
    demand: 'demand',
    service: 'service',
  },
  uk: {
    action: 'дія',
    objective: 'мета',
    constraint: 'обмеження',
    outcome: 'результат',
    information: 'інформація',
    entity: 'сутність',
    timestamp: 'час',
    community_id: 'спільнота',
    team_id: 'команда',
    capacity: 'спроможність',
    demand: 'потреба',
    service: 'послуга',
  },
  pl: {
    action: 'działanie',
    objective: 'cel',
    constraint: 'ograniczenie',
    outcome: 'wynik',
    information: 'informacja',
    entity: 'encja',
    timestamp: 'czas',
    community_id: 'społeczność',
    team_id: 'zespół',
    capacity: 'zdolność',
    demand: 'zapotrzebowanie',
    service: 'usługa',
  },
}

const fallback = {
  en: { field: 'field', role: 'role' },
  uk: { field: 'поле', role: 'роль' },
  pl: { field: 'pole', role: 'rola' },
} as const

export function renderSemanticRole(locale: Locale, role: string): string {
  return roleLabels[locale][role] ?? role || fallback[locale].role
}

function fieldParam(locale: Locale, params: SemanticParams): string {
  return params.field?.trim() || fallback[locale].field
}

function roleParam(locale: Locale, params: SemanticParams): string {
  return renderSemanticRole(locale, params.role?.trim() || '')
}

export function renderClarification(locale: Locale, item: ClarificationQuestion): string {
  const field = fieldParam(locale, item.params)
  const role = roleParam(locale, item.params)

  switch (item.code) {
    case 'clarification.controllable_action':
      return {
        en: 'Which field represents the action a decision maker can control?',
        uk: 'Яке поле відповідає дії, яку може контролювати особа, що приймає рішення?',
        pl: 'Które pole reprezentuje działanie, które może kontrolować osoba podejmująca decyzję?',
      }[locale]
    case 'clarification.business_objective':
      return {
        en: 'What business objective should QDIP optimize?',
        uk: 'Яку бізнес-мету має оптимізувати QDIP?',
        pl: 'Jaki cel biznesowy powinien optymalizować QDIP?',
      }[locale]
    case 'clarification.binding_constraints':
      return {
        en: 'Which constraints were known and binding at decision time?',
        uk: 'Які обмеження були відомі та обов’язкові на момент прийняття рішення?',
        pl: 'Które ograniczenia były znane i wiążące w momencie podejmowania decyzji?',
      }[locale]
    case 'clarification.decision_time_information':
      return {
        en: 'Which fields were available before the action was chosen?',
        uk: 'Які поля були доступні до вибору дії?',
        pl: 'Które pola były dostępne przed wyborem działania?',
      }[locale]
    case 'clarification.realized_outcome':
      return {
        en: 'Which field records the realized outcome?',
        uk: 'Яке поле фіксує фактичний результат?',
        pl: 'Które pole rejestruje rzeczywisty wynik?',
      }[locale]
    case 'clarification.field_role':
      return {
        en: `Should field “${field}” represent the “${role}” role?`,
        uk: `Чи має поле «${field}» відповідати ролі «${role}»?`,
        pl: `Czy pole „${field}” powinno reprezentować rolę „${role}”?`,
      }[locale]
    case 'clarification.field_meaning':
      return {
        en: `What business meaning should be assigned to field “${field}”?`,
        uk: `Яке бізнес-значення має поле «${field}»?`,
        pl: `Jakie znaczenie biznesowe ma pole „${field}”?`,
      }[locale]
    case 'clarification.field_availability':
      return {
        en: `Was field “${field}” available before the decision was made?`,
        uk: `Чи було поле «${field}» доступне до прийняття рішення?`,
        pl: `Czy pole „${field}” było dostępne przed podjęciem decyzji?`,
      }[locale]
  }
}

export function renderSemanticReason(locale: Locale, item: SemanticReason): string {
  const field = fieldParam(locale, item.params)
  const role = roleParam(locale, item.params)

  switch (item.code) {
    case 'semantic_reason.model_inference':
      return {
        en: `QDIP inferred “${field}” as “${role}” from the available evidence.`,
        uk: `QDIP визначив «${field}» як «${role}» на основі доступних ознак.`,
        pl: `QDIP wywnioskował „${field}” jako „${role}” na podstawie dostępnych przesłanek.`,
      }[locale]
    case 'semantic_reason.field_name_match':
      return {
        en: `The name of field “${field}” supports the “${role}” role.`,
        uk: `Назва поля «${field}» підтримує роль «${role}».`,
        pl: `Nazwa pola „${field}” wspiera rolę „${role}”.`,
      }[locale]
    case 'semantic_reason.data_profile_match':
      return {
        en: `The profile of field “${field}” supports the “${role}” role.`,
        uk: `Профіль даних поля «${field}» підтримує роль «${role}».`,
        pl: `Profil danych pola „${field}” wspiera rolę „${role}”.`,
      }[locale]
    case 'semantic_reason.business_context_match':
      return {
        en: `The business context supports mapping field “${field}” to “${role}”.`,
        uk: `Бізнес-контекст підтримує зіставлення поля «${field}» з роллю «${role}».`,
        pl: `Kontekst biznesowy wspiera przypisanie pola „${field}” do roli „${role}”.`,
      }[locale]
    case 'semantic_reason.user_selection':
      return {
        en: `The user selected field “${field}” for the “${role}” role.`,
        uk: `Користувач вибрав поле «${field}» для ролі «${role}».`,
        pl: `Użytkownik wybrał pole „${field}” dla roli „${role}”.`,
      }[locale]
  }
}

export function renderAssumption(locale: Locale, item: SemanticAssumption): string {
  const field = fieldParam(locale, item.params)
  const role = roleParam(locale, item.params)

  switch (item.code) {
    case 'assumption.business_semantics_require_confirmation':
      return {
        en: 'Business semantics require human confirmation.',
        uk: 'Бізнес-семантика потребує підтвердження людиною.',
        pl: 'Semantyka biznesowa wymaga potwierdzenia przez człowieka.',
      }[locale]
    case 'assumption.field_role_inferred':
      return {
        en: `The “${role}” role for field “${field}” is an inference that requires confirmation.`,
        uk: `Роль «${role}» для поля «${field}» є припущенням і потребує підтвердження.`,
        pl: `Rola „${role}” dla pola „${field}” jest założeniem wymagającym potwierdzenia.`,
      }[locale]
    case 'assumption.field_meaning_inferred':
      return {
        en: `The business meaning of field “${field}” is inferred and requires confirmation.`,
        uk: `Бізнес-значення поля «${field}» визначене як припущення і потребує підтвердження.`,
        pl: `Znaczenie biznesowe pola „${field}” zostało wywnioskowane i wymaga potwierdzenia.`,
      }[locale]
    case 'assumption.field_availability_inferred':
      return {
        en: `Decision-time availability of field “${field}” is inferred and requires confirmation.`,
        uk: `Доступність поля «${field}» на момент рішення є припущенням і потребує підтвердження.`,
        pl: `Dostępność pola „${field}” w momencie decyzji jest założeniem wymagającym potwierdzenia.`,
      }[locale]
    case 'assumption.business_context_inferred':
      return {
        en: 'The supplied business context is being treated as an unverified hypothesis.',
        uk: 'Наданий бізнес-контекст розглядається як непідтверджена гіпотеза.',
        pl: 'Podany kontekst biznesowy jest traktowany jako niezweryfikowana hipoteza.',
      }[locale]
  }
}

export function renderNextStep(locale: Locale, item: NextStep): string {
  switch (item.code) {
    case 'next_step.confirm_or_reject_inferred_critical_semantic':
      return {
        en: 'Confirm or reject every inferred critical semantic.',
        uk: 'Підтвердьте або відхиліть кожну критичну семантику, визначену QDIP.',
        pl: 'Potwierdź lub odrzuć każdą wywnioskowaną krytyczną semantykę.',
      }[locale]
    case 'next_step.confirm_controllable_action_and_business_objective':
      return {
        en: 'Confirm the controllable action and business objective.',
        uk: 'Підтвердьте керовану дію та бізнес-мету.',
        pl: 'Potwierdź kontrolowane działanie i cel biznesowy.',
      }[locale]
    case 'next_step.resolve_critical_semantics':
      return {
        en: 'Resolve competing controllable-action or business-objective semantics.',
        uk: 'Усуньте неоднозначність між конкуруючими керованими діями або бізнес-цілями.',
        pl: 'Rozstrzygnij konkurujące semantyki działania kontrolowanego lub celu biznesowego.',
      }[locale]
    case 'next_step.verify_archetype_requirements':
      return {
        en: 'Verify the required semantic mappings for the selected decision archetype.',
        uk: 'Підтвердьте обов’язкові семантичні зіставлення для вибраного типу рішення.',
        pl: 'Zweryfikuj wymagane mapowania semantyczne dla wybranego archetypu decyzji.',
      }[locale]
    case 'next_step.verify_decision_time_availability':
      return {
        en: 'Verify decision-time availability for every input field.',
        uk: 'Підтвердьте доступність кожного вхідного поля на момент прийняття рішення.',
        pl: 'Zweryfikuj dostępność każdego pola wejściowego w momencie podejmowania decyzji.',
      }[locale]
    case 'next_step.compile_resource_allocation':
      return {
        en: 'Compile through the constrained resource-allocation adapter.',
        uk: 'Скомпілюйте контракт через адаптер обмеженого розподілу ресурсів.',
        pl: 'Skompiluj kontrakt przez adapter ograniczonej alokacji zasobów.',
      }[locale]
    case 'next_step.compile_supported_decision':
      return {
        en: 'Compile through the selected registered decision adapter.',
        uk: 'Скомпілюйте контракт через вибраний зареєстрований адаптер рішення.',
        pl: 'Skompiluj kontrakt przez wybrany zarejestrowany adapter decyzyjny.',
      }[locale]
    case 'next_step.select_decision_adapter':
      return {
        en: 'Select a compatible decision adapter for this contract.',
        uk: 'Виберіть сумісний адаптер рішення для цього контракту.',
        pl: 'Wybierz zgodny adapter decyzyjny dla tego kontraktu.',
      }[locale]
  }
}
