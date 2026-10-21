import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui'

interface PlaceholderProps {
  title: string
  icon: LucideIcon
  description: string
}

/** Página provisória enquanto a etapa correspondente não é implementada. */
export function PagePlaceholder({ title, icon: Icon, description }: PlaceholderProps) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <Icon className="size-12 text-primary" />
        <p className="max-w-[28ch] text-muted">{description}</p>
      </Card>
    </div>
  )
}
