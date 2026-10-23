import { describe, expect, it } from 'vitest'
import { defaultProfiles } from '@/data/profiles'
import { getExercise } from '@/data/exercises'
import { generatePlan, weeklySetsByMuscle } from './workoutGenerator'

const mateus = defaultProfiles.find((p) => p.id === 'mateus')!
const helen = defaultProfiles.find((p) => p.id === 'helen')!

describe('generatePlan', () => {
  it.each([mateus, helen])('$name: ABC com 3 dias dentro do tempo máximo', (p) => {
    const plan = generatePlan(p)
    expect(plan.days.map((d) => d.id)).toEqual(['A', 'B', 'C'])
    for (const d of plan.days) {
      expect(d.estimatedMinutes).toBeLessThanOrEqual(p.maxSessionMinutes)
      expect(d.exercises.length).toBeGreaterThanOrEqual(5)
    }
  })

  it.each([mateus, helen])('$name: cada dia tem 1–3 starters compostos no início', (p) => {
    for (const d of generatePlan(p).days) {
      const starters = d.exercises.filter((e) => e.isStarter)
      expect(starters.length).toBeGreaterThanOrEqual(1)
      expect(starters.length).toBeLessThanOrEqual(3)
      starters.forEach((e) => expect(getExercise(e.exerciseId).kind).toBe('compound'))
    }
  })

  it('compostos vêm antes dos isolados', () => {
    for (const d of generatePlan(helen).days) {
      const kinds = d.exercises.map((e) => getExercise(e.exerciseId).kind)
      const lastCompound = kinds.lastIndexOf('compound')
      const firstIso = kinds.indexOf('isolation')
      if (firstIso >= 0) expect(lastCompound).toBeLessThan(firstIso)
    }
  })

  it.each([mateus, helen])('$name: volume semanal de peito/costas/quadríceps entre 8 e 18', (p) => {
    const v = weeklySetsByMuscle(generatePlan(p))
    for (const m of ['chest', 'back', 'quads'] as const) {
      expect(v[m]).toBeGreaterThanOrEqual(8)
      expect(v[m]).toBeLessThanOrEqual(18)
    }
  })

  it('Helen (ênfase em glúteos) tem mais séries de glúteo que Mateus', () => {
    const h = weeklySetsByMuscle(generatePlan(helen)).glutes ?? 0
    const m = weeklySetsByMuscle(generatePlan(mateus)).glutes ?? 0
    expect(h).toBeGreaterThan(m)
  })

  it('Mateus (recomposição) recebe cardio no fim; Helen não', () => {
    const lastIds = (p: typeof mateus) =>
      generatePlan(p).days.map((d) => getExercise(d.exercises.at(-1)!.exerciseId).kind)
    expect(lastIds(mateus).every((k) => k === 'cardio')).toBe(true)
    expect(lastIds(helen).some((k) => k === 'cardio')).toBe(false)
  })

  it('plano de 4 dias gera ABCD', () => {
    const plan = generatePlan(mateus, 4)
    expect(plan.days.map((d) => d.id)).toEqual(['A', 'B', 'C', 'D'])
    plan.days.forEach((d) => expect(d.estimatedMinutes).toBeLessThanOrEqual(80))
  })

  it('corta exercícios quando o tempo é curto (cardio primeiro, nunca compostos)', () => {
    const full = generatePlan(mateus)
    const short = generatePlan({ ...mateus, maxSessionMinutes: 40 })
    short.days.forEach((d, i) => {
      expect(d.estimatedMinutes).toBeLessThanOrEqual(40)
      expect(d.exercises.some((e) => getExercise(e.exerciseId).kind === 'cardio')).toBe(false)
      const compounds = (x: typeof d) => x.exercises.filter((e) => getExercise(e.exerciseId).kind === 'compound').length
      expect(compounds(d)).toBe(compounds(full.days[i]))
    })
  })

  it('é determinístico', () => {
    const a = generatePlan(helen)
    const b = generatePlan(helen)
    expect(a.days).toEqual(b.days)
  })
})
