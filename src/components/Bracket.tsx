import { getParticipant, isPlayable } from '@/lib/bracket'
import { roundName } from '@/lib/layout'
import type { Match, Tournament } from '@/types'

// Eies av person 3. Props er låst, innholdet byttes ut med det speilvendte treet.

export interface BracketProps {
  tournament: Tournament
  onMatchClick: (match: Match) => void
}

export function Bracket({ tournament, onMatchClick }: BracketProps) {
  const total = tournament.rounds.length
  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {tournament.rounds.map((round, r) => (
        <div key={r} className="flex min-w-48 flex-col justify-around gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground">{roundName(r, total)}</h3>
          {round.map((match) => {
            const a = getParticipant(tournament, match.participantA)
            const b = getParticipant(tournament, match.participantB)
            const playable = isPlayable(match)
            return (
              <button
                key={match.id}
                type="button"
                disabled={!playable}
                onClick={() => onMatchClick(match)}
                className="rounded-md border bg-card p-2 text-left text-sm enabled:hover:border-ring disabled:opacity-60"
              >
                {[
                  { p: a, score: match.scoreA, id: match.participantA },
                  { p: b, score: match.scoreB, id: match.participantB },
                ].map((side, i) => (
                  <div
                    key={i}
                    className={`flex justify-between ${
                      side.id && side.id === match.winnerId ? 'font-bold' : ''
                    }`}
                  >
                    <span>{side.p?.name ?? (match.isWalkover ? 'Walkover' : 'Venter')}</span>
                    {tournament.scoring === 'points' && side.score !== null && <span>{side.score}</span>}
                  </div>
                ))}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
