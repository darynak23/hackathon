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
import { useLanguage } from '@/hooks/useLanguage'
import { useTournaments } from '@/hooks/useTournaments'
import { getChampion } from '@/lib/bracket'
import { createDemoTournaments } from '@/lib/demo'
import { downloadJson } from '@/lib/download'
import { sportName, translateError } from '@/lib/i18n'
import { exportTournamentsJson } from '@/lib/storage'

export function HomePage() {
  const { tournaments, saveMany, remove, importJson } = useTournaments()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const { t } = useLanguage()

  async function handleImport(file: File) {
    try {
      const count = importJson(await file.text())
      setMessage(t.imported(count))
    } catch (err) {
      setMessage(err instanceof Error ? translateError(t, err.message) : t.importFailed)
    }
  }

  return (
    <main className="grid gap-8">
      <header className="brand">
        <h1 className="brand-title">{t.tournaments}</h1>
        <p className="brand-lead">{t.homeLead}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/ny">{t.newTournament}</Link>
        </Button>
        <Button variant="outline" onClick={() => saveMany(createDemoTournaments())}>
          {t.fillDemo}
        </Button>
        <Button
          variant="outline"
          disabled={tournaments.length === 0}
          onClick={() => downloadJson(t.exportFileName, exportTournamentsJson(tournaments))}
        >
          {t.export}
        </Button>
        <Button variant="outline" onClick={() => fileInput.current?.click()}>
          {t.import}
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
          <p className="mb-4">{t.noTournaments}</p>
          <Button asChild>
            <Link to="/ny">{t.createFirst}</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => {
            const champion = getChampion(tournament)
            return (
              <li key={tournament.id}>
                <Card className="relative h-full transition-colors hover:border-ring">
                  <CardHeader>
                    <CardTitle>
                      <Link to={`/turnering/${tournament.id}`} className="after:absolute after:inset-0">
                        {tournament.name}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {sportName(t, tournament)} · {t.participants(tournament.participants.length)}
                    </CardDescription>
                    <CardAction>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="relative z-10"
                        aria-label={t.deleteLabel(tournament.name)}
                        onClick={() => {
                          if (window.confirm(t.confirmDelete(tournament.name))) remove(tournament.id)
                        }}
                      >
                        {t.delete}
                      </Button>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="text-sm">
                    {champion ? (
                      <span>
                        {t.winner}: <strong className="text-[var(--amber)]">{champion.name}</strong>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{t.inProgress}</span>
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
