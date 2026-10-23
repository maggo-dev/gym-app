import { describe, expect, it } from 'vitest'
import type { Goal } from '@/types'
import { CARDIO_MINUTES, prescribe } from './prescription'

const goals: Goal[] = ['hypertrophy', 'recomposition', 'fat_loss', 'strength']

describe('prescribe', () => {
  it.each(goals)('%s: compostos descansam mais e usam menos reps que isolados', (goal) => {
    const c = prescribe(goal, 'compound')
    const i = prescribe(goal, 'isolation')
    expect(c.restSec).toBeGreaterThan(i.restSec)
    expect(c.repsMax).toBeLessThanOrEqual(i.repsMax)
    expect(c.repsMin).toBeLessThan(c.repsMax)
  })

  it('valores de referência', () => {
    expect(prescribe('hypertrophy', 'compound')).toEqual({ sets: 3, repsMin: 6, repsMax: 10, restSec: 120 })
    expect(prescribe('recomposition', 'isolation')).toEqual({ sets: 3, repsMin: 10, repsMax: 15, restSec: 60 })
    expect(prescribe('strength', 'compound').repsMax).toBe(6)
    expect(prescribe('fat_loss', 'isolation').sets).toBe(2)
  })

  it('cardio usa duração fixa', () => {
    expect(prescribe('recomposition', 'cardio')).toMatchObject({ sets: 1, durationSec: CARDIO_MINUTES * 60 })
  })

  it('retorna cópia (não muta a tabela)', () => {
    const p = prescribe('hypertrophy', 'compound')
    p.sets = 99
    expect(prescribe('hypertrophy', 'compound').sets).toBe(3)
  })
})
