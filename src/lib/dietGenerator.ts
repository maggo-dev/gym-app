/**
 * Gerador de plano alimentar diário por macros e calculadora de equivalência (substituição).
 * Funções puras e determinísticas.
 */
import { foods, getFood } from '@/data/foods'
import type { Macros } from '@/lib/calculations'
import type { FoodItem, PlannedMeal, PlannedMealItem, UserProfile } from '@/types'

const round5 = (n: number, min = 10) => Math.max(min, Math.round(n / 5) * 5)

export interface PortionMacros {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
}

/** Calcula os macros de uma porção em gramas de um alimento. */
export function foodMacrosForGrams(foodId: string, grams: number): PortionMacros {
  const food = getFood(foodId)
  const ratio = Math.max(0, grams) / 100
  return {
    kcal: Math.round(food.per100g.kcal * ratio),
    proteinG: Math.round(food.per100g.proteinG * ratio * 10) / 10,
    carbsG: Math.round(food.per100g.carbsG * ratio * 10) / 10,
    fatG: Math.round(food.per100g.fatG * ratio * 10) / 10,
  }
}

/** Formata quantidade em gramas + medida caseira aproximada quando houver. */
export function formatPortionLabel(foodId: string, grams: number): string {
  const food = getFood(foodId)
  if (food.gramsPerUnit && food.unitName) {
    const units = Math.max(0.5, Math.round((grams / food.gramsPerUnit) * 2) / 2)
    return `${grams} g (~${units.toString().replace('.', ',')} ${food.unitName})`
  }
  return `${grams} g (${food.portionHint})`
}

/**
 * Calculadora de substituição por equivalência:
 * - Proteínas igualam os gramas de proteína da porção original.
 * - Carboidratos e frutas igualam os gramas de carboidrato.
 * - Gorduras e itens de conforto igualam as calorias totais.
 */
export function calculateEquivalentGrams(
  fromFoodId: string,
  fromGrams: number,
  toFoodId: string,
): number {
  if (fromFoodId === toFoodId) return fromGrams
  const fromFood = getFood(fromFoodId)
  const toFood = getFood(toFoodId)
  const source = foodMacrosForGrams(fromFoodId, fromGrams)

  if (fromFood.category === 'protein' && toFood.per100g.proteinG >= 5) {
    return round5((source.proteinG / toFood.per100g.proteinG) * 100)
  }
  if (
    (fromFood.category === 'carb' || fromFood.category === 'fruit_veg') &&
    toFood.per100g.carbsG >= 5
  ) {
    return round5((source.carbsG / toFood.per100g.carbsG) * 100)
  }
  // Fallback e gorduras/conforto: equivalência calórica
  return round5((source.kcal / Math.max(1, toFood.per100g.kcal)) * 100, 5)
}

/** Lista alimentos equivalentes da mesma categoria para substituição. */
export function getSubstituteOptions(
  fromFoodId: string,
  fromGrams: number,
): { food: FoodItem; grams: number; macros: PortionMacros }[] {
  const fromFood = getFood(fromFoodId)
  return foods
    .filter((f) => f.category === fromFood.category && f.id !== fromFoodId)
    .map((food) => {
      const grams = calculateEquivalentGrams(fromFoodId, fromGrams, food.id)
      return {
        food,
        grams,
        macros: foodMacrosForGrams(food.id, grams),
      }
    })
}

/** Soma os macros de uma lista de itens planejados. */
export function sumMealMacros(items: PlannedMealItem[]): PortionMacros {
  return items.reduce(
    (acc, it) => {
      const m = foodMacrosForGrams(it.foodId, it.grams)
      return {
        kcal: acc.kcal + m.kcal,
        proteinG: Math.round((acc.proteinG + m.proteinG) * 10) / 10,
        carbsG: Math.round((acc.carbsG + m.carbsG) * 10) / 10,
        fatG: Math.round((acc.fatG + m.fatG) * 10) / 10,
      }
    },
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  )
}

/**
 * Gera um plano de 4 refeições diárias adaptado exatamente aos macros do perfil.
 * Escolhe quantidades de alimentos brasileiros clássicos de forma que a soma diária
 * bata com a meta de calorias e proteínas do atleta.
 */
export function generateDailyMealPlan(
  _profile: UserProfile,
  target: Macros,
): PlannedMeal[] {
  // Distribuição de proteína entre as 4 refeições:
  // Café: ovos · Almoço: frango · Lanche: whey + iogurte · Jantar: patinho
  const eggsGrams = round5(((target.proteinG * 0.18) / getFood('ovo_inteiro').per100g.proteinG) * 100, 50)
  const chickenGrams = round5(
    ((target.proteinG * 0.34) / getFood('frango_grelhado').per100g.proteinG) * 100,
    80,
  )
  const wheyGrams = 30
  const yogurtGrams = 170
  const beefGrams = round5(
    ((target.proteinG * 0.26) / getFood('patinho_moido').per100g.proteinG) * 100,
    80,
  )

  // Gorduras complementares (azeite no almoço/jantar e pasta de amendoim no lanche)
  const oliveOilLunchGrams = 10
  const peanutButterSnackGrams = round5(Math.max(10, (target.fatG - 35) * 0.45), 10)

  // Carboidratos base: pão integral + banana no café, feijão no almoço, aveia no lanche
  const breadGrams = round5(((target.carbsG * 0.16) / getFood('pao_integral').per100g.carbsG) * 100, 25)
  const bananaGrams = 70
  const beansGrams = round5(((target.carbsG * 0.12) / getFood('feijao_carioca').per100g.carbsG) * 100, 80)
  const oatsSnackGrams = round5(
    ((target.carbsG * 0.12) / getFood('aveia_flocos').per100g.carbsG) * 100,
    15,
  )

  // Calcula as calorias restantes para distribuir no arroz do almoço (55%) e do jantar (45%)
  const fixedItems: PlannedMealItem[] = [
    { slotKey: 'b1', foodId: 'ovo_inteiro', grams: eggsGrams },
    { slotKey: 'b2', foodId: 'pao_integral', grams: breadGrams },
    { slotKey: 'b3', foodId: 'banana_prata', grams: bananaGrams },
    { slotKey: 'l1', foodId: 'frango_grelhado', grams: chickenGrams },
    { slotKey: 'l3', foodId: 'feijao_carioca', grams: beansGrams },
    { slotKey: 'l4', foodId: 'azeite_oliva', grams: oliveOilLunchGrams },
    { slotKey: 's1', foodId: 'iogurte_natural', grams: yogurtGrams },
    { slotKey: 's2', foodId: 'whey_protein', grams: wheyGrams },
    { slotKey: 's3', foodId: 'aveia_flocos', grams: oatsSnackGrams },
    { slotKey: 's4', foodId: 'pasta_amendoim', grams: peanutButterSnackGrams },
    { slotKey: 'd1', foodId: 'patinho_moido', grams: beefGrams },
  ]

  const fixedSum = sumMealMacros(fixedItems)
  const remainingKcal = Math.max(160, target.kcal - fixedSum.kcal)
  const riceKcalPer100 = getFood('arroz_branco').per100g.kcal
  const riceLunchGrams = round5(((remainingKcal * 0.55) / riceKcalPer100) * 100, 60)
  const dinnerRiceGrams = round5(((remainingKcal * 0.45) / riceKcalPer100) * 100, 60)

  return [
    {
      id: 'breakfast',
      name: 'Café da Manhã',
      timeHint: '07:30',
      items: [
        { slotKey: 'prot', foodId: 'ovo_inteiro', grams: eggsGrams },
        { slotKey: 'carb', foodId: 'pao_integral', grams: breadGrams },
        { slotKey: 'fruit', foodId: 'banana_prata', grams: bananaGrams },
      ],
    },
    {
      id: 'lunch',
      name: 'Almoço',
      timeHint: '12:30',
      items: [
        { slotKey: 'prot', foodId: 'frango_grelhado', grams: chickenGrams },
        { slotKey: 'carb1', foodId: 'arroz_branco', grams: riceLunchGrams },
        { slotKey: 'carb2', foodId: 'feijao_carioca', grams: beansGrams },
        { slotKey: 'fat', foodId: 'azeite_oliva', grams: oliveOilLunchGrams },
      ],
    },
    {
      id: 'snack',
      name: 'Lanche / Pré-Treino',
      timeHint: '16:30',
      items: [
        { slotKey: 'base', foodId: 'iogurte_natural', grams: yogurtGrams },
        { slotKey: 'prot', foodId: 'whey_protein', grams: wheyGrams },
        { slotKey: 'carb', foodId: 'aveia_flocos', grams: oatsSnackGrams },
        { slotKey: 'fat', foodId: 'pasta_amendoim', grams: peanutButterSnackGrams },
      ],
    },
    {
      id: 'dinner',
      name: 'Jantar / Pós-Treino',
      timeHint: '20:30',
      items: [
        { slotKey: 'prot', foodId: 'patinho_moido', grams: beefGrams },
        { slotKey: 'carb', foodId: 'arroz_branco', grams: dinnerRiceGrams },
      ],
    },
  ]
}
