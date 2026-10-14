import { useNavigate } from 'react-router-dom'
import { CreateTournamentForm } from '@/components/CreateTournamentForm'
import { useLanguage } from '@/hooks/useLanguage'
import { useTournaments } from '@/hooks/useTournaments'
import { createTournament } from '@/lib/bracket'

export function NewTournamentPage() {
  const navigate = useNavigate()
  const { save } = useTournaments()
  const { t } = useLanguage()

  return (
    <main className="mx-auto grid w-full max-w-xl gap-6">
      <h1 className="brand-title">{t.newTournament}</h1>
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
