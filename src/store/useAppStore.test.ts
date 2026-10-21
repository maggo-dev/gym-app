import { beforeEach, describe, expect, it } from 'vitest'
import { STORE_KEY, useAppStore } from './useAppStore'

describe('useAppStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppStore.setState({ activeProfileId: 'mateus' })
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
    expect(saved.state).toEqual({ activeProfileId: 'helen' })
  })

  it('ignora ids de perfil inexistentes', () => {
    useAppStore.getState().setActiveProfile('fantasma')
    expect(useAppStore.getState().activeProfileId).toBe('mateus')
  })
})
