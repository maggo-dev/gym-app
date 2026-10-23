import { beforeEach, describe, expect, it } from 'vitest'
import { defaultProfiles } from '@/data/profiles'
import { generatePlan } from '@/lib/workoutGenerator'
import {
  adaptExercisesForEnergy,
  estimateDayMinutesForEnergy,
  sessionStats,
  useSessionStore,
} from './useSessionStore'

const mateus = defaultProfiles[0]
const dayA = generatePlan(mateus).days[0]

describe('useSessionStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useSessionStore.getState().discardSession()
  })

  it('Modo Sobrevivência (low) reduz séries, remove cardio e encurta a sessão', () => {
    const normal = adaptExercisesForEnergy(dayA.exercises, 'normal')
    const low = adaptExercisesForEnergy(dayA.exercises, 'low')
    expect(low.length).toBeLessThan(normal.length)
    expect(low[0].sets).toBe(Math.max(2, normal[0].sets - 1))
    expect(estimateDayMinutesForEnergy(dayA, 'low')).toBeLessThan(
      estimateDayMinutesForEnergy(dayA, 'normal'),
    )
  })

  it('inicia sessão, atualiza carga/reps e conclui séries até fechar o exercício', () => {
    const s = useSessionStore.getState().startSession('mateus', dayA, 'normal')
    const firstId = s.queue[0]
    useSessionStore.getState().selectExercise(firstId)

    useSessionStore.getState().updateSet(firstId, 0, { weightKg: 60, reps: 10 })
    const r1 = useSessionStore.getState().completeSet(firstId, 0)
    expect(r1.exerciseCompleted).toBe(false)
    expect(r1.restSec).toBeGreaterThan(0)

    const setsLen = useSessionStore.getState().session!.logs[firstId].sets.length
    for (let i = 1; i < setsLen; i++) {
      useSessionStore.getState().updateSet(firstId, i, { weightKg: 60, reps: 10 })
      useSessionStore.getState().completeSet(firstId, i)
    }

    const updated = useSessionStore.getState().session!
    expect(updated.logs[firstId].status).toBe('done')
    const stats = sessionStats(updated)
    expect(stats.completedSets).toBe(setsLen)
    expect(stats.tonnageKg).toBe(setsLen * 60 * 10)
  })

  it('skipToEnd joga o aparelho ocupado para o fim da fila e seleciona o próximo', () => {
    const s = useSessionStore.getState().startSession('mateus', dayA, 'normal')
    const firstId = s.queue[0]
    const secondId = s.queue[1]

    const next = useSessionStore.getState().skipToEnd(firstId)
    expect(next).toBe(secondId)
    const after = useSessionStore.getState().session!
    expect(after.queue.at(-1)).toBe(firstId)
    expect(after.currentId).toBe(secondId)
  })

  it('substitute troca o exercício mantendo o histórico de substituição', () => {
    const s = useSessionStore.getState().startSession('mateus', dayA, 'normal')
    const firstId = s.queue[0] // supino_reto_barra
    useSessionStore.getState().substitute(firstId, 'supino_reto_halteres')

    const log = useSessionStore.getState().session!.logs[firstId]
    expect(log.exerciseId).toBe('supino_reto_halteres')
    expect(log.substitutedFrom).toBe('supino_reto_barra')
  })
})
