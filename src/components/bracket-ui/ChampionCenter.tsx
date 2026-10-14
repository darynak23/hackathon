import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import type { Participant } from '@/types'
import { useLanguage } from '@/hooks/useLanguage'
import { tx } from '@/lib/i18n'

export interface ChampionCenterProps {
  winner: Participant | null
  /** Av når treet tegnes for bildeeksport. */
  celebrate?: boolean
}

/** Pokal og vinnernavn i midten av treet, med konfetti når finalen er avgjort. */
export function ChampionCenter({ winner, celebrate = true }: ChampionCenterProps) {
  useLanguage()
  const ref = useRef<HTMLDivElement>(null)
  const celebratedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!celebrate) return
    if (!winner) {
      celebratedFor.current = null
      return
    }
    // fyr konfetti bare én gang per nye vinner, ikke på hver re-render
    if (celebratedFor.current === winner.id) return
    celebratedFor.current = winner.id

    const origin = ref.current?.getBoundingClientRect()
    const x = origin ? (origin.left + origin.width / 2) / window.innerWidth : 0.5
    const y = origin ? (origin.top + origin.height / 2) / window.innerHeight : 0.4

    confetti({
      particleCount: 140,
      spread: 80,
      startVelocity: 38,
      origin: { x, y },
      colors: ['#e8a838', '#f2f6f3', '#6f8479'],
    })
  }, [winner, celebrate])

  return (
    <div ref={ref} className="flex min-w-36 flex-col items-center gap-1 p-2 text-center">
      <span aria-hidden="true" className="text-3xl leading-none">
        🏆
      </span>
      {winner ? (
        <span className="font-[var(--font-display)] font-semibold text-[var(--amber)]">
          {winner.name}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground italic">{tx('Ingen vinner ennå', 'No winner yet')}</span>
      )}
    </div>
  )
}
