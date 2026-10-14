import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bracket } from '@/components/Bracket'
import { ResultDialog } from '@/components/ResultDialog'
import { Button } from '@/components/ui/button'
import { useTournaments } from '@/hooks/useTournaments'
import { clearResult, createTournament, findMatch, getChampion, setResult } from '@/lib/bracket'
import { downloadJson } from '@/lib/download'
import { exportTournamentsJson } from '@/lib/storage'
import { sportLabel, type Tournament } from '@/types'

function resetTournament(t: Tournament): Tournament {
  const fresh = createTournament({
    name: t.name,
    sport: t.sport,
    customSport: t.customSport,
    scoring: t.scoring,
    participantKind: t.participantKind,
    format: t.format,
    participants: t.participants.map(({ name, members }) => ({ name, members })),
  })
  return { ...fresh, id: t.id, createdAt: t.createdAt }
}

export function TournamentPage() {
  const { id } = useParams()
  const { tournaments, save } = useTournaments()
  const [openMatchId, setOpenMatchId] = useState<string | null>(null)

  const tournament = tournaments.find((t) => t.id === id)

  if (!tournament) {
    return (
      <main className="grid gap-4">
        <h1 className="brand-title">Fant ikke turneringen</h1>
        <Button asChild variant="outline" className="w-fit">
          <Link to="/">Tilbake til forsiden</Link>
        </Button>
      </main>
    )
  }

  const openMatch = openMatchId ? (findMatch(tournament, openMatchId) ?? null) : null
  const champion = getChampion(tournament)

  return (
    <main className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="brand-title !mb-1">{tournament.name}</h1>
          <p className="text-muted-foreground">
            {sportLabel(tournament)} · {tournament.participants.length} deltakere ·{' '}
            {tournament.scoring === 'points' ? 'Poeng' : 'Vinner/taper'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              downloadJson(`${tournament.name}.json`, exportTournamentsJson([tournament]))
            }
          >
            Eksporter
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (window.confirm('Nullstille alle resultater? Deltakerne beholdes.')) {
                save(resetTournament(tournament))
              }
            }}
          >
            Nullstill turnering
          </Button>
        </div>
      </header>

      {champion && (
        <p className="text-lg">
          Vinner: <strong className="text-[var(--amber)]">{champion.name}</strong>
        </p>
      )}

      <Bracket tournament={tournament} onMatchClick={(m) => setOpenMatchId(m.id)} />

      <ResultDialog
        tournament={tournament}
        match={openMatch}
        onClose={() => setOpenMatchId(null)}
        onSave={(result) => {
          if (!openMatch) return
          save(setResult(tournament, openMatch.id, result))
          setOpenMatchId(null)
        }}
        onClear={() => {
          if (!openMatch) return
          save(clearResult(tournament, openMatch.id))
          setOpenMatchId(null)
        }}
      />
    </main>
  )
}
