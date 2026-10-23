import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { defaultProfiles } from '@/data/profiles'
import { GENERATOR_VERSION, generatePlan } from '@/lib/workoutGenerator'
import type { UserProfile, WorkoutPlan } from '@/types'

export const STORE_KEY = 'gymapp:v1'
export const STORE_VERSION = 2

export interface AppState {
  profiles: UserProfile[]
  activeProfileId: string
  /** ficha salva por perfil */
  plans: Record<string, WorkoutPlan>
  /** índice do próximo dia da ficha (A=0, B=1...) por perfil */
  nextDayIndex: Record<string, number>

  setActiveProfile: (id: string) => void
  ensurePlan: (profileId: string) => WorkoutPlan
  regeneratePlan: (profileId: string, daysPerWeek?: number) => WorkoutPlan
  setNextDay: (profileId: string, index: number) => void
}

type PersistedState = Pick<AppState, 'activeProfileId' | 'plans' | 'nextDayIndex'>

const isPlanValid = (plan: WorkoutPlan | undefined, profile: UserProfile) =>
  !!plan && plan.generatorVersion === GENERATOR_VERSION && plan.daysPerWeek === profile.daysPerWeek

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profiles: defaultProfiles,
      activeProfileId: defaultProfiles[0].id,
      plans: {},
      nextDayIndex: {},

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
      }),
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<PersistedState>
        if (version < 2) {
          // v1 → v2: adiciona fichas e rotação de dias
          return {
            activeProfileId: state.activeProfileId ?? defaultProfiles[0].id,
            plans: {},
            nextDayIndex: {},
          }
        }
        return state as PersistedState
      },
    },
  ),
)

/** Perfil ativo (sempre definido). */
export const useActiveProfile = () =>
  useAppStore((s) => s.profiles.find((p) => p.id === s.activeProfileId) ?? s.profiles[0])

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
