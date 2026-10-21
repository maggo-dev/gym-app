import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-base font-bold shadow-[0_4px_0_0_var(--color-primary-strong)] active:translate-y-[4px] active:shadow-none',
  secondary: 'bg-elevated text-fg border border-border active:bg-surface',
  ghost: 'bg-transparent text-muted active:bg-elevated',
  danger:
    'bg-danger text-white font-bold shadow-[0_4px_0_0_#b91c1c] active:translate-y-[4px] active:shadow-none',
}

const sizes: Record<Size, string> = {
  md: 'min-h-12 px-4 text-sm',
  // Alvo grande para uso com a mão suada na academia
  lg: 'min-h-14 px-6 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'lg', fullWidth, className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold uppercase tracking-wide transition-all disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
