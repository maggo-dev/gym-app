import type { ExperienceLevel, Gender, Goal } from '@/types'

export const goalLabels: Record<Goal, string> = {
  recomposition: 'Hipertrofia + Emagrecimento',
  hypertrophy: 'Ganho de massa',
  fat_loss: 'Emagrecimento',
  strength: 'Força',
}

export const genderLabels: Record<Gender, string> = {
  male: 'Masculino',
  female: 'Feminino',
}

export const experienceLabels: Record<ExperienceLevel, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
}

export const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] ?? fullName

export const initials = (fullName: string) =>
  fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')

export const formatHeight = (cm: number) => `${(cm / 100).toFixed(2).replace('.', ',')} m`
