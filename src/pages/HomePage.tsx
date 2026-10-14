import { useRef, useState } from 'react'
import { ArrowRight, Download, Sparkles, Trash2, Trophy, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/ui/button'
import { useTournaments } from '@/hooks/useTournaments'
import { createDemoTournaments } from '@/lib/demo'
import { downloadJson } from '@/lib/download'
import { exportTournamentsJson } from '@/lib/storage'
import { getWinner, statusLabel } from '@/lib/tournament'
import { FORMATS, formatLabel, sportLabel, type TournamentFormat } from '@/types'
import { useLanguage } from '@/hooks/useLanguage'
import { plural, tx } from '@/lib/i18n'

function formatDescription(format: TournamentFormat): string {
  switch (format) {
    case 'elimination':
      return tx(
        'Taperen er ute. Seedene møtes tidligst i finalen, midt i treet.',
        'The loser is out. The top seeds meet in the final at the earliest, in the middle of the bracket.',
      )
    case 'swiss':
      return tx('Alle spiller flere runder mot noen med samme stilling.', 'Everyone plays several rounds against opponents with the same record.')
    case 'swissThenElimination':
      return tx('Swiss-fase først, så går de beste til utslagstreet.', 'A Swiss stage first, then the best go on to the knockout bracket.')
  }
}

export function HomePage() {
  useLanguage()
  const { tournaments, saveMany, remove, importJson } = useTournaments()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleImport(file: File) {
    try {
      const count = importJson(await file.text())
      setMessage(
        tx(
          `Importerte ${count} ${plural(count, ['turnering', 'turneringer'], ['tournament', 'tournaments'])}.`,
          `Imported ${count} ${plural(count, ['turnering', 'turneringer'], ['tournament', 'tournaments'])}.`,
        ),
      )
    } catch (err) {
      setMessage(err instanceof Error ? err.message : tx('Kunne ikke importere filen', 'Could not import the file'))
    }
  }

  const sorted = [...tournaments].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <main className="grid gap-12">
      <section className="brand grid gap-8">
        <div className="grid gap-3">
          <p className="text-sm font-semibold tracking-[0.14em] text-amber uppercase">{tx('Turneringer for hele firmaet', 'Tournaments for the whole company')}</p>
          <h1 className="max-w-3xl font-display text-4xl leading-[0.95] font-bold tracking-tight sm:text-6xl">
            {tx('Basket, sjakk eller noe helt annet.', 'Basketball, chess or something else entirely.')}
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            {tx(
              'Velg et oppsett for å starte. Seeding eller tilfeldig trekning velger du i neste steg.',
              'Pick a setup to start. You choose seeding or a random draw in the next step.',
            )}
          </p>
        </div>
        <div className="setup-actions" role="group" aria-label={tx('Velg format', 'Choose format')}>
          {FORMATS.map((format) => (
            <Link key={format} to={`/ny?format=${format}`} className="setup-btn group">
              <span className="setup-btn-label flex w-full items-center justify-between">
                {formatLabel(format)}
                <ArrowRight className="size-5 text-amber opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
              <span className="setup-btn-desc">{formatDescription(format)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">{tx('Dine turneringer', 'Your tournaments')}</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => saveMany(createDemoTournaments())}>
              <Sparkles /> {tx('Fyll inn demo', 'Load demo')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={tournaments.length === 0}
              onClick={() => downloadJson('turneringer.json', exportTournamentsJson(tournaments))}
            >
              <Download /> {tx('Eksporter', 'Export')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
              <Upload /> {tx('Importer', 'Import')}
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleImport(file)
                e.target.value = ''
              }}
            />
          </div>
        </div>

        {message && (
          <p role="status" className="text-sm text-muted-foreground">
            {message}
          </p>
        )}

        {sorted.length === 0 ? (
          <div className="grid place-items-center gap-3 rounded-2xl border border-dashed bg-card/40 p-12 text-center">
            <Trophy className="size-10 text-amber" />
            <p className="font-display text-lg font-semibold">{tx('Ingen turneringer ennå', 'No tournaments yet')}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {tx(
                'Velg et format over, eller trykk «Fyll inn demo» for å se hvordan det ser ut.',
                'Pick a format above, or press “Load demo” to see what it looks like.',
              )}
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((t) => {
              const winner = getWinner(t)
              return (
                <li key={t.id}>
                  <article className="group relative flex h-full flex-col gap-4 rounded-2xl border bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-amber/60 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid gap-1.5">
                        <h3 className="font-display text-lg leading-tight font-semibold">
                          <Link to={`/turnering/${t.id}`} className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50">
                            {t.name}
                          </Link>
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge tone="amber">{sportLabel(t)}</Badge>
                          <Badge>{formatLabel(t.format)}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="relative z-10 -mt-1 -mr-2 text-muted-foreground hover:text-destructive"
                        aria-label={tx(`Slett ${t.name}`, `Delete ${t.name}`)}
                        onClick={() => {
                          if (window.confirm(tx(`Slette «${t.name}»? Dette kan ikke angres.`, `Delete “${t.name}”? This cannot be undone.`))) remove(t.id)
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3 text-sm">
                      <span className="text-muted-foreground">
                        {t.participants.length} {t.participantKind === 'team' ? tx('lag', 'teams') : tx('deltakere', 'participants')}
                      </span>
                      {winner ? (
                        <span className="flex items-center gap-1.5 font-semibold text-amber">
                          <Trophy className="size-4" /> {winner.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{statusLabel(t)}</span>
                      )}
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
