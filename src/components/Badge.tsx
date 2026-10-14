import type { ReactNode } from 'react'
import { cn } from 'cn'

const TONES = {
  neutral: 'border-border bg-muted text-muted-foreground',
  amber: 'border-amber/30 bg-amber/10 text-amber',
  win: 'border-win/30 bg-win/10 text-win',
  lose: 'border-lose/30 bg-lose/10 text-lose',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: keyof typeof TONES
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
