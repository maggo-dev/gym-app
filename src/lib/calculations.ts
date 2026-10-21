/**
 * Cálculos fisiológicos e de treino — funções puras, sem React.
 *
 * Todas as fórmulas são estimativas populacionais. Servem para orientar,
 * não substituem avaliação profissional.
 */
import type { Gender, Goal, UserProfile } from '@/types'

type BodyData = Pick<UserProfile, 'gender' | 'age' | 'weightKg' | 'heightCm'>
type GoalData = BodyData & Pick<UserProfile, 'goal' | 'daysPerWeek'>

const round = (n: number, step = 1) => Math.round(n / step) * step

// ───────────────────────── Composição corporal ─────────────────────────

/** IMC = peso (kg) / altura (m)². */
export function bmi(weightKg: number, heightCm: number): number {
  const h = heightCm / 100
  return weightKg / (h * h)
}

export type BmiCategory =
  | 'underweight'
  | 'normal'
  | 'overweight'
  | 'obesity1'
  | 'obesity2'
  | 'obesity3'

/** Classificação da OMS. */
export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return 'underweight'
  if (value < 25) return 'normal'
  if (value < 30) return 'overweight'
  if (value < 35) return 'obesity1'
  if (value < 40) return 'obesity2'
  return 'obesity3'
}

export const bmiCategoryLabels: Record<BmiCategory, string> = {
  underweight: 'Abaixo do peso',
  normal: 'Normal',
  overweight: 'Sobrepeso',
  obesity1: 'Obesidade grau I',
  obesity2: 'Obesidade grau II',
  obesity3: 'Obesidade grau III',
}

/**
 * Peso ajustado para cálculo de proteína em pessoas com IMC ≥ 30:
 * ideal (IMC 25) + 40% do excedente. Evita superestimar a proteína.
 */
export function adjustedWeightKg(weightKg: number, heightCm: number): number {
  if (bmi(weightKg, heightCm) < 30) return weightKg
  const h = heightCm / 100
  const ideal = 25 * h * h
  return ideal + 0.4 * (weightKg - ideal)
}

// ───────────────────────── Gasto energético ─────────────────────────

/**
 * TMB (Taxa Metabólica Basal) — Mifflin-St Jeor (1990):
 * 10·peso + 6,25·altura − 5·idade + s, onde s = +5 (homem) ou −161 (mulher).
 */
export function bmrMifflin({ gender, age, weightKg, heightCm }: BodyData): number {
  const s = gender === 'male' ? 5 : -161
  return 10 * weightKg + 6.25 * heightCm - 5 * age + s
}

/** Fator de atividade (Harris-Benedict/Katch-McArdle) a partir dos dias de treino. */
export function activityFactor(daysPerWeek: number): number {
  if (daysPerWeek <= 1) return 1.2
  if (daysPerWeek <= 3) return 1.375
  if (daysPerWeek <= 5) return 1.55
  return 1.725
}

/** GET (Gasto Energético Total) = TMB × fator de atividade. */
export function tdee(profile: BodyData & Pick<UserProfile, 'daysPerWeek'>): number {
  return bmrMifflin(profile) * activityFactor(profile.daysPerWeek)
}

/**
 * Meta calórica diária por objetivo:
 * - recomposition: −20% do GET (nunca abaixo da TMB)
 * - fat_loss: −25% do GET (nunca abaixo da TMB)
 * - hypertrophy: GET + 300 kcal
 * - strength: GET + 200 kcal
 */
export function calorieTarget(profile: GoalData): number {
  const bmr = bmrMifflin(profile)
  const get = tdee(profile)
  const byGoal: Record<Goal, number> = {
    recomposition: Math.max(get * 0.8, bmr),
    fat_loss: Math.max(get * 0.75, bmr),
    hypertrophy: get + 300,
    strength: get + 200,
  }
  return Math.round(byGoal[profile.goal])
}

// ───────────────────────── Macronutrientes ─────────────────────────

const PROTEIN_G_PER_KG: Record<Goal, number> = {
  recomposition: 1.8,
  hypertrophy: 2.0,
  fat_loss: 2.2,
  strength: 1.8,
}

const FAT_G_PER_KG: Record<Gender, number> = { male: 0.8, female: 1.0 }

export interface Macros {
  proteinG: number
  fatG: number
  carbsG: number
  /** kcal resultantes dos macros arredondados (4/9/4) */
  kcal: number
}

/**
 * Divisão de macros: proteína e gordura por kg; carboidrato completa as calorias.
 * Valores arredondados a 5 g.
 */
export function macros(profile: GoalData): Macros {
  const target = calorieTarget(profile)
  const proteinBase = adjustedWeightKg(profile.weightKg, profile.heightCm)
  const proteinG = round(proteinBase * PROTEIN_G_PER_KG[profile.goal], 5)
  const fatG = round(profile.weightKg * FAT_G_PER_KG[profile.gender], 5)
  const carbsG = Math.max(0, round((target - proteinG * 4 - fatG * 9) / 4, 5))
  return { proteinG, fatG, carbsG, kcal: proteinG * 4 + fatG * 9 + carbsG * 4 }
}

// ───────────────────────── Hidratação ─────────────────────────

/** Água diária: 35 ml/kg, +500 ml em dia de treino. Retorna litros com 1 casa. */
export function waterLiters(weightKg: number, trainingDay = false): number {
  const ml = weightKg * 35 + (trainingDay ? 500 : 0)
  return Math.round(ml / 100) / 10
}

// ───────────────────────── Força ─────────────────────────

export interface OneRepMax {
  value: number
  /** false quando reps > 12 (fórmulas perdem precisão) */
  reliable: boolean
}

/**
 * 1RM estimado — média de Epley (w·(1 + r/30)) e Brzycki (w·36/(37 − r)).
 * Acima de 12 reps usa apenas Epley e marca como pouco confiável.
 */
export function oneRepMax(weight: number, reps: number): OneRepMax {
  if (weight <= 0 || reps <= 0) return { value: 0, reliable: false }
  if (reps === 1) return { value: weight, reliable: true }
  const epley = weight * (1 + reps / 30)
  if (reps > 12) return { value: round(epley, 0.5), reliable: false }
  const brzycki = (weight * 36) / (37 - reps)
  return { value: round((epley + brzycki) / 2, 0.5), reliable: true }
}

/** Carga de trabalho a partir de % do 1RM, arredondada a 0,5 kg. */
export function trainingLoadFromRM(oneRM: number, pctRM: number): number {
  return round(oneRM * pctRM, 0.5)
}

// ───────────────────────── Duração da sessão ─────────────────────────

export interface SessionExerciseEstimate {
  sets: number
  restSec: number
  /** tempo de execução por série (padrão 40 s) */
  secPerSet?: number
}

export const WARMUP_MIN = 8
/** tempo para trocar de aparelho/ajustar carga entre exercícios */
export const TRANSITION_SEC = 60

/**
 * Duração estimada (min): aquecimento + Σ séries·(execução + descanso) + transições.
 * O descanso após a última série de cada exercício é substituído pela transição.
 */
export function estimateSessionMinutes(exercises: SessionExerciseEstimate[]): number {
  const seconds = exercises.reduce((acc, { sets, restSec, secPerSet = 40 }) => {
    if (sets <= 0) return acc
    return acc + sets * secPerSet + (sets - 1) * restSec + TRANSITION_SEC
  }, 0)
  return Math.round(WARMUP_MIN + seconds / 60)
}
