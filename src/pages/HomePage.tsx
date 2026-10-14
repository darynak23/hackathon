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
import { FORMAT_LABELS, sportLabel, type TournamentFormat } from '@/types'

const FORMATS: { id: TournamentFormat; label: string; description: string }[] = [
  { id: 'elimination', label: 'Utslag', description: 'Taperen er ute. Seedene møtes tidligst i finalen, midt i treet.' },
  { id: 'swiss', label: 'Swiss', description: 'Alle spiller flere runder mot noen med samme stilling.' },
  { id: 'swissThenElimination', label: 'Swiss + sluttspill', description: 'Swiss-fase først, så går de beste til utslagstreet.' },
]

export function HomePage() {
  const { tournaments, saveMany, remove, importJson } = useTournaments()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleImport(file: File) {
    try {
      const count = importJson(await file.text())
      setMessage(`Importerte ${count} turnering${count === 1 ? '' : 'er'}.`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Kunne ikke importere filen')
    }
  }

  const sorted = [...tournaments].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <main className="grid gap-12">
      <section className="brand grid gap-8">
        <div className="grid gap-3">
          <p className="text-sm font-semibold tracking-[0.14em] text-amber uppercase">Turneringer for hele firmaet</p>
          <h1 className="max-w-3xl font-display text-4xl leading-[0.95] font-bold tracking-tight sm:text-6xl">
            Basket, sjakk eller noe helt annet.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Velg et oppsett for å starte. Seeding eller tilfeldig trekning velger du i neste steg.
          </p>
        </div>
        <div className="setup-actions" role="group" aria-label="Velg format">
          {FORMATS.map((format) => (
            <Link key={format.id} to={`/ny?format=${format.id}`} className="setup-btn group">
              <span className="setup-btn-label flex w-full items-center justify-between">
                {format.label}
                <ArrowRight className="size-5 text-amber opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
              <span className="setup-btn-desc">{format.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">Dine turneringer</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => saveMany(createDemoTournaments())}>
              <Sparkles /> Fyll inn demo
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={tournaments.length === 0}
              onClick={() => downloadJson('turneringer.json', exportTournamentsJson(tournaments))}
            >
              <Download /> Eksporter
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
              <Upload /> Importer
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
            <p className="font-display text-lg font-semibold">Ingen turneringer ennå</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Velg et format over, eller trykk «Fyll inn demo» for å se hvordan det ser ut.
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
                          <Badge>{FORMAT_LABELS[t.format]}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="relative z-10 -mt-1 -mr-2 text-muted-foreground hover:text-destructive"
                        aria-label={`Slett ${t.name}`}
                        onClick={() => {
                          if (window.confirm(`Slette «${t.name}»? Dette kan ikke angres.`)) remove(t.id)
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3 text-sm">
                      <span className="text-muted-foreground">
                        {t.participants.length} {t.participantKind === 'team' ? 'lag' : 'deltakere'}
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
