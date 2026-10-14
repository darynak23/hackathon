import { cn } from 'cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  description?: string
}

export interface SegmentedControlProps<T extends string> {
  label: string
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  /** 'cards' gir store knapper med beskrivelse. */
  variant?: 'pills' | 'cards'
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  variant = 'pills',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        variant === 'pills'
          ? 'inline-flex w-fit flex-wrap gap-1 rounded-lg border bg-muted/60 p-1'
          : 'grid gap-2 sm:grid-cols-3',
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50',
              variant === 'pills'
                ? cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium',
                    active
                      ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                : cn(
                    'flex flex-col items-start gap-1 rounded-lg border bg-card p-3 text-left',
                    active
                      ? 'border-amber bg-accent shadow-[inset_0_0_0_1px_var(--amber)]'
                      : 'hover:border-amber/50',
                  ),
            )}
          >
            <span className={cn(variant === 'cards' && 'font-display font-semibold')}>{option.label}</span>
            {variant === 'cards' && option.description && (
              <span className="text-xs leading-snug text-muted-foreground">{option.description}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
