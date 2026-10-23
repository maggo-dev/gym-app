import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getExercise } from '@/data/exercises'
import { dayMinutes } from '@/lib/workoutGenerator'
import type {
  EnergyLevel,
  ExerciseLog,
  PlannedExercise,
  SetLog,
  WorkoutDay,
  WorkoutSession,
} from '@/types'

export const SESSION_STORE_KEY = 'gymapp:session:v1'

/**
 * Aplica a autorregulação de energia na lista de exercícios planejados:
 * - 'low' (Modo Sobrevivência): remove cardio e até 2 isolados finais, e reduz 1 série (mín. 2) nos demais.
 * - 'normal' / 'high': mantém a prescrição original.
 */
export function adaptExercisesForEnergy(
  exercises: PlannedExercise[],
  energy: EnergyLevel,
): PlannedExercise[] {
  if (energy !== 'low') return exercises.map((e) => ({ ...e }))

  // Remove cardio
  let filtered = exercises.filter((e) => getExercise(e.exerciseId).kind !== 'cardio')

  // Remove até 2 isolados do final (preservando pelo menos 4 exercícios no treino)
  let removedIso = 0
  for (let i = filtered.length - 1; i >= 0 && removedIso < 2 && filtered.length > 4; i--) {
    if (getExercise(filtered[i].exerciseId).kind === 'isolation') {
      filtered.splice(i, 1)
      removedIso++
    }
  }

  // Reduz 1 série em cada exercício (mínimo 2 séries para exercícios de força)
  return filtered.map((e) => ({
    ...e,
    sets: e.durationSec ? e.sets : Math.max(2, e.sets - 1),
  }))
}

/** Calcula a duração estimada do dia conforme o nível de energia escolhido. */
export function estimateDayMinutesForEnergy(day: WorkoutDay, energy: EnergyLevel): number {
  return dayMinutes(adaptExercisesForEnergy(day.exercises, energy))
}

export interface SessionState {
  session: WorkoutSession | null

  startSession: (
    profileId: string,
    day: WorkoutDay,
    energy: EnergyLevel,
    lastWeights?: Record<string, number>,
  ) => WorkoutSession
  selectExercise: (plannedId: string) => void
  updateSet: (plannedId: string, setIdx: number, patch: Partial<Pick<SetLog, 'reps' | 'weightKg'>>) => void
  completeSet: (plannedId: string, setIdx: number) => { restSec: number; exerciseCompleted: boolean }
  skipToEnd: (plannedId: string) => string | null
  substitute: (plannedId: string, newExerciseId: string) => void
  finishExercise: (plannedId: string) => void
  finishSession: () => WorkoutSession | null
  discardSession: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      session: null,

      startSession: (profileId, day, energy, lastWeights = {}) => {
        const adapted = adaptExercisesForEnergy(day.exercises, energy)
        const queue = adapted.map((e) => e.exerciseId)
        const logs: Record<string, ExerciseLog> = {}

        for (const pe of adapted) {
          const defaultReps = pe.durationSec
            ? Math.round(pe.durationSec / 60)
            : Math.round((pe.repsMin + pe.repsMax) / 2)
          const baseWeight = lastWeights[pe.exerciseId] ?? 0
          // Em energia alta, se já houver carga anterior, sugere +2 kg
          const suggestedWeight =
            energy === 'high' && baseWeight > 0 ? baseWeight + 2 : baseWeight

          logs[pe.exerciseId] = {
            plannedExerciseId: pe.exerciseId,
            exerciseId: pe.exerciseId,
            repsMin: pe.repsMin,
            repsMax: pe.repsMax,
            restSec: pe.restSec,
            durationSec: pe.durationSec,
            isStarter: pe.isStarter,
            status: 'pending',
            sets: Array.from({ length: pe.sets }, () => ({
              reps: defaultReps,
              weightKg: suggestedWeight,
              done: false,
            })),
          }
        }

        const session: WorkoutSession = {
          id: `${profileId}-${day.id}-${Date.now()}`,
          profileId,
          dayId: day.id,
          dayName: day.name,
          dayFocus: day.focus,
          energy,
          startedAt: new Date().toISOString(),
          queue,
          currentId: queue[0] ?? null,
          logs,
        }

        set({ session })
        return session
      },

      selectExercise: (plannedId) =>
        set((state) => {
          const s = state.session
          if (!s || !s.logs[plannedId]) return state
          // Move o escolhido para a frente dos pendentes se ainda não foi concluído
          const log = s.logs[plannedId]
          const logs: Record<string, ExerciseLog> = { ...s.logs }
          for (const k of Object.keys(logs)) {
            if (logs[k].status === 'active' && k !== plannedId) {
              logs[k] = { ...logs[k], status: 'pending' }
            }
          }
          if (log.status !== 'done') {
            logs[plannedId] = { ...log, status: 'active' }
          }
          return {
            session: {
              ...s,
              currentId: plannedId,
              logs,
            },
          }
        }),

      updateSet: (plannedId, setIdx, patch) =>
        set((state) => {
          const s = state.session
          const log = s?.logs[plannedId]
          if (!s || !log || !log.sets[setIdx]) return state
          const sets = log.sets.map((st, i) =>
            i === setIdx
              ? {
                  ...st,
                  reps: patch.reps !== undefined ? Math.max(0, patch.reps) : st.reps,
                  weightKg: patch.weightKg !== undefined ? Math.max(0, patch.weightKg) : st.weightKg,
                }
              : st,
          )
          return {
            session: {
              ...s,
              logs: { ...s.logs, [plannedId]: { ...log, sets } },
            },
          }
        }),

      completeSet: (plannedId, setIdx) => {
        const s = get().session
        const log = s?.logs[plannedId]
        if (!s || !log || !log.sets[setIdx]) return { restSec: 0, exerciseCompleted: false }

        const sets = log.sets.map((st, i) =>
          i === setIdx ? { ...st, done: true, completedAt: new Date().toISOString() } : st,
        )
        const allDone = sets.every((st) => st.done)
        const nextStatus = allDone ? 'done' : 'active'

        set({
          session: {
            ...s,
            logs: {
              ...s.logs,
              [plannedId]: { ...log, sets, status: nextStatus },
            },
          },
        })

        return {
          restSec: allDone ? 0 : log.restSec,
          exerciseCompleted: allDone,
        }
      },

      skipToEnd: (plannedId) => {
        const s = get().session
        if (!s || !s.logs[plannedId]) return null

        const without = s.queue.filter((id) => id !== plannedId)
        const queue = [...without, plannedId]
        const nextCandidate = queue.find((id) => id !== plannedId && s.logs[id].status !== 'done') ?? plannedId

        const logs: Record<string, ExerciseLog> = {
          ...s.logs,
          [plannedId]: { ...s.logs[plannedId], status: 'pending' },
        }
        if (nextCandidate && logs[nextCandidate].status !== 'done') {
          logs[nextCandidate] = { ...logs[nextCandidate], status: 'active' }
        }

        set({
          session: {
            ...s,
            queue,
            currentId: nextCandidate,
            logs,
          },
        })
        return nextCandidate
      },

      substitute: (plannedId, newExerciseId) =>
        set((state) => {
          const s = state.session
          const log = s?.logs[plannedId]
          if (!s || !log) return state
          // Valida que o novo exercício existe
          getExercise(newExerciseId)
          return {
            session: {
              ...s,
              logs: {
                ...s.logs,
                [plannedId]: {
                  ...log,
                  substitutedFrom: log.substitutedFrom ?? log.exerciseId,
                  exerciseId: newExerciseId,
                },
              },
            },
          }
        }),

      finishExercise: (plannedId) =>
        set((state) => {
          const s = state.session
          const log = s?.logs[plannedId]
          if (!s || !log) return state
          const nextPending =
            s.queue.find((id) => id !== plannedId && s.logs[id].status !== 'done') ?? null
          return {
            session: {
              ...s,
              currentId: nextPending,
              logs: {
                ...s.logs,
                [plannedId]: { ...log, status: 'done' },
              },
            },
          }
        }),

      finishSession: () => {
        const s = get().session
        if (!s) return null
        const finished: WorkoutSession = {
          ...s,
          finishedAt: new Date().toISOString(),
        }
        set({ session: null })
        return finished
      },

      discardSession: () => set({ session: null }),
    }),
    {
      name: SESSION_STORE_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/** Calcula estatísticas agregadas de uma sessão. */
export function sessionStats(session: WorkoutSession) {
  let completedSets = 0
  let totalSets = 0
  let tonnageKg = 0
  let completedExercises = 0
  let substitutedCount = 0

  for (const id of session.queue) {
    const log = session.logs[id]
    if (!log) continue
    if (log.substitutedFrom) substitutedCount++
    if (log.status === 'done') completedExercises++
    for (const st of log.sets) {
      totalSets++
      if (st.done) {
        completedSets++
        tonnageKg += st.reps * st.weightKg
      }
    }
  }

  const startMs = new Date(session.startedAt).getTime()
  const endMs = session.finishedAt ? new Date(session.finishedAt).getTime() : Date.now()
  const durationMinutes = Math.max(1, Math.round((endMs - startMs) / 60000))

  return {
    completedSets,
    totalSets,
    tonnageKg: Math.round(tonnageKg),
    completedExercises,
    totalExercises: session.queue.length,
    substitutedCount,
    durationMinutes,
  }
}
