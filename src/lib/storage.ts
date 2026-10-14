import type { Match, Tournament, TournamentFormat } from '@/types'

const STORAGE_KEY = 'nome-turnering:v1'

function isTournament(value: unknown): value is Tournament {
  if (typeof value !== 'object' || value === null) return false
  const t = value as Partial<Tournament>
  return (
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    Array.isArray(t.participants) &&
    Array.isArray(t.rounds)
  )
}

type StoredMatch = Match & { isWalkover?: boolean; scoreA?: number | null; scoreB?: number | null }

function normalizeMatch(raw: StoredMatch): Match {
  const { isWalkover, scoreA, scoreB, ...rest } = raw
  return {
    ...rest,
    walkover: rest.walkover ?? isWalkover ?? false,
    ...(typeof scoreA === 'number' ? { scoreA } : {}),
    ...(typeof scoreB === 'number' ? { scoreB } : {}),
  }
}

/** Oppgraderer turneringer lagret med eldre versjoner av datamodellen. */
function normalize(raw: Tournament): Tournament {
  const format = raw.format as TournamentFormat | 'singleElimination' | undefined
  return {
    ...raw,
    format: !format || format === 'singleElimination' ? 'elimination' : format,
    seedingMode: raw.seedingMode ?? 'seeded',
    participants: raw.participants.map((p, i) => ({ ...p, seed: p.seed ?? i + 1 })),
    rounds: raw.rounds.map((round) => round.map((m) => normalizeMatch(m as StoredMatch))),
    ...(raw.swiss
      ? {
          swiss: {
            ...raw.swiss,
            rounds: raw.swiss.rounds.map((round) => round.map((m) => normalizeMatch(m as StoredMatch))),
          },
        }
      : {}),
    updatedAt: raw.updatedAt ?? raw.createdAt,
  }
}

/** Tolker en JSON-streng. Ugyldige data gir tom liste. */
export function parseTournaments(raw: string | null): Tournament[] {
  if (!raw) return []
  try {
    const data: unknown = JSON.parse(raw)
    return Array.isArray(data) ? data.filter(isTournament).map(normalize) : []
  } catch {
    return []
  }
}

export function loadTournaments(): Tournament[] {
  try {
    return parseTournaments(localStorage.getItem(STORAGE_KEY))
  } catch {
    return []
  }
}

export function saveTournaments(tournaments: Tournament[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments))
}

export function getTournament(id: string): Tournament | undefined {
  return loadTournaments().find((t) => t.id === id)
}

/** Legger til eller erstatter turneringen med samme id. */
export function saveTournament(tournament: Tournament): void {
  const all = loadTournaments()
  const index = all.findIndex((t) => t.id === tournament.id)
  if (index === -1) all.push(tournament)
  else all[index] = tournament
  saveTournaments(all)
}

export function deleteTournament(id: string): void {
  saveTournaments(loadTournaments().filter((t) => t.id !== id))
}

export function exportTournamentsJson(tournaments: Tournament[]): string {
  return JSON.stringify(tournaments, null, 2)
}

/** Importerte turneringer erstatter eksisterende med samme id. Returnerer antall importerte. */
export function importTournamentsJson(raw: string): number {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error('Filen er ikke gyldig JSON')
  }
  const list = (Array.isArray(data) ? data : [data]).filter(isTournament).map(normalize)
  if (list.length === 0) throw new Error('Fant ingen turneringer i filen')
  const byId = new Map(loadTournaments().map((t) => [t.id, t]))
  for (const t of list) byId.set(t.id, t)
  saveTournaments([...byId.values()])
  return list.length
}
