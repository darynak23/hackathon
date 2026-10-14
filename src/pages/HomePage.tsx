import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useTournaments } from '@/hooks/useTournaments'
import { getChampion } from '@/lib/bracket'
import { createDemoTournaments } from '@/lib/demo'
import { downloadJson } from '@/lib/download'
import { exportTournamentsJson } from '@/lib/storage'
import { sportLabel } from '@/types'

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

  return (
    <main className="grid gap-8">
      <header className="brand">
        <h1 className="brand-title">Turneringer</h1>
        <p className="brand-lead">
          Lag utslagsturneringer for basket, sjakk og alt annet. Resultatene lagres lokalt i
          nettleseren.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/ny">Ny turnering</Link>
        </Button>
        <Button variant="outline" onClick={() => saveMany(createDemoTournaments())}>
          Fyll inn demo
        </Button>
        <Button
          variant="outline"
          disabled={tournaments.length === 0}
          onClick={() => downloadJson('turneringer.json', exportTournamentsJson(tournaments))}
        >
          Eksporter
        </Button>
        <Button variant="outline" onClick={() => fileInput.current?.click()}>
          Importer
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

      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}

      {tournaments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          <p className="mb-4">Ingen turneringer ennå.</p>
          <Button asChild>
            <Link to="/ny">Lag den første</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => {
            const champion = getChampion(t)
            return (
              <li key={t.id}>
                <Card className="relative h-full transition-colors hover:border-ring">
                  <CardHeader>
                    <CardTitle>
                      <Link to={`/turnering/${t.id}`} className="after:absolute after:inset-0">
                        {t.name}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {sportLabel(t)} · {t.participants.length} deltakere
                    </CardDescription>
                    <CardAction>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="relative z-10"
                        aria-label={`Slett ${t.name}`}
                        onClick={() => {
                          if (window.confirm(`Slette «${t.name}»?`)) remove(t.id)
                        }}
                      >
                        Slett
                      </Button>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="text-sm">
                    {champion ? (
                      <span>
                        Vinner: <strong className="text-[var(--amber)]">{champion.name}</strong>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Pågår</span>
                    )}
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
