import { describe, expect, it } from 'vitest'
import type { WorkoutSession } from '@/types'
import {
  bodyWeightSeries,
  exerciseProgressionSeries,
  loggedExercisesForProfile,
  sessionTonnageSeries,
} from './analytics'

const mockSessions: WorkoutSession[] = [
  {
    id: 's1',
    profileId: 'mateus',
    dayId: 'A',
    dayName: 'Treino A',
    dayFocus: 'Peito',
    energy: 'normal',
    startedAt: '2026-10-15T18:00:00.000Z',
    finishedAt: '2026-10-15T18:50:00.000Z',
    queue: ['supino_reto_barra'],
    currentId: 'supino_reto_barra',
    logs: {
      supino_reto_barra: {
        plannedExerciseId: 'supino_reto_barra',
        exerciseId: 'supino_reto_barra',
        repsMin: 6,
        repsMax: 10,
        restSec: 105,
        isStarter: true,
        status: 'done',
        sets: [
          { reps: 10, weightKg: 60, done: true },
          { reps: 10, weightKg: 60, done: true },
        ],
      },
    },
  },
  {
    id: 's2',
    profileId: 'mateus',
    dayId: 'A',
    dayName: 'Treino A',
    dayFocus: 'Peito',
    energy: 'high',
    startedAt: '2026-10-20T18:00:00.000Z',
    finishedAt: '2026-10-20T18:55:00.000Z',
    queue: ['supino_reto_barra'],
    currentId: 'supino_reto_barra',
    logs: {
      supino_reto_barra: {
        plannedExerciseId: 'supino_reto_barra',
        exerciseId: 'supino_reto_barra',
        repsMin: 6,
        repsMax: 10,
        restSec: 105,
        isStarter: true,
        status: 'done',
        sets: [
          { reps: 10, weightKg: 65, done: true },
          { reps: 10, weightKg: 65, done: true },
        ],
      },
    },
  },
]

describe('analytics', () => {
  it('gera série cronológica de tonelagem das sessões', () => {
    const series = sessionTonnageSeries(mockSessions, 'mateus')
    expect(series).toHaveLength(2)
    expect(series[0].tonnageKg).toBe(1200)
    expect(series[1].tonnageKg).toBe(1300)
  })

  it('extrai progressão de carga máxima e 1RM de um exercício', () => {
    const exSeries = exerciseProgressionSeries(mockSessions, 'mateus', 'supino_reto_barra')
    expect(exSeries.map((p) => p.maxWeightKg)).toEqual([60, 65])
    expect(exSeries[1].estimated1RM).toBeGreaterThan(exSeries[0].estimated1RM)
    expect(loggedExercisesForProfile(mockSessions, 'mateus')).toEqual(['supino_reto_barra'])
  })

  it('monta série de peso corporal incluindo o marco inicial', () => {
    const w = bodyWeightSeries(106, [{ dateKey: '2026-10-22', weightKg: 104.8 }])
    expect(w).toEqual([
      { dateLabel: 'Início', weightKg: 106 },
      { dateLabel: '22/10', weightKg: 104.8 },
    ])
  })
})
