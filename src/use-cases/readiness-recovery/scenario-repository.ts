import type { ReadinessRecoveryInput, ReadinessRecoveryResult } from './domain'

export type StoredReadinessScenario = {
  input: ReadinessRecoveryInput
  result: ReadinessRecoveryResult
  updatedAt: string
}

export interface ReadinessScenarioRepository {
  get(id: string): StoredReadinessScenario | undefined
  put(id: string, value: StoredReadinessScenario): void
}

class ProcessLocalScenarioRepository implements ReadinessScenarioRepository {
  private readonly values = new Map<string, StoredReadinessScenario>()

  get(id: string) {
    return this.values.get(id)
  }

  put(id: string, value: StoredReadinessScenario) {
    this.values.set(id, value)
  }
}

export const readinessScenarioRepository: ReadinessScenarioRepository = new ProcessLocalScenarioRepository()
