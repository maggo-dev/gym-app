import { beforeEach, describe, expect, it } from 'vitest'
import { GENERATOR_VERSION } from '@/lib/workoutGenerator'
import { STORE_KEY, STORE_VERSION, useAppStore } from './useAppStore'

describe('useAppStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppStore.setState({ activeProfileId: 'mateus', plans: {}, nextDayIndex: {} })
  })

  it('carrega os dois perfis fixos', () => {
    const { profiles } = useAppStore.getState()
    expect(profiles.map((p) => p.id)).toEqual(['mateus', 'helen'])
    expect(profiles.every((p) => p.experience === 'intermediate')).toBe(true)
  })

  it('troca o perfil ativo e persiste no localStorage', () => {
    useAppStore.getState().setActiveProfile('helen')
    expect(useAppStore.getState().activeProfileId).toBe('helen')

    const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}')
    expect(saved.state.activeProfileId).toBe('helen')
    expect(saved.version).toBe(STORE_VERSION)
  })

  it('ignora ids de perfil inexistentes', () => {
    useAppStore.getState().setActiveProfile('fantasma')
    expect(useAppStore.getState().activeProfileId).toBe('mateus')
  })

  it('ensurePlan gera e persiste a ficha uma única vez', () => {
    const a = useAppStore.getState().ensurePlan('helen')
    const b = useAppStore.getState().ensurePlan('helen')
    expect(a).toBe(b)
    expect(a.generatorVersion).toBe(GENERATOR_VERSION)
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}')
    expect(saved.state.plans.helen.days).toHaveLength(3)
  })

  it('setNextDay faz a rotação A → B → C → A', () => {
    const s = useAppStore.getState()
    s.ensurePlan('mateus')
    s.setNextDay('mateus', 3)
    expect(useAppStore.getState().nextDayIndex.mateus).toBe(0)
    s.setNextDay('mateus', -1)
    expect(useAppStore.getState().nextDayIndex.mateus).toBe(2)
  })

  it('migra estado v1 para v2 preservando o perfil ativo', async () => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ state: { activeProfileId: 'helen' }, version: 1 }))
    await useAppStore.persist.rehydrate()
    const s = useAppStore.getState()
    expect(s.activeProfileId).toBe('helen')
    expect(s.plans).toEqual({})
    expect(s.nextDayIndex).toEqual({})
  })
})
