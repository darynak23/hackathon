import type { Match, MatchResult, NewTournamentInput, Participant, Tournament } from '@/types'
import { DEFAULT_SWISS } from '@/types'
import * as bracket from './bracket'
import * as swiss from './swiss'

// Funksjonene sidene bruker. De sender videre til utslag (bracket.ts) eller Swiss (swiss.ts)
// og håndterer overgangen fra Swiss til sluttspill.

export type Phase = 'swiss' | 'playoffs'

function touch(t: Tournament): Tournament {
  return { ...t, updatedAt: new Date().toISOString() }
}

export function hasSwiss(t: Tournament): boolean {
  return t.format !== 'elimination'
}

export function hasPlayoffs(t: Tournament): boolean {
  return t.format !== 'swiss'
}

/** Største 2-er-potens som er mindre enn eller lik n. */
export function largestPowerOfTwo(n: number): number {
  return n < 2 ? 0 : 2 ** Math.floor(Math.log2(n))
}

/** Gyldige valg for antall til sluttspill, gitt antall deltakere. */
export function advanceOptions(participantCount: number): number[] {
  return [2, 4, 8, 16].filter((n) => n < participantCount)
}

export function startTournament(input: NewTournamentInput): Tournament {
  if (input.participants.length < 2) throw new Error('Det trengs minst 2 deltakere')
  const format = input.format ?? 'elimination'
  if (format === 'elimination') {
    return { ...bracket.createTournament(input), seedingMode: input.seedingMode ?? 'seeded' }
  }
  const base = bracket.baseTournament(input)
  const config = input.swiss ?? DEFAULT_SWISS
  const firstRound = swiss.generateSwissRound(base.participants, [], config)
  return {
    ...base,
    swiss: { config, rounds: [firstRound] },
    ...(format === 'swissThenElimination'
      ? { advanceCount: input.advanceCount ?? Math.min(8, largestPowerOfTwo(base.participants.length - 1)) }
      : {}),
  }
}

/** Starter turneringen på nytt med samme deltakere, seeder og innstillinger. */
export function restartTournament(t: Tournament): Tournament {
  if (!t.swiss) return bracket.resetTournament(t)
  const firstRound = swiss.generateSwissRound(t.participants, [], t.swiss.config)
  return touch({ ...t, swiss: { ...t.swiss, rounds: [firstRound] }, rounds: [] })
}

export function phaseOf(matchId: string): Phase {
  return matchId.startsWith('s') ? 'swiss' : 'playoffs'
}

export function findMatch(t: Tournament, matchId: string): Match | undefined {
  return bracket.getMatch(t, matchId)
}

/** I Swiss kan bare siste runde endres, og bare før sluttspillet har startet. */
export function isEditable(t: Tournament, match: Match): boolean {
  if (match.walkover) return false
  if (phaseOf(match.id) === 'playoffs') return bracket.isPlayable(match)
  if (!t.swiss || t.rounds.length > 0) return false
  return match.round === t.swiss.rounds.length - 1
}

export function validate(t: Tournament, match: Match, result: MatchResult): string | null {
  return phaseOf(match.id) === 'swiss'
    ? swiss.validateSwissResult(match, result, t.scoring)
    : bracket.validateResult(match, result, t.scoring)
}

/** Kaster ved ugyldig resultat eller hvis kampen ikke kan endres. */
export function recordResult(t: Tournament, matchId: string, result: MatchResult): Tournament {
  if (phaseOf(matchId) === 'playoffs') return bracket.setResult(t, matchId, result)

  const match = findMatch(t, matchId)
  if (!match || !t.swiss) throw new Error(`Fant ikke kampen ${matchId}`)
  if (!isEditable(t, match)) throw new Error('Bare kamper i siste Swiss-runde kan endres')
  const error = swiss.validateSwissResult(match, result, t.scoring)
  if (error) throw new Error(error)

  const updated: Match = {
    ...match,
    winnerId: result.isDraw ? null : result.winnerId,
    isDraw: result.isDraw === true,
  }
  if (t.scoring === 'points') {
    updated.scoreA = result.scoreA
    updated.scoreB = result.scoreB
  }
  return touch({ ...t, swiss: replaceSwissMatch(t.swiss, updated) })
}

export function removeResult(t: Tournament, matchId: string): Tournament {
  if (phaseOf(matchId) === 'playoffs') return bracket.clearResult(t, matchId)
  const match = findMatch(t, matchId)
  if (!match || !t.swiss || !isEditable(t, match)) return t
  const cleared: Match = { ...match, winnerId: null, isDraw: false }
  delete cleared.scoreA
  delete cleared.scoreB
  return touch({ ...t, swiss: replaceSwissMatch(t.swiss, cleared) })
}

function replaceSwissMatch(stage: NonNullable<Tournament['swiss']>, match: Match) {
  return {
    ...stage,
    rounds: stage.rounds.map((round) => round.map((m) => (m.id === match.id ? match : m))),
  }
}

export function swissDone(t: Tournament): boolean {
  return !!t.swiss && swiss.isSwissDone(t.participants, t.swiss.rounds, t.swiss.config)
}

export function canStartNextSwissRound(t: Tournament): boolean {
  return !!t.swiss && t.rounds.length === 0 && swiss.isRoundComplete(t.swiss.rounds.at(-1)) && !swissDone(t)
}

export function startNextSwissRound(t: Tournament): Tournament {
  if (!t.swiss || !canStartNextSwissRound(t)) return t
  const next = swiss.generateSwissRound(t.participants, t.swiss.rounds, t.swiss.config)
  return touch({ ...t, swiss: { ...t.swiss, rounds: [...t.swiss.rounds, next] } })
}

export function canStartPlayoffs(t: Tournament): boolean {
  return t.format === 'swissThenElimination' && t.rounds.length === 0 && swissDone(t)
}

/** De som går videre, i seed-rekkefølge for sluttspillet: færrest tap, Buchholz og opprinnelig seed. */
export function playoffQualifiers(t: Tournament): Participant[] {
  if (!t.swiss) return []
  const ranked = swiss
    .swissStandings(t)
    .sort(
      (x, y) =>
        (x.status === 'advanced' ? 0 : 1) - (y.status === 'advanced' ? 0 : 1) ||
        x.lossScore - y.lossScore ||
        y.score - x.score ||
        y.buchholz - x.buchholz ||
        x.participant.seed - y.participant.seed,
    )
  return ranked.slice(0, t.advanceCount ?? 8).map((r) => r.participant)
}

export function startPlayoffs(t: Tournament): Tournament {
  if (!canStartPlayoffs(t)) return t
  const ids = playoffQualifiers(t).map((p) => p.id)
  return touch({ ...t, rounds: bracket.buildBracket(ids) })
}

export function getWinner(t: Tournament): Participant | null {
  if (t.format === 'swiss') return swissDone(t) ? (swiss.swissStandings(t)[0]?.participant ?? null) : null
  return bracket.getChampion(t)
}

export function currentPhase(t: Tournament): Phase {
  if (t.format === 'elimination') return 'playoffs'
  if (t.format === 'swiss') return 'swiss'
  return t.rounds.length > 0 ? 'playoffs' : 'swiss'
}

export function statusLabel(t: Tournament): string {
  const winner = getWinner(t)
  if (winner) return 'Ferdig'
  if (currentPhase(t) === 'swiss' && t.swiss) return `Swiss, runde ${t.swiss.rounds.length}`
  const remaining = t.rounds.flat().filter((m) => m.winnerId === null).length
  return remaining === 1 ? 'Finale' : `Sluttspill, ${remaining} kamper igjen`
}
