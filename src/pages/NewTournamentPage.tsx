import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CreateTournamentForm } from '@/components/CreateTournamentForm'
import { useTournaments } from '@/hooks/useTournaments'
import { startTournament } from '@/lib/tournament'
import { FORMAT_LABELS, type TournamentFormat } from '@/types'

function isFormat(value: string | null): value is TournamentFormat {
  return value !== null && value in FORMAT_LABELS
}

export function NewTournamentPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { save } = useTournaments()
  const format = params.get('format')

  return (
    <main className="mx-auto grid w-full max-w-4xl gap-6">
      <div className="grid gap-2">
        <Link to="/" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Alle turneringer
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Ny turnering</h1>
        <p className="text-muted-foreground">
          Format, poengregler og seeding er innstillinger. Endrer dere mening, er det bare et nytt valg her.
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
