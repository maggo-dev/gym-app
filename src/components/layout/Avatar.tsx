import { cn } from '@/lib/cn'
import { initials } from '@/lib/labels'
import type { UserProfile } from '@/types'

interface AvatarProps {
  profile: Pick<UserProfile, 'name' | 'avatarColor'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 'size-9 text-sm', md: 'size-12 text-base', lg: 'size-16 text-xl' }

export function Avatar({ profile, size = 'sm', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold text-base',
        sizes[size],
        className,
      )}
      style={{ backgroundColor: profile.avatarColor }}
      aria-hidden
    >
      {initials(profile.name)}
    </span>
  )
}
