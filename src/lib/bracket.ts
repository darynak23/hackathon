import { tx } from '@/lib/i18n'
import type {
  Match,
  MatchResult,
  NewTournamentInput,
  Participant,
  ScoringMode,
  Tournament,
} from '@/types'

// Utslagslogikk og seeding. Rene funksjoner uten React, testet i bracket.test.ts.

export function roundCount(participantCount: number): number {
  if (participantCount < 2) return 0
  return Math.ceil(Math.log2(participantCount))
}

/** Standard seed-plassering, slik at 1 og 2 først kan møtes i finalen. 8 gir [1,8,4,5,2,7,3,6]. */
export function seedOrder(size: number): number[] {
  if (size < 2) return [1]
  let order = [1, 2]
  while (order.length < size) {
    const n = order.length * 2 + 1
    order = order.flatMap((s) => [s, n - s])
  }
  return order
}

/** Fisher–Yates. Returnerer en ny liste. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Gjør skjemaets deltakerliste om til deltakere med id og seed 1–N i rekkefølgen de står. */
export function toParticipants(list: NewTournamentInput['participants']): Participant[] {
  return list.map((entry, i) => {
    const { name, members } = typeof entry === 'string' ? { name: entry, members: undefined } : entry
    return {
      id: `p${i + 1}`,
      name,
      seed: i + 1,
      ...(members && members.length > 0 ? { members } : {}),
    }
  })
}

function emptyMatch(prefix: string, round: number, position: number): Match {
  return {
    id: `${prefix}${round}-m${position}`,
    round,
    position,
    participantA: null,
    participantB: null,
    winnerId: null,
    walkover: false,
  }
}

/**
 * Lager et utslagstre fra deltaker-id-er i seed-rekkefølge (første er seed 1).
 * Antall plasser rundes opp til 2-er-potens. Manglende seeder blir walkovers,
 * som dermed havner hos toppseedene, og walkover-vinnerne går rett til runde 2.
 */
export function buildBracket(seededIds: string[]): Match[][] {
  const total = roundCount(seededIds.length)
  if (total === 0) throw new Error(tx('Det trengs minst 2 deltakere', 'At least 2 participants are needed'))

  const size = 2 ** total
  const order = seedOrder(size)
  const rounds: Match[][] = Array.from({ length: total }, (_, r) =>
    Array.from({ length: size / 2 ** (r + 1) }, (_, p) => emptyMatch('r', r, p)),
  )

  rounds[0].forEach((match, p) => {
    match.participantA = seededIds[order[p * 2] - 1] ?? null
    match.participantB = seededIds[order[p * 2 + 1] - 1] ?? null
    const lone = match.participantB === null ? match.participantA : match.participantA === null ? match.participantB : null
    if (lone) {
      match.walkover = true
      match.winnerId = lone
      placeWinner(rounds, match, lone)
    }
  })

  return rounds
}

export function baseTournament(input: NewTournamentInput): Tournament {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: input.name,
    sport: input.sport,
    ...(input.customSport ? { customSport: input.customSport } : {}),
    scoring: input.scoring,
    participantKind: input.participantKind,
    format: input.format ?? 'elimination',
    seedingMode: input.seedingMode ?? 'seeded',
    participants: toParticipants(input.participants),
    rounds: [],
    createdAt: now,
    updatedAt: now,
  }
}

/** Lager en ren utslagsturnering. Bruk startTournament i tournament.ts for Swiss-formatene. */
export function createTournament(input: NewTournamentInput): Tournament {
  if (input.participants.length < 2) throw new Error(tx('Det trengs minst 2 deltakere', 'At least 2 participants are needed'))
  const base = baseTournament({ ...input, format: 'elimination' })
  return { ...base, rounds: buildBracket(base.participants.map((p) => p.id)) }
}

/** Bygger treet på nytt med samme deltakere og seeder. */
export function resetTournament(tournament: Tournament): Tournament {
  const ids = [...tournament.participants].sort((a, b) => a.seed - b.seed).map((p) => p.id)
  return {
    ...tournament,
    rounds: buildBracket(ids),
    updatedAt: new Date().toISOString(),
  }
}

function placeWinner(rounds: Match[][], match: Match, winnerId: string | null) {
  const next = rounds[match.round + 1]?.[Math.floor(match.position / 2)]
  if (!next) return
  if (match.position % 2 === 0) next.participantA = winnerId
  else next.participantB = winnerId
}

/** Tømmer plassen kampen leverer til, og alt den gamle vinneren hadde gått videre til. */
function clearForward(rounds: Match[][], match: Match) {
  const next = rounds[match.round + 1]?.[Math.floor(match.position / 2)]
  if (!next) return
  placeWinner(rounds, match, null)
  if (next.winnerId !== null) {
    clearForward(rounds, next)
    resetMatch(next)
  }
}

function resetMatch(match: Match) {
  match.winnerId = null
  delete match.scoreA
  delete match.scoreB
}

function locate(rounds: Match[][], matchId: string): Match | undefined {
  for (const round of rounds) {
    const match = round.find((m) => m.id === matchId)
    if (match) return match
  }
  return undefined
}

/** Returnerer en feilmelding, eller null når resultatet er gyldig. */
export function validateResult(match: Match, result: MatchResult, scoring: ScoringMode): string | null {
  if (result.isDraw) return tx('Uavgjort er ikke lov i utslag', 'Draws are not allowed in knockout')
  if (result.winnerId !== match.participantA && result.winnerId !== match.participantB) {
    return tx('Vinneren må være en av de to deltakerne', 'The winner must be one of the two participants')
  }
  if (scoring === 'points') return validateScores(match, result)
  return null
}

/** Felles poengsjekk for utslag og Swiss. */
export function validateScores(match: Match, result: MatchResult): string | null {
  const { scoreA, scoreB } = result
  if (scoreA === undefined || scoreB === undefined || Number.isNaN(scoreA) || Number.isNaN(scoreB)) {
    return tx('Skriv inn poeng for begge', 'Enter points for both')
  }
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB)) return tx('Poeng må være hele tall', 'Points must be whole numbers')
  if (scoreA < 0 || scoreB < 0) return tx('Poeng kan ikke være negative', 'Points cannot be negative')
  if (scoreA === scoreB) return tx('Uavgjort er ikke lov, det må finnes en vinner', 'Draws are not allowed, there must be a winner')
  const leader = scoreA > scoreB ? match.participantA : match.participantB
  if (result.winnerId !== null && result.winnerId !== leader) return tx('Vinneren må ha flest poeng', 'The winner must have the most points')
  return null
}

/**
 * Setter resultatet i en kamp i treet. Vinneren går til kamp floor(p/2) i neste
 * runde, plass A for partall og B for oddetall. Byttes vinneren, nullstilles
 * alt den gamle vinneren hadde gått videre til. Kaster ved ugyldig resultat.
 */
export function setResult(tournament: Tournament, matchId: string, result: MatchResult): Tournament {
  const rounds = structuredClone(tournament.rounds)
  const match = locate(rounds, matchId)
  if (!match) throw new Error(tx(`Fant ikke kampen ${matchId}`, `Match ${matchId} not found`))
  if (!isPlayable(match)) throw new Error(tx('Kampen kan ikke spilles ennå', 'The match cannot be played yet'))
  const error = validateResult(match, result, tournament.scoring)
  if (error) throw new Error(error)

  if (match.winnerId !== null && match.winnerId !== result.winnerId) clearForward(rounds, match)

  match.winnerId = result.winnerId
  if (tournament.scoring === 'points') {
    match.scoreA = result.scoreA
    match.scoreB = result.scoreB
  } else {
    delete match.scoreA
    delete match.scoreB
  }
  placeWinner(rounds, match, result.winnerId)

  return { ...tournament, rounds, updatedAt: new Date().toISOString() }
}

/** Fjerner resultatet og alt den gamle vinneren gikk videre til. Walkovers kan ikke fjernes. */
export function clearResult(tournament: Tournament, matchId: string): Tournament {
  const existing = locate(tournament.rounds, matchId)
  if (!existing || existing.walkover || existing.winnerId === null) return tournament

  const rounds = structuredClone(tournament.rounds)
  const match = locate(rounds, matchId)!
  clearForward(rounds, match)
  resetMatch(match)
  return { ...tournament, rounds, updatedAt: new Date().toISOString() }
}

export function isPlayable(match: Match): boolean {
  return match.participantA !== null && match.participantB !== null && !match.walkover
}

export function getChampion(tournament: Tournament): Participant | null {
  const final = tournament.rounds.at(-1)?.[0]
  if (!final?.winnerId) return null
  return getParticipant(tournament, final.winnerId) ?? null
}

export function getParticipant(tournament: Tournament, id: string | null): Participant | undefined {
  if (id === null) return undefined
  return tournament.participants.find((p) => p.id === id)
}

/** Finner en kamp i treet eller i Swiss-fasen. */
export function getMatch(tournament: Tournament, matchId: string): Match | undefined {
  return locate(tournament.rounds, matchId) ?? (tournament.swiss && locate(tournament.swiss.rounds, matchId))
}
