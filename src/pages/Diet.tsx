import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  Clock,
  Cookie,
  Droplets,
  Flame,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  X,
} from 'lucide-react'
import { Badge, Button, Card, ProgressBar } from '@/components/ui'
import { foodCategoryLabels, foods, getFood } from '@/data/foods'
import { useProfileMetrics } from '@/hooks/useProfileMetrics'
import { cn } from '@/lib/cn'
import {
  calculateEquivalentGrams,
  foodMacrosForGrams,
  formatPortionLabel,
  generateDailyMealPlan,
  getSubstituteOptions,
  sumMealMacros,
} from '@/lib/dietGenerator'
import { fmt } from '@/lib/format'
import { goalLabels } from '@/lib/labels'
import { emptyDietLog, todayDateKey, useActiveProfile, useAppStore } from '@/store/useAppStore'
import type { MealSlotId } from '@/types'

interface SwapTarget {
  mealId: MealSlotId
  slotKey: string
  currentFoodId: string
  currentGrams: number
  baseFoodId: string
  baseGrams: number
}

export function DietPage() {
  const profile = useActiveProfile()
  const metrics = useProfileMetrics()
  const dateKey = todayDateKey()
  const logKey = `${profile.id}:${dateKey}`

  const dietLog = useAppStore((s) => s.dietLogs[logKey]) ?? emptyDietLog(dateKey)
  const toggleMealDone = useAppStore((s) => s.toggleMealDone)
  const addWaterMl = useAppStore((s) => s.addWaterMl)
  const swapMealItem = useAppStore((s) => s.swapMealItem)
  const resetMealSwaps = useAppStore((s) => s.resetMealSwaps)

  const [swapTarget, setSwapTarget] = useState<SwapTarget | null>(null)

  const baseMeals = useMemo(
    () => generateDailyMealPlan(profile, metrics.macros),
    [profile, metrics.macros],
  )

  // Aplica as substituições escolhidas pelo usuário no dia
  const meals = useMemo(
    () =>
      baseMeals.map((m) => ({
        ...m,
        items: m.items.map((it) => {
          const swapped = dietLog.swaps[`${m.id}:${it.slotKey}`]
          return {
            ...it,
            baseFoodId: it.foodId,
            baseGrams: it.grams,
            foodId: swapped ? swapped.foodId : it.foodId,
            grams: swapped ? swapped.grams : it.grams,
            isSwapped: !!swapped,
          }
        }),
      })),
    [baseMeals, dietLog.swaps],
  )

  const plannedTotal = useMemo(
    () => sumMealMacros(meals.flatMap((m) => m.items)),
    [meals],
  )

  const consumedTotal = useMemo(
    () =>
      sumMealMacros(
        meals
          .filter((m) => dietLog.completedMeals.includes(m.id))
          .flatMap((m) => m.items),
      ),
    [meals, dietLog.completedMeals],
  )

  const waterTargetMl = Math.round(metrics.waterLitersTrainingDay * 1000)
  const hasSwaps = Object.keys(dietLog.swaps).length > 0

  const comfortItems = foods.filter((f) => f.category === 'comfort')

  const handleApplyComfort = (comfortFoodId: string) => {
    const snack = baseMeals.find((m) => m.id === 'snack')
    const carbSlot = snack?.items.find((i) => i.slotKey === 'carb')
    if (!carbSlot) return
    const eqGrams = calculateEquivalentGrams(carbSlot.foodId, carbSlot.grams, comfortFoodId)
    swapMealItem(profile.id, dateKey, 'snack', 'carb', comfortFoodId, eqGrams)
  }

  return (
    <motion.div
      key={profile.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {goalLabels[profile.goal]}
          </p>
          <h1 className="text-3xl font-extrabold">Dieta de Hoje</h1>
        </div>
        {hasSwaps && (
          <button
            onClick={() => resetMealSwaps(profile.id, dateKey)}
            className="flex items-center gap-1 rounded-xl bg-surface px-2.5 py-1.5 text-xs font-semibold text-muted active:text-fg"
          >
            <RotateCcw className="size-3.5" /> Restaurar padrão
          </button>
        )}
      </div>

      {/* Resumo Calórico e de Macros do Dia */}
      <Card elevated>
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold">
            <Flame className="size-5 text-streak" /> Calorias das refeições concluídas
          </span>
          <span className="num text-sm font-extrabold text-primary">
            {fmt(consumedTotal.kcal)} / {fmt(plannedTotal.kcal)} kcal
          </span>
        </div>
        <ProgressBar
          value={plannedTotal.kcal > 0 ? consumedTotal.kcal / plannedTotal.kcal : 0}
          color="primary"
        />

        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-surface p-2.5">
            <p className="text-muted">Proteína</p>
            <p className="num mt-0.5 text-sm font-bold text-primary">
              {Math.round(consumedTotal.proteinG)} / {Math.round(plannedTotal.proteinG)} g
            </p>
          </div>
          <div className="rounded-xl bg-surface p-2.5">
            <p className="text-muted">Carboidrato</p>
            <p className="num mt-0.5 text-sm font-bold text-xp">
              {Math.round(consumedTotal.carbsG)} / {Math.round(plannedTotal.carbsG)} g
            </p>
          </div>
          <div className="rounded-xl bg-surface p-2.5">
            <p className="text-muted">Gordura</p>
            <p className="num mt-0.5 text-sm font-bold text-streak">
              {Math.round(consumedTotal.fatG)} / {Math.round(plannedTotal.fatG)} g
            </p>
          </div>
        </div>
      </Card>

      {/* Rastreador de Hidratação */}
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold">
            <Droplets className="size-5 text-sky-400" /> Água de hoje
          </h2>
          <span className="num text-sm font-extrabold text-sky-400">
            {fmt(dietLog.waterMl / 1000, 2)} / {fmt(waterTargetMl / 1000, 1)} L
          </span>
        </div>
        <ProgressBar value={dietLog.waterMl / waterTargetMl} color="primary" />
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => addWaterMl(profile.id, dateKey, -250)}
            className="flex items-center justify-center gap-1 rounded-xl border border-border bg-elevated py-2 text-xs font-bold text-muted active:scale-95"
          >
            <Minus className="size-3.5" /> 250 ml
          </button>
          <button
            type="button"
            onClick={() => addWaterMl(profile.id, dateKey, 250)}
            className="flex items-center justify-center gap-1 rounded-xl border border-sky-400/40 bg-sky-400/15 py-2 text-xs font-bold text-sky-300 active:scale-95"
          >
            <Plus className="size-3.5" /> 250 ml (copo)
          </button>
          <button
            type="button"
            onClick={() => addWaterMl(profile.id, dateKey, 500)}
            className="flex items-center justify-center gap-1 rounded-xl border border-sky-400/40 bg-sky-400/15 py-2 text-xs font-bold text-sky-300 active:scale-95"
          >
            <Plus className="size-3.5" /> 500 ml (garrafa)
          </button>
        </div>
      </Card>

      {/* Lista de Refeições */}
      <div className="flex flex-col gap-3">
        {meals.map((meal) => {
          const done = dietLog.completedMeals.includes(meal.id)
          const mealMacros = sumMealMacros(meal.items)

          return (
            <Card
              key={meal.id}
              className={cn(
                'transition-colors',
                done && 'border-primary/50 bg-primary/5',
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold">{meal.name}</h2>
                    <span className="num flex items-center gap-1 text-xs text-muted">
                      <Clock className="size-3" /> {meal.timeHint}
                    </span>
                  </div>
                  <p className="num text-xs text-muted">
                    {mealMacros.kcal} kcal · {Math.round(mealMacros.proteinG)}g prot ·{' '}
                    {Math.round(mealMacros.carbsG)}g carb · {Math.round(mealMacros.fatG)}g gord
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleMealDone(profile.id, dateKey, meal.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-bold transition-all active:scale-95',
                    done
                      ? 'border-primary bg-primary text-base'
                      : 'border-border bg-elevated text-fg',
                  )}
                >
                  <Check className="size-4" strokeWidth={3} />
                  {done ? 'Feita' : 'Marcar'}
                </button>
              </div>

              <ul className="divide-y divide-border text-sm">
                {meal.items.map((it) => {
                  const food = getFood(it.foodId)
                  const m = foodMacrosForGrams(it.foodId, it.grams)

                  return (
                    <li
                      key={it.slotKey}
                      className="flex items-center justify-between gap-2 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-semibold">{food.name}</span>
                          {it.isSwapped && <Badge tone="xp">Trocado</Badge>}
                        </div>
                        <p className="num text-xs text-muted">
                          {formatPortionLabel(it.foodId, it.grams)} · {m.kcal} kcal
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSwapTarget({
                            mealId: meal.id,
                            slotKey: it.slotKey,
                            currentFoodId: it.foodId,
                            currentGrams: it.grams,
                            baseFoodId: it.baseFoodId,
                            baseGrams: it.baseGrams,
                          })
                        }
                        className="flex shrink-0 items-center gap-1 rounded-xl bg-elevated px-2.5 py-1.5 text-xs font-semibold text-primary active:scale-95"
                      >
                        <RefreshCw className="size-3.5" /> Trocar
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )
        })}
      </div>

      {/* Card: Encaixe Flexível / Conforto Sem Culpa */}
      <Card className="border-xp/40 bg-xp/5">
        <div className="mb-2 flex items-center gap-2">
          <Cookie className="size-5 text-xp" />
          <h2 className="font-bold">Encaixe Flexível (Dia Difícil?)</h2>
        </div>
        <p className="mb-3 text-xs text-muted">
          Sem precisar mudar toda a dieta: se estiver com vontade de um doce ou lanche diferente,
          encaixe uma porção calculada no lugar da aveia do lanche mantendo as calorias do dia!
        </p>
        <div className="flex flex-wrap gap-2">
          {comfortItems.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleApplyComfort(c.id)}
              className="rounded-xl border border-xp/40 bg-surface px-3 py-2 text-xs font-semibold text-xp active:scale-95"
            >
              Encaixar {c.name}
            </button>
          ))}
        </div>
      </Card>

      {/* Bottom Sheet: Calculadora de Equivalência */}
      <AnimatePresence>
        {swapTarget && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSwapTarget(null)}
            />
            <motion.div
              role="dialog"
              aria-label="Substituir alimento por equivalente"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="pb-safe fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[80vh] max-w-[480px] overflow-y-auto rounded-t-3xl border-t border-border bg-surface p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Calculadora de Equivalência ·{' '}
                    {foodCategoryLabels[getFood(swapTarget.baseFoodId).category]}
                  </span>
                  <h2 className="text-lg font-extrabold">
                    Substituir {getFood(swapTarget.currentFoodId).name}
                  </h2>
                </div>
                <button
                  onClick={() => setSwapTarget(null)}
                  className="rounded-full p-1 text-muted"
                  aria-label="Fechar"
                >
                  <X className="size-5" />
                </button>
              </div>

              <p className="mb-3 text-xs text-muted">
                Quantidades calculadas automaticamente para manter os mesmos macros da porção original (
                {swapTarget.baseGrams} g de {getFood(swapTarget.baseFoodId).name}):
              </p>

              <div className="flex flex-col gap-2">
                {getSubstituteOptions(swapTarget.baseFoodId, swapTarget.baseGrams).map((opt) => (
                  <button
                    key={opt.food.id}
                    type="button"
                    onClick={() => {
                      swapMealItem(
                        profile.id,
                        dateKey,
                        swapTarget.mealId,
                        swapTarget.slotKey,
                        opt.food.id,
                        opt.grams,
                      )
                      setSwapTarget(null)
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-elevated p-3 text-left active:bg-surface"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="truncate font-semibold">{opt.food.name}</p>
                      <p className="num text-xs text-muted">
                        {formatPortionLabel(opt.food.id, opt.grams)} · {opt.macros.kcal} kcal
                      </p>
                    </div>
                    <span className="num shrink-0 rounded-xl bg-primary/15 px-2.5 py-1 text-xs font-extrabold text-primary">
                      {opt.grams} g
                    </span>
                  </button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="md"
                fullWidth
                className="mt-3"
                onClick={() => setSwapTarget(null)}
              >
                Cancelar
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
