// ===== Tipos de domínio =====

export type Gender = 'male' | 'female'

/** recomposition = hipertrofia + emagrecimento simultâneos */
export type Goal = 'recomposition' | 'hypertrophy' | 'fat_loss' | 'strength'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

/** Ênfase extra na montagem da ficha */
export type Emphasis = 'balanced' | 'glutes_legs' | 'upper'

export interface UserProfile {
  id: string
  name: string
  gender: Gender
  age: number
  weightKg: number
  heightCm: number
  goal: Goal
  experience: ExperienceLevel
  emphasis: Emphasis
  /** Dias que treina hoje */
  daysPerWeek: number
  /** Meta de dias por semana */
  targetDaysPerWeek: number
  /** Duração máxima de uma sessão de treino */
  maxSessionMinutes: number
  /** Cor do avatar (hex) */
  avatarColor: string
}

// ===== Exercícios =====

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'
  | 'cardio'

export type MovementPattern =
  | 'h_push'
  | 'v_push'
  | 'h_pull'
  | 'v_pull'
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'isolation'
  | 'cardio'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'smith'
  | 'cardio_machine'

export type ExerciseKind = 'compound' | 'isolation' | 'cardio'

export interface Exercise {
  id: string
  name: string
  primary: MuscleGroup
  secondary: MuscleGroup[]
  pattern: MovementPattern
  kind: ExerciseKind
  equipment: Equipment
  /** ids de exercícios que podem substituí-lo (mesmo músculo primário) */
  equivalents: string[]
  /** dicas de execução */
  cues: string[]
}

// ===== Fichas =====

export type WorkoutDayId = 'A' | 'B' | 'C' | 'D'

export interface PlannedExercise {
  exerciseId: string
  sets: number
  repsMin: number
  repsMax: number
  restSec: number
  /** duração fixa (cardio), em segundos */
  durationSec?: number
  /** bom exercício para começar o treino */
  isStarter: boolean
}

export interface WorkoutDay {
  id: WorkoutDayId
  name: string
  focus: string
  exercises: PlannedExercise[]
  estimatedMinutes: number
}

export interface WorkoutPlan {
  profileId: string
  daysPerWeek: number
  days: WorkoutDay[]
  /** muda quando a lógica do gerador muda → força regeneração */
  generatorVersion: number
  generatedAt: string
}
