import { useNavigate } from 'react-router-dom'
import { CreateTournamentForm } from '@/components/CreateTournamentForm'
import { useTournaments } from '@/hooks/useTournaments'
import { createTournament } from '@/lib/bracket'

export function NewTournamentPage() {
  const navigate = useNavigate()
  const { save } = useTournaments()

  return (
    <main className="mx-auto grid w-full max-w-xl gap-6">
      <h1 className="brand-title">Ny turnering</h1>
      <CreateTournamentForm
        onSubmit={(input) => {
          const tournament = createTournament(input)
          save(tournament)
          navigate(`/turnering/${tournament.id}`)
        }}
      />
    </main>
  )
}
