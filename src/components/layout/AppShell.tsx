import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useActiveProfile } from '@/store/useAppStore'
import { firstName } from '@/lib/labels'
import { Avatar } from './Avatar'
import { BottomNav } from './BottomNav'
import { ProfileSwitcher } from './ProfileSwitcher'

export function AppShell() {
  const profile = useActiveProfile()
  const [switcherOpen, setSwitcherOpen] = useState(false)

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col">
      <header className="pt-safe sticky top-0 z-20 bg-base/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <span className="text-lg font-extrabold tracking-tight">
            Gym<span className="text-primary">App</span>
          </span>
          <button
            onClick={() => setSwitcherOpen(true)}
            className="flex items-center gap-2 rounded-full bg-surface py-1 pl-1 pr-3"
            aria-label="Trocar perfil"
          >
            <Avatar profile={profile} />
            <span className="text-sm font-semibold">{firstName(profile.name)}</span>
            <ChevronDown className="size-4 text-muted" />
          </button>
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
