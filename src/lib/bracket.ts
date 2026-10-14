import type {
  Match,
  MatchResult,
  NewTournamentInput,
  Participant,
  Tournament,
  ValidationResult,
} from '@/types'

// Signaturene er låst. Innholdet eies av person 2.
// Funksjonene under er forenklede stubber slik at sidene kan brukes før logikken er ferdig.

export function roundCount(participantCount: number): number {
  if (participantCount < 2) return 0
  return Math.ceil(Math.log2(participantCount))
}

export function createTournament(input: NewTournamentInput): Tournament {
  const now = new Date().toISOString()
  const participants: Participant[] = input.participants.map((p, i) => ({
    id: `p${i}`,
    name: p.name,
    ...(p.members ? { members: p.members } : {}),
  }))
  const rounds: Match[][] = []
  const total = roundCount(participants.length)
  for (let r = 0; r < total; r++) {
    const size = 2 ** (total - r - 1)
    rounds.push(
      Array.from({ length: size }, (_, p) => ({
        id: `r${r}-p${p}`,
        round: r,
        position: p,
        participantA: r === 0 ? (participants[p * 2]?.id ?? null) : null,
        participantB: r === 0 ? (participants[p * 2 + 1]?.id ?? null) : null,
        scoreA: null,
        scoreB: null,
        winnerId: null,
        isWalkover: false,
      })),
    )
  }
  return {
    id: crypto.randomUUID(),
    name: input.name,
    sport: input.sport,
    ...(input.customSport ? { customSport: input.customSport } : {}),
    scoring: input.scoring,
    participantKind: input.participantKind,
    format: input.format,
    participants,
    rounds,
    createdAt: now,
    updatedAt: now,
  }
}

export function setResult(
  tournament: Tournament,
  matchId: string,
  result: MatchResult,
): Tournament {
  return {
    ...tournament,
    rounds: tournament.rounds.map((round) =>
      round.map((m) => (m.id === matchId ? { ...m, ...result } : m)),
    ),
    updatedAt: new Date().toISOString(),
  }
}

export function clearResult(tournament: Tournament, matchId: string): Tournament {
  return {
    ...tournament,
    rounds: tournament.rounds.map((round) =>
      round.map((m) =>
        m.id === matchId ? { ...m, winnerId: null, scoreA: null, scoreB: null } : m,
      ),
    ),
    updatedAt: new Date().toISOString(),
  }
}

export function validateResult(
  tournament: Tournament,
  match: Match,
  result: MatchResult,
): ValidationResult {
  if (result.winnerId !== match.participantA && result.winnerId !== match.participantB) {
    return { ok: false, error: 'Vinneren må være en av de to deltakerne' }
  }
  if (tournament.scoring === 'points' && result.scoreA === result.scoreB) {
    return { ok: false, error: 'Uavgjort er ikke lov' }
  }
  return { ok: true }
}

export function isPlayable(match: Match): boolean {
  return match.participantA !== null && match.participantB !== null && !match.isWalkover
}

export function getChampion(tournament: Tournament): Participant | null {
  const final = tournament.rounds.at(-1)?.[0]
  if (!final?.winnerId) return null
  return getParticipant(tournament, final.winnerId) ?? null
}

export function getParticipant(
  tournament: Tournament,
  id: string | null,
): Participant | undefined {
  if (id === null) return undefined
  return tournament.participants.find((p) => p.id === id)
}

export function findMatch(tournament: Tournament, matchId: string): Match | undefined {
  return tournament.rounds.flat().find((m) => m.id === matchId)
}
