import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CreateTournamentForm } from '@/components/CreateTournamentForm'
import { useTournaments } from '@/hooks/useTournaments'
import { startTournament } from '@/lib/tournament'
import { FORMATS, type TournamentFormat } from '@/types'
import { useLanguage } from '@/hooks/useLanguage'
import { tx } from '@/lib/i18n'

function isFormat(value: string | null): value is TournamentFormat {
  return value !== null && (FORMATS as string[]).includes(value)
}

export function NewTournamentPage() {
  useLanguage()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { save } = useTournaments()
  const format = params.get('format')

  return (
    <main className="mx-auto grid w-full max-w-4xl gap-6">
      <div className="grid gap-2">
        <Link to="/" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {tx('Alle turneringer', 'All tournaments')}
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{tx('Ny turnering', 'New tournament')}</h1>
        <p className="text-muted-foreground">
          {tx(
            'Format, poengregler og seeding er innstillinger. Endrer dere mening, er det bare et nytt valg her.',
            'Format, scoring rules and seeding are just settings. If you change your mind, it is only a new choice here.',
          )}
        </p>
      </div>
      <CreateTournamentForm
        initialFormat={isFormat(format) ? format : undefined}
        onSubmit={(input) => {
          const tournament = startTournament(input)
          save(tournament)
          navigate(`/turnering/${tournament.id}`)
        }}
      />
    </main>
  )
}
