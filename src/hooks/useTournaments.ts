import { useCallback, useEffect, useState } from 'react'
import * as storage from '@/lib/storage'
import type { Tournament } from '@/types'

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => storage.loadTournaments())

  const reload = useCallback(() => setTournaments(storage.loadTournaments()), [])

  useEffect(() => {
    window.addEventListener('storage', reload)
    return () => window.removeEventListener('storage', reload)
  }, [reload])

  const save = useCallback(
    (tournament: Tournament) => {
      storage.saveTournament(tournament)
      reload()
    },
    [reload],
  )

  const saveMany = useCallback(
    (list: Tournament[]) => {
      for (const t of list) storage.saveTournament(t)
      reload()
    },
    [reload],
  )

  const remove = useCallback(
    (id: string) => {
      storage.deleteTournament(id)
      reload()
    },
    [reload],
  )

  const importJson = useCallback(
    (raw: string) => {
      const count = storage.importTournamentsJson(raw)
      reload()
      return count
    },
    [reload],
  )

  return { tournaments, save, saveMany, remove, importJson, reload }
}
