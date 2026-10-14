import { useRef } from 'react'
import type { RefObject } from 'react'
import { ChampionCenter } from '@/components/bracket-ui/ChampionCenter'
import { Connectors } from '@/components/bracket-ui/Connectors'
import { MatchCard } from '@/components/bracket-ui/MatchCard'
import { useConnectorLines } from '@/components/bracket-ui/useConnectorLines'
import type { MatchRefMap } from '@/components/bracket-ui/useConnectorLines'
import { useLanguage } from '@/hooks/useLanguage'
import { getChampion } from '@/lib/bracket'
import { roundLabel } from '@/lib/i18n'
import { columnHeight, splitBracket } from '@/lib/layout'
import type { Match, Tournament } from '@/types'

// Eies av person 3. Props er låst, innholdet er det speilvendte treet.

export interface BracketProps {
  tournament: Tournament
  onMatchClick: (match: Match) => void
}

/**
 * Det speilvendte utslagstreet: venstre halvdel fra runde 1 og innover,
 * finalen i midten, høyre halvdel speilvendt.
 */
export function Bracket({ tournament, onMatchClick }: BracketProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const matchRefs = useRef<MatchRefMap>(new Map())
  const { t } = useLanguage()

  const { columns, roundCount, round0CountPerSide } = splitBracket(tournament)
  const lines = useConnectorLines({ containerRef, matchRefs, tournament, columns })

  if (columns.length === 0) {
    return <p className="text-muted-foreground italic">{t.noMatches}</p>
  }

  const champion = getChampion(tournament)

  return (
    <div ref={containerRef} className="relative flex items-start gap-12 overflow-x-auto p-2">
      <Connectors lines={lines} />
      {columns.map((column) => (
        <div key={`${column.side}-${column.round}`} className="flex flex-col items-center">
          <h3 className="mb-3 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {roundLabel(t, column.round, roundCount)}
          </h3>
          <div
            className="flex flex-col justify-around"
            style={{ height: columnHeight(round0CountPerSide) }}
          >
            {column.matches.map((match) => (
              <MatchCard
                key={match.id}
                ref={(el) => registerMatchRef(matchRefs, match.id, el)}
                tournament={tournament}
                match={match}
                onClick={onMatchClick}
              />
            ))}
          </div>
          {column.side === 'final' && <ChampionCenter winner={champion} />}
        </div>
      ))}
    </div>
  )
}

function registerMatchRef(mapRef: RefObject<MatchRefMap>, id: string, el: HTMLDivElement | null) {
  const map = mapRef.current
  if (!map) return
  if (el) map.set(id, el)
  else map.delete(id)
}
