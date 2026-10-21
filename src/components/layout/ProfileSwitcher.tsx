import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { goalLabels } from '@/lib/labels'
import { cn } from '@/lib/cn'
import { Avatar } from './Avatar'

interface ProfileSwitcherProps {
  open: boolean
  onClose: () => void
}

/** Bottom sheet para alternar entre os perfis. */
export function ProfileSwitcher({ open, onClose }: ProfileSwitcherProps) {
  const profiles = useAppStore((s) => s.profiles)
  const activeId = useAppStore((s) => s.activeProfileId)
  const setActive = useAppStore((s) => s.setActiveProfile)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-label="Trocar perfil"
            className="pb-safe fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] rounded-t-3xl border-t border-border bg-surface p-4"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => info.offset.y > 100 && onClose()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
            <h2 className="mb-3 text-lg font-bold">Quem vai treinar?</h2>
            <ul className="flex flex-col gap-2 pb-4">
              {profiles.map((p) => {
                const active = p.id === activeId
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => {
                        setActive(p.id)
                        onClose()
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors',
                        active ? 'border-primary bg-primary/10' : 'border-border bg-elevated',
                      )}
                    >
                      <Avatar profile={p} size="md" />
                      <span className="flex-1">
                        <span className="block font-semibold">{p.name}</span>
                        <span className="block text-sm text-muted">{goalLabels[p.goal]}</span>
                      </span>
                      {active && <Check className="size-6 text-primary" strokeWidth={3} />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
