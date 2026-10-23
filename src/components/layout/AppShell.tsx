import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ChevronDown, Flame, Zap } from 'lucide-react'
import { useActiveProfile, useAppStore } from '@/store/useAppStore'
import {
  calculateProfileTotalXp,
  calculateWeeklyStreak,
  levelFromXp,
} from '@/lib/gamification'
import { firstName } from '@/lib/labels'
import { cn } from '@/lib/cn'
import { Avatar } from './Avatar'
import { BottomNav } from './BottomNav'
import { ProfileSwitcher } from './ProfileSwitcher'

export function AppShell() {
  const profile = useActiveProfile()
  const history = useAppStore((s) => s.history)
  const [switcherOpen, setSwitcherOpen] = useState(false)

  const totalXp = calculateProfileTotalXp(history, profile.id)
  const levelInfo = levelFromXp(totalXp)
  const streak = calculateWeeklyStreak(
    history,
    profile.id,
    profile.daysPerWeek,
    profile.targetDaysPerWeek,
  )
  const streakActive = streak.streakWeeks > 0 || streak.thisWeekCount > 0

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col">
      <header className="pt-safe sticky top-0 z-20 bg-base/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-2 px-4">
          <span className="text-lg font-extrabold tracking-tight">
            Gym<span className="text-primary">App</span>
          </span>

          {/* Indicadores rápidos: Ofensiva + Nível */}
          <div className="flex items-center gap-1.5">
            <span
              title="Ofensiva semanal"
              className={cn(
                'num inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-bold',
                streakActive ? 'text-streak' : 'text-muted',
              )}
            >
              <Flame className={cn('size-3.5', streakActive && 'fill-current')} />
              {streak.streakWeeks}
            </span>
            <span
              title={`${levelInfo.title} · ${levelInfo.totalXp} XP`}
              className="num inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-xp"
            >
              <Zap className="size-3.5 fill-current" />
              Nv.{levelInfo.level}
            </span>

            <button
              onClick={() => setSwitcherOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-surface py-1 pl-1 pr-2.5"
              aria-label="Trocar perfil"
            >
              <Avatar profile={profile} />
              <span className="text-sm font-semibold">{firstName(profile.name)}</span>
              <ChevronDown className="size-4 text-muted" />
            </button>
          </div>
        </div>
      </header>

      {/* espaço para a BottomNav fixa */}
      <main className="flex-1 px-4 pb-28 pt-2">
        <Outlet />
      </main>

      <BottomNav />
      <ProfileSwitcher open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </div>
  )
}
