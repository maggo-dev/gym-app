// ===== Tipos de domínio =====

export type Gender = 'male' | 'female'

/** recomposition = hipertrofia + emagrecimento simultâneos */
export type Goal = 'recomposition' | 'hypertrophy' | 'fat_loss' | 'strength'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export interface UserProfile {
  id: string
  name: string
  gender: Gender
  age: number
  weightKg: number
  heightCm: number
  goal: Goal
  experience: ExperienceLevel
  /** Dias que treina hoje */
  daysPerWeek: number
  /** Meta de dias por semana */
  targetDaysPerWeek: number
  /** Duração máxima de uma sessão de treino */
  maxSessionMinutes: number
  /** Cor do avatar (hex) */
  avatarColor: string
}
