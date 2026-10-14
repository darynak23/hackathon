import { useState } from 'react'
import { ArrowLeft, ArrowRight, Download, Play, RotateCcw, Trophy } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/Badge'
import { Bracket } from '@/components/Bracket'
import { ChampionCenter } from '@/components/bracket-ui/ChampionCenter'
import { ExportImageButton } from '@/components/ExportImageButton'
import { ResultDialog } from '@/components/ResultDialog'
import { StandingsTable } from '@/components/swiss/StandingsTable'
import { SwissView } from '@/components/swiss/SwissView'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTournaments } from '@/hooks/useTournaments'
import { downloadJson } from '@/lib/download'
import { exportTournamentsJson } from '@/lib/storage'
import { isMatchDone } from '@/lib/swiss'
import * as T from '@/lib/tournament'
import { formatLabel, seedingLabel, sportLabel, type Match, type Tournament } from '@/types'
import { useLanguage } from '@/hooks/useLanguage'
import { tx, plural } from '@/lib/i18n'

export function TournamentPage() {
  useLanguage()
  const { id } = useParams()
  const { tournaments, save } = useTournaments()
  const [openMatchId, setOpenMatchId] = useState<string | null>(null)
  const [phaseTab, setPhaseTab] = useState<T.Phase | null>(null)
  const [error, setError] = useState<string | null>(null)

  const tournament = tournaments.find((t) => t.id === id)

  if (!tournament) {
    return (
      <main className="grid place-items-center gap-4 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold">{tx('Fant ikke turneringen', 'Tournament not found')}</h1>
        <p className="text-muted-foreground">
          {tx('Den kan ha blitt slettet, eller lenken er feil.', 'It may have been deleted, or the link is wrong.')}
        </p>
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft /> {tx('Til forsiden', 'Back to home')}
          </Link>
        </Button>
      </main>
    )
  }

  const openMatch = openMatchId ? (T.findMatch(tournament, openMatchId) ?? null) : null
  const winner = T.getWinner(tournament)
  const activeTab = phaseTab ?? T.currentPhase(tournament)

  function update(next: Tournament) {
    setError(null)
    save(next)
  }

  function attempt(action: () => Tournament) {
    try {
      update(action())
      setOpenMatchId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : tx('Noe gikk galt', 'Something went wrong'))
    }
  }

  const swissPanel = tournament.swiss && (
    <SwissPanel
      tournament={tournament}
      onMatchClick={(m) => setOpenMatchId(m.id)}
      onNextRound={() => update(T.startNextSwissRound(tournament))}
      onStartPlayoffs={() => {
        update(T.startPlayoffs(tournament))
        setPhaseTab('playoffs')
      }}
    />
  )

  const playoffPanel =
    tournament.rounds.length > 0 ? (
      <div className="rounded-2xl border bg-card/40 p-4 shadow-sm backdrop-blur-sm sm:p-6">
        <Bracket tournament={tournament} onMatchClick={(m) => setOpenMatchId(m.id)} />
      </div>
    ) : (
      <div className="grid place-items-center gap-2 rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
        <Trophy className="size-8 text-amber" />
        <p>{tx('Sluttspillet starter når Swiss-fasen er ferdig.', 'The playoffs start when the Swiss stage is finished.')}</p>
        <p className="text-sm">
          {tx(`De ${tournament.advanceCount} beste seedes inn i treet.`, `The top ${tournament.advanceCount} are seeded into the bracket.`)}
        </p>
      </div>
    )

  return (
    <main className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <header className="grid gap-4 md:flex md:items-end md:justify-between">
        <div className="grid gap-2">
          <Link to="/" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> {tx('Alle turneringer', 'All tournaments')}
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{tournament.name}</h1>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="amber">{sportLabel(tournament)}</Badge>
            <Badge>{formatLabel(tournament.format)}</Badge>
            <Badge>{seedingLabel(tournament.seedingMode)}</Badge>
            <Badge>{tournament.scoring === 'points' ? tx('Poeng', 'Points') : tx('Vinner/taper', 'Win/loss')}</Badge>
            <Badge>
              {tournament.participants.length}{' '}
              {tournament.participantKind === 'team' ? tx('lag', 'teams') : tx('deltakere', 'participants')}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportImageButton tournament={tournament} onError={setError} />
          <Button
            variant="outline"
            onClick={() => downloadJson(`${tournament.name}.json`, exportTournamentsJson([tournament]))}
          >
            <Download /> JSON
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (window.confirm(
                  tx(
                    'Nullstille alle resultater? Deltakerne og seedene beholdes.',
                    'Reset all results? The participants and seeds are kept.',
                  ),
                )) {
                update(T.restartTournament(tournament))
                setPhaseTab(null)
              }
            }}
          >
            <RotateCcw /> {tx('Nullstill turnering', 'Reset tournament')}
          </Button>
        </div>
      </header>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {winner && tournament.format === 'swiss' && (
        <div className="rounded-2xl border border-amber/40 bg-accent p-4">
          <ChampionCenter winner={winner} />
        </div>
      )}

      {tournament.format === 'swissThenElimination' ? (
        <Tabs value={activeTab} onValueChange={(v) => setPhaseTab(v as T.Phase)} className="gap-4">
          <TabsList>
            <TabsTrigger value="swiss">{tx('1. Swiss-fase', '1. Swiss stage')}</TabsTrigger>
            <TabsTrigger value="playoffs">{tx('2. Sluttspill', '2. Playoffs')}</TabsTrigger>
          </TabsList>
          <TabsContent value="swiss">{swissPanel}</TabsContent>
          <TabsContent value="playoffs">{playoffPanel}</TabsContent>
        </Tabs>
      ) : tournament.format === 'swiss' ? (
        swissPanel
      ) : (
        playoffPanel
      )}

      <ResultDialog
        tournament={tournament}
        match={openMatch}
        onClose={() => setOpenMatchId(null)}
        onSave={(result) => openMatch && attempt(() => T.recordResult(tournament, openMatch.id, result))}
        onClear={() => openMatch && attempt(() => T.removeResult(tournament, openMatch.id))}
      />
    </main>
  )
}

function SwissPanel({
  tournament,
  onMatchClick,
  onNextRound,
  onStartPlayoffs,
}: {
  tournament: Tournament
  onMatchClick: (m: Match) => void
  onNextRound: () => void
  onStartPlayoffs: () => void
}) {
  useLanguage()
  const stage = tournament.swiss!
  const current = stage.rounds.at(-1) ?? []
  const remaining = current.filter((m) => !isMatchDone(m)).length
  const done = T.swissDone(tournament)
  const playoffsStarted = tournament.rounds.length > 0

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/80 px-4 py-3 shadow-sm backdrop-blur-sm">
        <div className="text-sm">
          <p className="font-semibold">
            {done
              ? tx('Swiss-fasen er ferdig', 'The Swiss stage is finished')
              : remaining > 0
                ? tx(
                    `Runde ${stage.rounds.length}: ${remaining} ${plural(remaining, ['kamp', 'kamper'], ['match', 'matches'])} igjen`,
                    `Round ${stage.rounds.length}: ${remaining} ${plural(remaining, ['kamp', 'kamper'], ['match', 'matches'])} left`,
                  )
                : tx(`Runde ${stage.rounds.length} er ferdig`, `Round ${stage.rounds.length} is finished`)}
          </p>
          <p className="text-muted-foreground">
            {tx(
              `${stage.config.winsToAdvance} seire for å gå videre, ${stage.config.lossesToEliminate} tap og man er ute.`,
              `${stage.config.winsToAdvance} wins to advance, ${stage.config.lossesToEliminate} losses and you are out.`,
            )}
            {playoffsStarted &&
              tx(' Sluttspillet er i gang, så Swiss-resultatene er låst.', ' The playoffs have started, so the Swiss results are locked.')}
          </p>
        </div>
        <div className="flex gap-2">
          {!done && (
            <Button onClick={onNextRound} disabled={!T.canStartNextSwissRound(tournament)}>
              <Play /> {tx('Start neste runde', 'Start next round')}
            </Button>
          )}
          {tournament.format === 'swissThenElimination' && done && !playoffsStarted && (
            <Button onClick={onStartPlayoffs}>
              {tx('Gå til sluttspill', 'Go to the playoffs')} <ArrowRight />
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="rounds" className="gap-4">
        <TabsList>
          <TabsTrigger value="rounds">{tx('Runder', 'Rounds')}</TabsTrigger>
          <TabsTrigger value="table">{tx('Tabell', 'Table')}</TabsTrigger>
        </TabsList>
        <TabsContent value="rounds">
          <SwissView tournament={tournament} onMatchClick={onMatchClick} />
        </TabsContent>
        <TabsContent value="table">
          <StandingsTable tournament={tournament} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
