import { describe, expect, it } from 'vitest'
import type { WorkoutSession } from '@/types'
import {
  calculateSessionXp,
  calculateWeeklyStreak,
  detectPersonalRecords,
  levelFromXp,
  shouldSuggestLoadIncrease,
} from './gamification'

function makeSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: 's1',
    profileId: 'mateus',
    dayId: 'A',
    dayName: 'Treino A',
    dayFocus: 'Peito, Ombros e Tríceps',
    energy: 'normal',
    startedAt: '2026-10-21T18:00:00.000Z',
    finishedAt: '2026-10-21T19:00:00.000Z',
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
          { reps: 10, weightKg: 60, done: true },
        ],
      },
    },
    ...overrides,
  }
}

describe('gamification', () => {
  it('calcula XP de sessão normal e com bônus de Modo Sobrevivência', () => {
    const normal = calculateSessionXp(makeSession())
    // 3 séries (30) + 1 exercício (25) + bônus conclusão (100) = 155
    expect(normal.totalXp).toBe(155)

    const low = calculateSessionXp(makeSession({ energy: 'low' }))
    expect(low.survivalBonusXp).toBe(30)
    expect(low.totalXp).toBe(185)
  })

  it('calcula nível e progresso a partir do XP total', () => {
    expect(levelFromXp(0).level).toBe(1)
    expect(levelFromXp(199).level).toBe(1)
    expect(levelFromXp(200).level).toBe(2)
    const lvl3 = levelFromXp(550)
    expect(lvl3.level).toBe(3)
    expect(lvl3.progress).toBeGreaterThan(0)
    expect(lvl3.progress).toBeLessThan(1)
  })

  it('calcula ofensiva semanal e marca os dias treinados na semana', () => {
    const wed = new Date(2026, 9, 21, 18, 0) // Quarta-feira
    const prevMon = new Date(2026, 9, 12, 18, 0)
    const prevWed = new Date(2026, 9, 14, 18, 0)
    const prevFri = new Date(2026, 9, 16, 18, 0)

    const history: WorkoutSession[] = [
      makeSession({ id: 'cur1', startedAt: wed.toISOString() }),
      makeSession({ id: 'p1', startedAt: prevMon.toISOString() }),
      makeSession({ id: 'p2', startedAt: prevWed.toISOString() }),
      makeSession({ id: 'p3', startedAt: prevFri.toISOString() }),
    ]

    const info = calculateWeeklyStreak(history, 'mateus', 3, 4, wed)
    expect(info.thisWeekCount).toBe(1)
    expect(info.streakWeeks).toBe(1) // 1 semana anterior completa (3/3)
    expect(info.weekDaysDone[2]).toBe(true) // Quarta = índice 2
  })

  it('detecta novo Recorde Pessoal (PR) comparando com sessões anteriores', () => {
    const prev = makeSession({ id: 'old' })
    const current = makeSession({
      id: 'new',
      logs: {
        supino_reto_barra: {
          ...prev.logs.supino_reto_barra,
          sets: [{ reps: 8, weightKg: 65, done: true }],
        },
      },
    })

    const prs = detectPersonalRecords(current, [prev])
    expect(prs).toHaveLength(1)
    expect(prs[0].newMaxWeightKg).toBe(65)
    expect(prs[0].previousMaxWeightKg).toBe(60)
  })

  it('sugere sobrecarga progressiva quando todas as séries bateram repsMax no último treino', () => {
    const prev = makeSession() // 3x10 com repsMax=10 e 60kg
    const check = shouldSuggestLoadIncrease('supino_reto_barra', [prev], 'mateus', 10)
    expect(check).toEqual({ suggest: true, lastWeightKg: 60 })
  })
})
