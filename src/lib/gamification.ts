/**
 * Motor de Gamificação, Ofensiva Semanal, Recordes Pessoais (PRs) e Sobrecarga Progressiva.
 * Funções puras e determinísticas.
 */
import { oneRepMax } from '@/lib/calculations'
import type { WorkoutSession } from '@/types'

// ───────────────────────── XP & Níveis ─────────────────────────

export const XP_PER_SET = 10
export const XP_PER_COMPLETED_EXERCISE = 25
export const XP_FINISH_BONUS = 100
export const XP_SURVIVAL_BONUS = 30

export interface SessionXpBreakdown {
  setsXp: number
  exercisesXp: number
  finishBonusXp: number
  survivalBonusXp: number
  totalXp: number
}

/** Calcula o XP ganho em uma sessão de treino. */
export function calculateSessionXp(session: WorkoutSession): SessionXpBreakdown {
  let completedSets = 0
  let totalSets = 0
  let completedExercises = 0

  for (const id of session.queue) {
    const log = session.logs[id]
    if (!log) continue
    if (log.status === 'done') completedExercises++
    for (const st of log.sets) {
      totalSets++
      if (st.done) completedSets++
    }
  }

  const setsXp = completedSets * XP_PER_SET
  const exercisesXp = completedExercises * XP_PER_COMPLETED_EXERCISE
  const halfOrMore = totalSets > 0 && completedSets / totalSets >= 0.5
  const finishBonusXp = halfOrMore ? XP_FINISH_BONUS : 0
  const survivalBonusXp = halfOrMore && session.energy === 'low' ? XP_SURVIVAL_BONUS : 0

  return {
    setsXp,
    exercisesXp,
    finishBonusXp,
    survivalBonusXp,
    totalXp: setsXp + exercisesXp + finishBonusXp + survivalBonusXp,
  }
}

/** Soma o XP acumulado de todas as sessões de um perfil. */
export function calculateProfileTotalXp(history: WorkoutSession[], profileId: string): number {
  return history
    .filter((s) => s.profileId === profileId)
    .reduce((sum, s) => sum + calculateSessionXp(s).totalXp, 0)
}

/** XP total necessário para alcançar o nível `level` (Nível 1 = 0 XP, Nível 2 = 200 XP, Nível 3 = 500 XP...). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  const n = level - 1
  return 150 * n + 50 * n * n
}

const LEVEL_TITLES: { minLevel: number; title: string }[] = [
  { minLevel: 15, title: 'Lenda do Ferro' },
  { minLevel: 10, title: 'Máquina de Treino' },
  { minLevel: 6, title: 'Atleta Dedicado' },
  { minLevel: 3, title: 'Frequentador Consistente' },
  { minLevel: 1, title: 'Iniciante Focado' },
]

export interface LevelInfo {
  level: number
  title: string
  totalXp: number
  currentLevelStartXp: number
  nextLevelXp: number
  /** Progresso de 0 a 1 dentro do nível atual */
  progress: number
}

export function levelFromXp(totalXp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(totalXp))
  let level = 1
  while (xpForLevel(level + 1) <= safeXp) {
    level++
  }

  const currentLevelStartXp = xpForLevel(level)
  const nextLevelXp = xpForLevel(level + 1)
  const span = Math.max(1, nextLevelXp - currentLevelStartXp)
  const progress = Math.min(1, Math.max(0, (safeXp - currentLevelStartXp) / span))
  const title = LEVEL_TITLES.find((t) => level >= t.minLevel)?.title ?? 'Iniciante Focado'

  return {
    level,
    title,
    totalXp: safeXp,
    currentLevelStartXp,
    nextLevelXp,
    progress,
  }
}

// ───────────────────────── Ofensiva Semanal ─────────────────────────

/** Retorna a segunda-feira 00:00:00 (horário local) da semana de `date`. */
export function startOfIsoWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay() // 0 = Dom, 1 = Seg ... 6 = Sáb
  const diffToMonday = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diffToMonday)
  d.setHours(0, 0, 0, 0)
  return d
}

export interface WeeklyStreakInfo {
  /** Quantas semanas seguidas batendo a meta (inclui a semana atual se já treinou nela) */
  streakWeeks: number
  /** Quantos treinos concluídos na semana atual */
  thisWeekCount: number
  /** Meta da semana */
  targetDays: number
  /** Dias da semana atual (Segunda=0 .. Domingo=6) com treino concluído */
  weekDaysDone: boolean[]
}

/**
 * Calcula a ofensiva semanal:
 * - Não pune dias de descanso (essenciais na musculação).
 * - Conta semanas consecutivas em que o perfil atingiu `minDaysPerWeek` treinos.
 */
export function calculateWeeklyStreak(
  history: WorkoutSession[],
  profileId: string,
  minDaysPerWeek: number,
  targetDays: number = minDaysPerWeek,
  now: Date = new Date(),
): WeeklyStreakInfo {
  const profileSessions = history.filter((s) => s.profileId === profileId)
  const currentMonday = startOfIsoWeek(now)
  const weekMs = 7 * 24 * 60 * 60 * 1000

  // Mapa: timestamp da segunda-feira -> quantidade de sessões naquela semana
  const countsByWeek = new Map<number, number>()
  const weekDaysDone = [false, false, false, false, false, false, false]

  for (const s of profileSessions) {
    const dt = new Date(s.startedAt)
    const mondayMs = startOfIsoWeek(dt).getTime()
    countsByWeek.set(mondayMs, (countsByWeek.get(mondayMs) ?? 0) + 1)

    if (mondayMs === currentMonday.getTime()) {
      const dow = dt.getDay()
      const idx = dow === 0 ? 6 : dow - 1 // Seg=0 .. Dom=6
      weekDaysDone[idx] = true
    }
  }

  const thisWeekCount = countsByWeek.get(currentMonday.getTime()) ?? 0

  // Conta semanas anteriores consecutivas que bateram a meta mínima
  let pastStreak = 0
  let cursorMs = currentMonday.getTime() - weekMs
  while ((countsByWeek.get(cursorMs) ?? 0) >= minDaysPerWeek) {
    pastStreak++
    cursorMs -= weekMs
  }

  // Se já bateu a meta nesta semana, soma +1; se treinou pelo menos 1x nesta semana e não tinha semana anterior, mostra 1 semana ativa
  const streakWeeks =
    thisWeekCount >= minDaysPerWeek
      ? pastStreak + 1
      : pastStreak > 0
        ? pastStreak
        : thisWeekCount > 0
          ? 1
          : 0

  return {
    streakWeeks,
    thisWeekCount,
    targetDays,
    weekDaysDone,
  }
}

// ───────────────────────── Recordes Pessoais & Sobrecarga Progressiva ─────────────────────────

export interface PersonalRecord {
  exerciseId: string
  newMaxWeightKg: number
  previousMaxWeightKg: number
  estimated1RM: number
}

/**
 * Detecta se a sessão atual bateu recorde de carga máxima em algum exercício
 * quando comparado às sessões anteriores do mesmo perfil.
 */
export function detectPersonalRecords(
  session: WorkoutSession,
  previousHistory: WorkoutSession[],
): PersonalRecord[] {
  const prevSessions = previousHistory.filter(
    (s) => s.profileId === session.profileId && s.id !== session.id,
  )

  // Maior carga histórica anterior por exerciseId
  const prevMaxByEx = new Map<string, number>()
  for (const s of prevSessions) {
    for (const log of Object.values(s.logs)) {
      for (const st of log.sets) {
        if (st.done && st.weightKg > 0) {
          const cur = prevMaxByEx.get(log.exerciseId) ?? 0
          if (st.weightKg > cur) prevMaxByEx.set(log.exerciseId, st.weightKg)
        }
      }
    }
  }

  const records: PersonalRecord[] = []
  for (const id of session.queue) {
    const log = session.logs[id]
    if (!log) continue
    const doneSets = log.sets.filter((st) => st.done && st.weightKg > 0)
    if (doneSets.length === 0) continue

    const bestSet = doneSets.reduce((best, st) =>
      st.weightKg > best.weightKg || (st.weightKg === best.weightKg && st.reps > best.reps)
        ? st
        : best,
    )
    const prevMax = prevMaxByEx.get(log.exerciseId) ?? 0
    if (bestSet.weightKg > prevMax) {
      records.push({
        exerciseId: log.exerciseId,
        newMaxWeightKg: bestSet.weightKg,
        previousMaxWeightKg: prevMax,
        estimated1RM: oneRepMax(bestSet.weightKg, bestSet.reps).value,
      })
    }
  }

  return records
}

/**
 * Sobrecarga progressiva: verifica se na última sessão em que o perfil fez `exerciseId`,
 * todas as séries foram concluídas atingindo pelo menos `repsMax` repetições com carga > 0.
 */
export function shouldSuggestLoadIncrease(
  exerciseId: string,
  history: WorkoutSession[],
  profileId: string,
  repsMax: number,
): { suggest: boolean; lastWeightKg: number } {
  if (repsMax <= 0) return { suggest: false, lastWeightKg: 0 }

  for (const s of history) {
    if (s.profileId !== profileId) continue
    const matchingLog = Object.values(s.logs).find((l) => l.exerciseId === exerciseId)
    if (!matchingLog || matchingLog.sets.length === 0) continue

    const allHitTop = matchingLog.sets.every(
      (st) => st.done && st.weightKg > 0 && st.reps >= repsMax,
    )
    const maxW = Math.max(0, ...matchingLog.sets.map((st) => st.weightKg))
    return { suggest: allHitTop, lastWeightKg: maxW }
  }

  return { suggest: false, lastWeightKg: 0 }
}
