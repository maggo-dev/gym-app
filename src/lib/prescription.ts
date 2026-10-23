/**
 * Prescrição de séries/reps/descanso por objetivo e tipo de exercício.
 *
 * Faixas baseadas nas recomendações do ACSM (2009) e em revisões de
 * Schoenfeld et al. (2017, 2021): hipertrofia ocorre numa ampla faixa de reps
 * (6–15+) quando próximo da falha; compostos se beneficiam de descansos maiores
 * (≥ 2 min) e força pede cargas altas (3–6 reps) com 3 min de descanso.
 */
import type { ExerciseKind, Goal } from '@/types'

export interface Prescription {
  sets: number
  repsMin: number
  repsMax: number
  restSec: number
  durationSec?: number
}

type StrengthKind = Exclude<ExerciseKind, 'cardio'>

const TABLE: Record<Goal, Record<StrengthKind, Prescription>> = {
  hypertrophy: {
    compound: { sets: 3, repsMin: 6, repsMax: 10, restSec: 120 },
    isolation: { sets: 3, repsMin: 10, repsMax: 15, restSec: 75 },
  },
  recomposition: {
    compound: { sets: 3, repsMin: 6, repsMax: 10, restSec: 105 },
    isolation: { sets: 3, repsMin: 10, repsMax: 15, restSec: 60 },
  },
  fat_loss: {
    compound: { sets: 3, repsMin: 8, repsMax: 12, restSec: 90 },
    isolation: { sets: 2, repsMin: 12, repsMax: 15, restSec: 45 },
  },
  strength: {
    compound: { sets: 4, repsMin: 3, repsMax: 6, restSec: 180 },
    isolation: { sets: 3, repsMin: 8, repsMax: 12, restSec: 90 },
  },
}

/** Cardio leve (LISS) ao final do treino */
export const CARDIO_MINUTES = 12

export function prescribe(goal: Goal, kind: ExerciseKind): Prescription {
  if (kind === 'cardio') {
    return { sets: 1, repsMin: 0, repsMax: 0, restSec: 0, durationSec: CARDIO_MINUTES * 60 }
  }
  return { ...TABLE[goal][kind] }
}
