import { describe, expect, it } from 'vitest'
import { defaultProfiles } from '@/data/profiles'
import { macros } from '@/lib/calculations'
import {
  calculateEquivalentGrams,
  foodMacrosForGrams,
  generateDailyMealPlan,
  sumMealMacros,
} from './dietGenerator'

const mateus = defaultProfiles[0]
const helen = defaultProfiles[1]

describe('dietGenerator', () => {
  it.each([mateus, helen])(
    '$name: plano diário bate a ±5% da meta calórica do perfil',
    (profile) => {
      const target = macros(profile)
      const meals = generateDailyMealPlan(profile, target)
      expect(meals).toHaveLength(4)

      const allItems = meals.flatMap((m) => m.items)
      const total = sumMealMacros(allItems)
      expect(Math.abs(total.kcal - target.kcal) / target.kcal).toBeLessThanOrEqual(0.05)
    },
  )

  it('substituição de carboidratos (Arroz -> Batata-doce ou Macarrão) mantém carboidratos equivalentes', () => {
    const orig = foodMacrosForGrams('arroz_branco', 150)
    const sweetPotatoGrams = calculateEquivalentGrams('arroz_branco', 150, 'batata_doce')
    const swapped = foodMacrosForGrams('batata_doce', sweetPotatoGrams)

    expect(Math.abs(swapped.carbsG - orig.carbsG)).toBeLessThanOrEqual(3)
  })

  it('substituição de proteínas (Frango -> Tilápia ou Patinho) mantém proteína equivalente', () => {
    const orig = foodMacrosForGrams('frango_grelhado', 150)
    const tilapiaGrams = calculateEquivalentGrams('frango_grelhado', 150, 'tilapia_grelhada')
    const swapped = foodMacrosForGrams('tilapia_grelhada', tilapiaGrams)

    expect(Math.abs(swapped.proteinG - orig.proteinG)).toBeLessThanOrEqual(3)
  })
})
