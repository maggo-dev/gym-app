import type { UserProfile } from '@/types'

/** Perfis fixos da V1. */
export const defaultProfiles: UserProfile[] = [
  {
    id: 'mateus',
    name: 'Mateus Gomes',
    gender: 'male',
    age: 33,
    weightKg: 106,
    heightCm: 189,
    goal: 'recomposition',
    experience: 'intermediate',
    daysPerWeek: 3,
    targetDaysPerWeek: 4,
    maxSessionMinutes: 80,
    avatarColor: '#22C55E',
  },
  {
    id: 'helen',
    name: 'Helen Gomes',
    gender: 'female',
    age: 32,
    weightKg: 51,
    heightCm: 160,
    goal: 'hypertrophy',
    experience: 'intermediate',
    daysPerWeek: 3,
    targetDaysPerWeek: 4,
    maxSessionMinutes: 80,
    avatarColor: '#F97316',
  },
]
