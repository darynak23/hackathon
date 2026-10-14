import { forwardRef } from 'react'
import { cn } from 'cn'
import { getParticipant, isPlayable } from '@/lib/bracket'
import type { Match, Tournament } from '@/types'
import { useLanguage } from '@/hooks/useLanguage'
import { tx } from '@/lib/i18n'

export interface MatchCardProps {
  tournament: Tournament
  match: Match
  onClick?: (match: Match) => void
}

/**
 * Én kamp i treet: to navn (pluss poeng i poengmodus), vinneren uthevet.
 * "Venter" vises når en plass venter på forrige runde, "Walkover" når
 * `match.walkover` er satt.
 */
export const MatchCard = forwardRef<HTMLDivElement, MatchCardProps>(function MatchCard(
  { tournament, match, onClick },
  ref,
) {
  useLanguage()
  const playable = isPlayable(match)
  const clickable = playable && Boolean(onClick)

  return (
    <div
      ref={ref}
      className={cn(
        'w-48 overflow-hidden rounded-lg border bg-card text-sm shadow-sm backdrop-blur-sm',
        clickable &&
          'cursor-pointer transition-all outline-none hover:-translate-y-0.5 hover:border-amber hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50',
        !playable && !match.walkover && 'opacity-70',
      )}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? tx('Åpne resultat for kampen', 'Open the match result') : undefined}
      onClick={clickable ? () => onClick?.(match) : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick?.(match)
              }
            }
          : undefined
      }
    >
      <MatchSlot
        tournament={tournament}
        match={match}
        id={match.participantA}
        score={match.scoreA}
      />
      <div className="h-px bg-border" />
      <MatchSlot
        tournament={tournament}
        match={match}
        id={match.participantB}
        score={match.scoreB}
      />
    </div>
  )
})

interface MatchSlotProps {
  tournament: Tournament
  match: Match
  id: string | null
  score: number | undefined
}

function MatchSlot({ tournament, match, id, score }: MatchSlotProps) {
  const participant = getParticipant(tournament, id)
  const isWinner = match.winnerId !== null && match.winnerId === id
  const isWalkoverWinner = id !== null && match.walkover

  return (
    <div
      className={cn(
        'flex items-center gap-2 border-l-2 border-transparent px-2.5 py-2 text-muted-foreground',
        id === null && 'italic text-muted-foreground/70',
        isWinner && 'border-amber bg-amber/10 font-semibold text-foreground',
      )}
    >
      {participant && tournament.format === 'elimination' && (
        <span className="w-4 text-right font-mono text-[0.65rem] text-muted-foreground/80 tabular-nums">
          {participant.seed}
        </span>
      )}
      <span className="flex-1 truncate">
        {participant ? participant.name : match.walkover ? '–' : tx('Venter', 'Waiting')}
      </span>
      {isWalkoverWinner && (
        <span className="text-[0.65rem] font-semibold tracking-wide text-[var(--amber)] uppercase">
          Walkover
        </span>
      )}
      {tournament.scoring === 'points' && participant && (
        <span className="min-w-[1.4em] text-right tabular-nums">{score ?? '–'}</span>
      )}
    </div>
  )
}
