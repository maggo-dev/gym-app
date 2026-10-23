import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { defaultProfiles } from '@/data/profiles'
import { GENERATOR_VERSION, generatePlan } from '@/lib/workoutGenerator'
import type {
  BodyWeightEntry,
  DailyDietLog,
  MealSlotId,
  UserProfile,
  WorkoutPlan,
  WorkoutSession,
} from '@/types'

export const STORE_KEY = 'gymapp:v1'
export const STORE_VERSION = 5

export function todayDateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function emptyDietLog(dateKey: string): DailyDietLog {
  return {
    dateKey,
    completedMeals: [],
    waterMl: 0,
    swaps: {},
  }
}

export interface AppState {
  profiles: UserProfile[]
  activeProfileId: string
  /** ficha salva por perfil */
  plans: Record<string, WorkoutPlan>
  /** índice do próximo dia da ficha (A=0, B=1...) por perfil */
  nextDayIndex: Record<string, number>
  /** histórico de sessões finalizadas */
  history: WorkoutSession[]
  /** registros diários de dieta e água: chave = `${profileId}:${dateKey}` */
  dietLogs: Record<string, DailyDietLog>
  /** evolução de peso corporal por perfil */
  weightLogs: Record<string, BodyWeightEntry[]>

  setActiveProfile: (id: string) => void
  ensurePlan: (profileId: string) => WorkoutPlan
  regeneratePlan: (profileId: string, daysPerWeek?: number) => WorkoutPlan
  setNextDay: (profileId: string, index: number) => void
  recordSession: (session: WorkoutSession) => void

  toggleMealDone: (profileId: string, dateKey: string, mealId: MealSlotId) => void
  addWaterMl: (profileId: string, dateKey: string, deltaMl: number) => void
  swapMealItem: (
    profileId: string,
    dateKey: string,
    mealId: MealSlotId,
    slotKey: string,
    foodId: string,
    grams: number,
  ) => void
  resetMealSwaps: (profileId: string, dateKey: string) => void

  logBodyWeight: (profileId: string, weightKg: number, dateKey?: string) => void
  exportBackupJson: () => string
  importBackupJson: (jsonStr: string) => { ok: boolean; error?: string }
}

type PersistedState = Pick<
  AppState,
  'activeProfileId' | 'plans' | 'nextDayIndex' | 'history' | 'dietLogs' | 'weightLogs'
>

const isPlanValid = (plan: WorkoutPlan | undefined, profile: UserProfile) =>
  !!plan && plan.generatorVersion === GENERATOR_VERSION && plan.daysPerWeek === profile.daysPerWeek

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profiles: defaultProfiles,
      activeProfileId: defaultProfiles[0].id,
      plans: {},
      nextDayIndex: {},
      history: [],
      dietLogs: {},
      weightLogs: {},

      setActiveProfile: (id) => {
        if (get().profiles.some((p) => p.id === id)) set({ activeProfileId: id })
      },

      ensurePlan: (profileId) => {
        const profile = get().profiles.find((p) => p.id === profileId)
        if (!profile) throw new Error(`Perfil desconhecido: ${profileId}`)
        const current = get().plans[profileId]
        if (isPlanValid(current, profile)) return current
        return get().regeneratePlan(profileId)
      },

      regeneratePlan: (profileId, daysPerWeek) => {
        const profile = get().profiles.find((p) => p.id === profileId)
        if (!profile) throw new Error(`Perfil desconhecido: ${profileId}`)
        const plan = generatePlan(profile, daysPerWeek)
        set((s) => ({
          plans: { ...s.plans, [profileId]: plan },
          nextDayIndex: {
            ...s.nextDayIndex,
            [profileId]: (s.nextDayIndex[profileId] ?? 0) % plan.days.length,
          },
        }))
        return plan
      },

      setNextDay: (profileId, index) =>
        set((s) => {
          const len = s.plans[profileId]?.days.length ?? 1
          return { nextDayIndex: { ...s.nextDayIndex, [profileId]: ((index % len) + len) % len } }
        }),

      recordSession: (session) =>
        set((s) => {
          const plan = s.plans[session.profileId]
          const len = plan?.days.length ?? 3
          const dayIdx = plan ? plan.days.findIndex((d) => d.id === session.dayId) : -1
          const currentIdx = dayIdx >= 0 ? dayIdx : (s.nextDayIndex[session.profileId] ?? 0)
          return {
            history: [session, ...s.history],
            nextDayIndex: {
              ...s.nextDayIndex,
              [session.profileId]: (currentIdx + 1) % len,
            },
          }
        }),

      toggleMealDone: (profileId, dateKey, mealId) =>
        set((s) => {
          const key = `${profileId}:${dateKey}`
          const current = s.dietLogs[key] ?? emptyDietLog(dateKey)
          const exists = current.completedMeals.includes(mealId)
          const completedMeals = exists
            ? current.completedMeals.filter((id) => id !== mealId)
            : [...current.completedMeals, mealId]
          return {
            dietLogs: {
              ...s.dietLogs,
              [key]: { ...current, completedMeals },
            },
          }
        }),

      addWaterMl: (profileId, dateKey, deltaMl) =>
        set((s) => {
          const key = `${profileId}:${dateKey}`
          const current = s.dietLogs[key] ?? emptyDietLog(dateKey)
          return {
            dietLogs: {
              ...s.dietLogs,
              [key]: {
                ...current,
                waterMl: Math.max(0, current.waterMl + deltaMl),
              },
            },
          }
        }),

      swapMealItem: (profileId, dateKey, mealId, slotKey, foodId, grams) =>
        set((s) => {
          const key = `${profileId}:${dateKey}`
          const current = s.dietLogs[key] ?? emptyDietLog(dateKey)
          return {
            dietLogs: {
              ...s.dietLogs,
              [key]: {
                ...current,
                swaps: {
                  ...current.swaps,
                  [`${mealId}:${slotKey}`]: { foodId, grams },
                },
              },
            },
          }
        }),

      resetMealSwaps: (profileId, dateKey) =>
        set((s) => {
          const key = `${profileId}:${dateKey}`
          const current = s.dietLogs[key]
          if (!current) return s
          return {
            dietLogs: {
              ...s.dietLogs,
              [key]: { ...current, swaps: {} },
            },
          }
        }),

      logBodyWeight: (profileId, weightKg, dateKey = todayDateKey()) =>
        set((s) => {
          if (weightKg <= 20 || weightKg >= 300) return s
          const rounded = Math.round(weightKg * 10) / 10
          const list = [...(s.weightLogs[profileId] ?? [])]
          const existingIdx = list.findIndex((e) => e.dateKey === dateKey)
          if (existingIdx >= 0) {
            list[existingIdx] = { dateKey, weightKg: rounded }
          } else {
            list.push({ dateKey, weightKg: rounded })
          }
          list.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
          return {
            weightLogs: {
              ...s.weightLogs,
              [profileId]: list,
            },
          }
        }),

      exportBackupJson: () => {
        const s = get()
        return JSON.stringify(
          {
            app: 'gym-app',
            version: STORE_VERSION,
            exportedAt: new Date().toISOString(),
            data: {
              activeProfileId: s.activeProfileId,
              plans: s.plans,
              nextDayIndex: s.nextDayIndex,
              history: s.history,
              dietLogs: s.dietLogs,
              weightLogs: s.weightLogs,
            },
          },
          null,
          2,
        )
      },

      importBackupJson: (jsonStr) => {
        try {
          const parsed = JSON.parse(jsonStr)
          const d = parsed?.data
          if (!d || typeof d !== 'object') {
            return { ok: false, error: 'Formato de arquivo inválido.' }
          }
          set({
            activeProfileId:
              typeof d.activeProfileId === 'string' ? d.activeProfileId : defaultProfiles[0].id,
            plans: d.plans && typeof d.plans === 'object' ? d.plans : {},
            nextDayIndex: d.nextDayIndex && typeof d.nextDayIndex === 'object' ? d.nextDayIndex : {},
            history: Array.isArray(d.history) ? d.history : [],
            dietLogs: d.dietLogs && typeof d.dietLogs === 'object' ? d.dietLogs : {},
            weightLogs: d.weightLogs && typeof d.weightLogs === 'object' ? d.weightLogs : {},
          })
          return { ok: true }
        } catch {
          return { ok: false, error: 'Não foi possível ler o JSON de backup.' }
        }
      },
    }),
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Perfis são fixos no código: não persistimos.
      partialize: (s): PersistedState => ({
        activeProfileId: s.activeProfileId,
        plans: s.plans,
        nextDayIndex: s.nextDayIndex,
        history: s.history,
        dietLogs: s.dietLogs,
        weightLogs: s.weightLogs,
      }),
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<PersistedState>
        return {
          activeProfileId: state.activeProfileId ?? defaultProfiles[0].id,
          plans: version >= 2 ? (state.plans ?? {}) : {},
          nextDayIndex: version >= 2 ? (state.nextDayIndex ?? {}) : {},
          history: version >= 3 ? (state.history ?? []) : [],
          dietLogs: version >= 4 ? (state.dietLogs ?? {}) : {},
          weightLogs: version >= 5 ? (state.weightLogs ?? {}) : {},
        }
      },
    },
  ),
)

/**
 * Perfil ativo (sempre definido).
 * Se o usuário já registrou um peso corporal recente, atualiza dinamicamente o `weightKg`
 * para que IMC, calorias, macros e água acompanhem a evolução real!
 */
export function useActiveProfile(): UserProfile {
  const base = useAppStore(
    (s) => s.profiles.find((p) => p.id === s.activeProfileId) ?? s.profiles[0],
  )
  const weights = useAppStore((s) => s.weightLogs[base.id])
  const latestWeight = weights && weights.length > 0 ? weights[weights.length - 1].weightKg : null

  return useMemo(
    () => (latestWeight ? { ...base, weightKg: latestWeight } : base),
    [base, latestWeight],
  )
}

/**
 * Ficha do perfil ativo. Se não existir (ou estiver desatualizada),
 * gera na hora para exibir e persiste após o render.
 */
export function useActivePlan(): WorkoutPlan {
  const profile = useActiveProfile()
  const stored = useAppStore((s) => s.plans[profile.id])
  const ensurePlan = useAppStore((s) => s.ensurePlan)
  const valid = isPlanValid(stored, profile)

  const fallback = useMemo(() => (valid ? null : generatePlan(profile)), [valid, profile])

  useEffect(() => {
    if (!valid) ensurePlan(profile.id)
  }, [valid, profile.id, ensurePlan])

  return valid ? stored! : fallback!
}

/** Próximo treino do perfil ativo. */
export function useNextWorkoutDay() {
  const profile = useActiveProfile()
  const plan = useActivePlan()
  const index = useAppStore((s) => s.nextDayIndex[profile.id] ?? 0) % plan.days.length
  return { plan, day: plan.days[index], index }
}

/** Busca a última carga usada por exercício nas sessões anteriores do perfil. */
export function getLastWeightsForProfile(
  history: WorkoutSession[],
  profileId: string,
): Record<string, number> {
  const map: Record<string, number> = {}
  for (const session of history) {
    if (session.profileId !== profileId) continue
    for (const log of Object.values(session.logs)) {
      if (map[log.exerciseId] !== undefined) continue
      const doneWeights = log.sets.filter((st) => st.done && st.weightKg > 0).map((st) => st.weightKg)
      if (doneWeights.length > 0) {
        map[log.exerciseId] = Math.max(...doneWeights)
      }
    }
  }
  return map
}
