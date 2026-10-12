import { afterEach, describe, expect, it } from 'vitest'
import { demoStudioRequest, resetDemoStudio } from './studio-demo'
import { emptyProfile, type Plugin, type Dimension } from './contracts'

afterEach(resetDemoStudio)

describe('isolated public Studio demo', () => {
  it('exposes only synthetic public catalog data', async () => {
    const plugins = await demoStudioRequest<Plugin[]>('decision-studio/plugins')
    const dimensions = await demoStudioRequest<Dimension[]>('dimensions')
    expect(plugins).toHaveLength(1)
    expect(plugins[0]?.name).toBe('demo-manual')
    expect(dimensions).toHaveLength(3)
  })

  it('edits temporary drafts without calling any server and forgets them on reset', async () => {
    const plugin = (await demoStudioRequest<Plugin[]>('decision-studio/plugins'))[0]
    const profile = {
      ...emptyProfile(plugin),
      name: 'Temporary profile',
      dimensions: [
        {
          dimension_id: 'demo-benefit',
          version: '1.0',
          required: false,
          weight: 1,
          configuration: {},
          binding_id: null,
          binding_version: null,
        },
      ],
    }
    const draft = await demoStudioRequest<{ id: string; name: string }>('decision-profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    })
    expect(draft.id).toMatch(/^demo-draft-/)
    expect(await demoStudioRequest<{ id: string }[]>('decision-profiles')).toHaveLength(1)
    await demoStudioRequest('decision-profiles/' + draft.id, {
      method: 'PATCH',
      body: JSON.stringify({ ...profile, name: 'Changed' }),
    })
    expect((await demoStudioRequest<{ name: string }>('decision-profiles/' + draft.id)).name).toBe('Changed')
    resetDemoStudio()
    expect(await demoStudioRequest('decision-profiles')).toEqual([])
  })

  it('never executes Kernel operations or reads audit in guest mode', async () => {
    await expect(demoStudioRequest('decision-profiles/id/execute', { method: 'POST' })).rejects.toThrow(
      'Kernel execution'
    )
    await expect(demoStudioRequest('dimension-decisions')).rejects.toThrow('Kernel execution')
  })
})
