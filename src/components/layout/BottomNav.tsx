import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Dumbbell, Home, User, Utensils, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

const tabs: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/treino', label: 'Treino', icon: Dumbbell },
  { to: '/dieta', label: 'Dieta', icon: Utensils },
  { to: '/perfil', label: 'Perfil', icon: User },
]

export function BottomNav() {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur">
      <ul className="mx-auto grid max-w-[480px] grid-cols-4">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className="relative flex h-16 flex-col items-center justify-center gap-1"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute inset-x-4 top-1.5 bottom-1.5 rounded-2xl bg-primary/15"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon
                    className={cn('relative size-6', isActive ? 'text-primary' : 'text-muted')}
                    strokeWidth={isActive ? 2.6 : 2}
                  />
                  <span
                    className={cn(
                      'relative text-[11px] font-semibold',
                      isActive ? 'text-primary' : 'text-muted',
                    )}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
