import { describe, expect, it } from 'vitest'
import { exerciseById, exercises } from './exercises'

describe('banco de exercícios', () => {
  it('tem pelo menos 60 exercícios', () => {
    expect(exercises.length).toBeGreaterThanOrEqual(60)
  })

  it('ids são únicos', () => {
    expect(new Set(exercises.map((e) => e.id)).size).toBe(exercises.length)
  })

  it.each(exercises.map((e) => [e.id, e] as const))('%s: equivalentes válidos', (_, e) => {
    expect(e.equivalents.length).toBeGreaterThan(0)
    expect(e.cues.length).toBeGreaterThan(0)
    for (const id of e.equivalents) {
      const eq = exerciseById.get(id)
      expect(eq, `equivalente ${id} não existe`).toBeDefined()
      expect(eq!.primary).toBe(e.primary)
      expect(id).not.toBe(e.id)
    }
  })
})
