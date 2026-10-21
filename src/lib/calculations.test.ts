import { describe, expect, it } from 'vitest'
import { defaultProfiles } from '@/data/profiles'
import {
  activityFactor,
  adjustedWeightKg,
  bmi,
  bmiCategory,
  bmrMifflin,
  calorieTarget,
  estimateSessionMinutes,
  macros,
  oneRepMax,
  tdee,
  trainingLoadFromRM,
  waterLiters,
} from './calculations'

const mateus = defaultProfiles.find((p) => p.id === 'mateus')!
const helen = defaultProfiles.find((p) => p.id === 'helen')!

describe('composição corporal', () => {
  it('IMC dos perfis', () => {
    expect(bmi(mateus.weightKg, mateus.heightCm)).toBeCloseTo(29.7, 1)
    expect(bmi(helen.weightKg, helen.heightCm)).toBeCloseTo(19.9, 1)
  })

  it('categorias da OMS', () => {
    expect(bmiCategory(17)).toBe('underweight')
    expect(bmiCategory(19.9)).toBe('normal')
    expect(bmiCategory(29.7)).toBe('overweight')
    expect(bmiCategory(32)).toBe('obesity1')
    expect(bmiCategory(37)).toBe('obesity2')
    expect(bmiCategory(41)).toBe('obesity3')
  })

  it('peso ajustado só se aplica com IMC ≥ 30', () => {
    expect(adjustedWeightKg(106, 189)).toBe(106)
    // 120 kg / 1,75 m → IMC 39,2 → ideal 76,6 → ajustado ≈ 93,9
    expect(adjustedWeightKg(120, 175)).toBeCloseTo(93.9, 1)
  })
})

describe('gasto energético', () => {
  it('TMB Mifflin-St Jeor', () => {
    expect(bmrMifflin(mateus)).toBeCloseTo(2081.25, 2)
    expect(bmrMifflin(helen)).toBeCloseTo(1189, 2)
  })

  it('fator de atividade por dias', () => {
    expect(activityFactor(0)).toBe(1.2)
    expect(activityFactor(3)).toBe(1.375)
    expect(activityFactor(4)).toBe(1.55)
    expect(activityFactor(6)).toBe(1.725)
  })

  it('GET', () => {
    expect(tdee(mateus)).toBeCloseTo(2862, 0)
    expect(tdee(helen)).toBeCloseTo(1635, 0)
  })

  it('meta calórica respeita o objetivo', () => {
    const mTarget = calorieTarget(mateus)
    expect(mTarget).toBeLessThan(tdee(mateus))
    expect(mTarget).toBeGreaterThanOrEqual(bmrMifflin(mateus))
    expect(mTarget).toBe(2289)

    expect(calorieTarget(helen)).toBe(Math.round(tdee(helen) + 300))
  })

  it('déficit nunca fica abaixo da TMB', () => {
    const sedentary = { ...mateus, goal: 'fat_loss' as const, daysPerWeek: 0 }
    expect(calorieTarget(sedentary)).toBe(Math.round(bmrMifflin(sedentary)))
  })
})

describe('macros', () => {
  it.each([mateus, helen])('soma de macros bate com a meta ($name)', (p) => {
    const m = macros(p)
    expect(Math.abs(m.kcal - calorieTarget(p))).toBeLessThanOrEqual(15)
    expect(m.kcal).toBe(m.proteinG * 4 + m.fatG * 9 + m.carbsG * 4)
  })

  it('valores múltiplos de 5 g', () => {
    const m = macros(mateus)
    for (const g of [m.proteinG, m.fatG, m.carbsG]) expect(g % 5).toBe(0)
    expect(m.proteinG).toBe(190)
    expect(macros(helen).proteinG).toBe(100)
  })
})

describe('hidratação', () => {
  it('35 ml/kg (+500 ml em dia de treino)', () => {
    expect(waterLiters(106)).toBe(3.7)
    expect(waterLiters(106, true)).toBe(4.2)
    expect(waterLiters(51)).toBe(1.8)
    expect(waterLiters(51, true)).toBe(2.3)
  })
})

describe('força', () => {
  it('1RM', () => {
    expect(oneRepMax(100, 1)).toEqual({ value: 100, reliable: true })
    // Epley e Brzycki ≈ 133,3 → arredondado a 0,5 kg
    expect(oneRepMax(100, 10).value).toBe(133.5)
    expect(oneRepMax(50, 15).reliable).toBe(false)
    expect(oneRepMax(0, 5).value).toBe(0)
  })

  it('carga por % do 1RM arredondada a 0,5 kg', () => {
    expect(trainingLoadFromRM(133, 0.75)).toBe(100)
    expect(trainingLoadFromRM(81, 0.7)).toBe(56.5)
  })
})

describe('duração da sessão', () => {
  it('soma aquecimento, execução, descanso e transições', () => {
    // 1 exercício, 3×(40 s) + 2×90 s + 60 s = 360 s = 6 min → 8 + 6 = 14
    expect(estimateSessionMinutes([{ sets: 3, restSec: 90 }])).toBe(14)
    expect(estimateSessionMinutes([])).toBe(8)
  })
})
