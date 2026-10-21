import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { defaultProfiles } from '@/data/profiles'
import type { UserProfile } from '@/types'

export const STORE_KEY = 'gymapp:v1'
export const STORE_VERSION = 1

export interface AppState {
  profiles: UserProfile[]
  activeProfileId: string
  setActiveProfile: (id: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profiles: defaultProfiles,
      activeProfileId: defaultProfiles[0].id,
      setActiveProfile: (id) => {
        if (get().profiles.some((p) => p.id === id)) set({ activeProfileId: id })
      },
    }),
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Perfis são fixos na V1: só persistimos a escolha do perfil ativo.
      partialize: (state) => ({ activeProfileId: state.activeProfileId }),
      // Ponto de entrada para migrações futuras (v1 -> v2 ...)
      migrate: (persisted, version) => {
        if (version < STORE_VERSION) {
          // nenhuma migração necessária ainda
        }
        return persisted as Pick<AppState, 'activeProfileId'>
      },
    },
  ),
)

/** Perfil ativo (sempre definido). */
export const useActiveProfile = () =>
  useAppStore((s) => s.profiles.find((p) => p.id === s.activeProfileId) ?? s.profiles[0])
