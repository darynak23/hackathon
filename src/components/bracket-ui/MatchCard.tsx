import { forwardRef } from 'react'
import { cn } from 'cn'
import { getParticipant, isPlayable } from '@/lib/bracket'
import type { Match, Tournament } from '@/types'

export interface MatchCardProps {
  tournament: Tournament
  match: Match
  onClick?: (match: Match) => void
}

/**
 * Én kamp i treet: to navn (pluss poeng i poengmodus), vinneren uthevet.
 * "Venter" vises når en plass venter på forrige runde, "Walkover" når
 * `match.isWalkover` er satt.
 */
export const MatchCard = forwardRef<HTMLDivElement, MatchCardProps>(function MatchCard(
  { tournament, match, onClick },
  ref,
) {
  const playable = isPlayable(match)
  const clickable = playable && Boolean(onClick)

  return (
    <div
      ref={ref}
      className={cn(
        'w-44 overflow-hidden rounded-md border bg-card text-sm',
        clickable && 'cursor-pointer transition-colors hover:border-[var(--amber)]',
      )}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? 'Åpne resultat for kampen' : undefined}
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
  score: number | null
}

function MatchSlot({ tournament, match, id, score }: MatchSlotProps) {
  const participant = getParticipant(tournament, id)
  const isWinner = match.winnerId !== null && match.winnerId === id
  const isWalkoverWinner = id !== null && match.isWalkover

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2.5 py-2 text-muted-foreground',
        id === null && 'italic text-muted-foreground/70',
        isWinner && 'font-bold text-foreground',
      )}
    >
      <span className="flex-1 truncate">
        {participant ? participant.name : match.isWalkover ? '–' : 'Venter'}
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
