/**
 * Funções puras de análise de evolução (volume/tonelagem, cargas por exercício e peso corporal).
 */
import { oneRepMax } from '@/lib/calculations'
import { sessionStats } from '@/store/useSessionStore'
import type { BodyWeightEntry, WorkoutDayId, WorkoutSession } from '@/types'

/** Formata data ISO ou YYYY-MM-DD em DD/MM. */
export function shortDateLabel(dateStr: string): string {
  const clean = dateStr.slice(0, 10)
  const parts = clean.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`
  }
  const dt = new Date(dateStr)
  return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}`
}

export interface TonnagePoint {
  sessionId: string
  dateLabel: string
  dayId: WorkoutDayId
  tonnageKg: number
  durationMinutes: number
  completedSets: number
}

/** Série cronológica de tonelagem (kg) das últimas `limit` sessões do perfil. */
export function sessionTonnageSeries(
  history: WorkoutSession[],
  profileId: string,
  limit = 12,
): TonnagePoint[] {
  const chronological = [...history]
    .filter((s) => s.profileId === profileId)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
    .slice(-limit)

  return chronological.map((s) => {
    const st = sessionStats(s)
    return {
      sessionId: s.id,
      dateLabel: shortDateLabel(s.startedAt),
      dayId: s.dayId,
      tonnageKg: st.tonnageKg,
      durationMinutes: st.durationMinutes,
      completedSets: st.completedSets,
    }
  })
}

export interface ExerciseProgressionPoint {
  dateLabel: string
  maxWeightKg: number
  estimated1RM: number
}

/** Evolução de carga máxima e 1RM estimado de um exercício ao longo das sessões do perfil. */
export function exerciseProgressionSeries(
  history: WorkoutSession[],
  profileId: string,
  exerciseId: string,
  limit = 12,
): ExerciseProgressionPoint[] {
  const chronological = [...history]
    .filter((s) => s.profileId === profileId)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())

  const points: ExerciseProgressionPoint[] = []
  for (const s of chronological) {
    const log = Object.values(s.logs).find((l) => l.exerciseId === exerciseId)
    if (!log) continue
    const doneSets = log.sets.filter((st) => st.done && st.weightKg > 0)
    if (doneSets.length === 0) continue

    const best = doneSets.reduce((acc, st) =>
      st.weightKg > acc.weightKg || (st.weightKg === acc.weightKg && st.reps > acc.reps)
        ? st
        : acc,
    )
    points.push({
      dateLabel: shortDateLabel(s.startedAt),
      maxWeightKg: best.weightKg,
      estimated1RM: oneRepMax(best.weightKg, best.reps).value,
    })
  }

  return points.slice(-limit)
}

/** Lista de exerciseIds que já possuem pelo menos 1 série com carga registrada pelo perfil. */
export function loggedExercisesForProfile(history: WorkoutSession[], profileId: string): string[] {
  const seen = new Set<string>()
  for (const s of history) {
    if (s.profileId !== profileId) continue
    for (const log of Object.values(s.logs)) {
      if (log.sets.some((st) => st.done && st.weightKg > 0)) {
        seen.add(log.exerciseId)
      }
    }
  }
  return Array.from(seen)
}

/** Série de peso corporal (inclui o peso inicial do perfil na primeira posição se ainda não houver registros). */
export function bodyWeightSeries(
  initialWeightKg: number,
  entries: BodyWeightEntry[] = [],
  limit = 12,
): { dateLabel: string; weightKg: number }[] {
  const base = [{ dateLabel: 'Início', weightKg: initialWeightKg }]
  const mapped = entries.map((e) => ({
    dateLabel: shortDateLabel(e.dateKey),
    weightKg: e.weightKg,
  }))
  return [...base, ...mapped].slice(-limit)
}
