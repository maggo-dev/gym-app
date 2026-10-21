import { useMemo } from 'react'
import { useActiveProfile } from '@/store/useAppStore'
import {
  bmi,
  bmiCategory,
  bmrMifflin,
  calorieTarget,
  macros,
  tdee,
  waterLiters,
  type BmiCategory,
  type Macros,
} from '@/lib/calculations'

export interface ProfileMetrics {
  bmi: number
  bmiCategory: BmiCategory
  bmr: number
  tdee: number
  calorieTarget: number
  /** meta − GET (negativo = déficit) */
  calorieDelta: number
  macros: Macros
  waterLiters: number
  waterLitersTrainingDay: number
}

/** Todos os indicadores do perfil ativo, memoizados. */
export function useProfileMetrics(): ProfileMetrics {
  const p = useActiveProfile()

  return useMemo(() => {
    const bmiValue = bmi(p.weightKg, p.heightCm)
    const tdeeValue = Math.round(tdee(p))
    const target = calorieTarget(p)
    return {
      bmi: bmiValue,
      bmiCategory: bmiCategory(bmiValue),
      bmr: Math.round(bmrMifflin(p)),
      tdee: tdeeValue,
      calorieTarget: target,
      calorieDelta: target - tdeeValue,
      macros: macros(p),
      waterLiters: waterLiters(p.weightKg),
      waterLitersTrainingDay: waterLiters(p.weightKg, true),
    }
  }, [p])
}
