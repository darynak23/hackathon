import type { Match, MatchResult, Participant, ScoringMode, SwissConfig, Tournament } from '@/types'
import { validateScores } from './bracket'

// Swiss-logikk (e-sportvarianten): man går videre etter winsToAdvance seire og
// er ute etter lossesToEliminate tap. Uavgjort teller som en halv seier og et halvt tap.
// Rene funksjoner uten React, testet i swiss.test.ts.

export type SwissStatus = 'active' | 'advanced' | 'eliminated'

export interface SwissRecord {
  participant: Participant
  wins: number
  losses: number
  draws: number
  /** wins + draws/2 */
  score: number
  /** losses + draws/2 */
  lossScore: number
  pointsFor: number
  pointsAgainst: number
  /** Summen av motstandernes score. Skiller de som står likt. */
  buchholz: number
  opponents: string[]
  hadBye: boolean
  status: SwissStatus
}

export function isMatchDone(match: Match): boolean {
  return match.winnerId !== null || match.isDraw === true
}

export function isRoundComplete(round: Match[] | undefined): boolean {
  return round !== undefined && round.every(isMatchDone)
}

/** Stillingen etter de første `uptoRound` rundene (alle runder hvis udefinert). */
export function computeRecords(
  participants: Participant[],
  rounds: Match[][],
  config: SwissConfig,
  uptoRound = rounds.length,
): Map<string, SwissRecord> {
  const records = new Map<string, SwissRecord>()
  for (const participant of participants) {
    records.set(participant.id, {
      participant,
      wins: 0,
      losses: 0,
      draws: 0,
      score: 0,
      lossScore: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      buchholz: 0,
      opponents: [],
      hadBye: false,
      status: 'active',
    })
  }

  for (const round of rounds.slice(0, uptoRound)) {
    for (const match of round) {
      if (!isMatchDone(match)) continue
      const a = match.participantA ? records.get(match.participantA) : undefined
      const b = match.participantB ? records.get(match.participantB) : undefined
      if (match.walkover) {
        const lone = a ?? b
        if (lone) {
          lone.wins += 1
          lone.hadBye = true
        }
        continue
      }
      if (!a || !b) continue
      a.opponents.push(b.participant.id)
      b.opponents.push(a.participant.id)
      if (match.isDraw) {
        a.draws += 1
        b.draws += 1
      } else {
        const [winner, loser] = match.winnerId === a.participant.id ? [a, b] : [b, a]
        winner.wins += 1
        loser.losses += 1
      }
      if (match.scoreA !== undefined && match.scoreB !== undefined) {
        a.pointsFor += match.scoreA
        a.pointsAgainst += match.scoreB
        b.pointsFor += match.scoreB
        b.pointsAgainst += match.scoreA
      }
    }
  }

  for (const record of records.values()) {
    record.score = record.wins + record.draws / 2
    record.lossScore = record.losses + record.draws / 2
    if (record.score >= config.winsToAdvance) record.status = 'advanced'
    else if (record.lossScore >= config.lossesToEliminate) record.status = 'eliminated'
  }
  for (const record of records.values()) {
    record.buchholz = record.opponents.reduce((sum, id) => sum + (records.get(id)?.score ?? 0), 0)
  }
  return records
}

const STATUS_ORDER: Record<SwissStatus, number> = { advanced: 0, active: 1, eliminated: 2 }

/** Sortert tabell: status, seire, færrest tap, Buchholz, poengdifferanse og til slutt seed. */
export function sortStandings(records: Iterable<SwissRecord>): SwissRecord[] {
  return [...records].sort(
    (x, y) =>
      STATUS_ORDER[x.status] - STATUS_ORDER[y.status] ||
      y.score - x.score ||
      x.lossScore - y.lossScore ||
      y.buchholz - x.buchholz ||
      y.pointsFor - y.pointsAgainst - (x.pointsFor - x.pointsAgainst) ||
      x.participant.seed - y.participant.seed,
  )
}

export function swissStandings(tournament: Tournament): SwissRecord[] {
  if (!tournament.swiss) return []
  return sortStandings(
    computeRecords(tournament.participants, tournament.swiss.rounds, tournament.swiss.config).values(),
  )
}

/** Teksten for en stilling, f.eks. "2–1" eller "1½–½". */
export function recordLabel(score: number, lossScore: number): string {
  const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : `${Math.floor(n) || ''}½`)
  return `${fmt(score)}–${fmt(lossScore)}`
}

function swissMatch(round: number, position: number, a: string, b: string | null): Match {
  return {
    id: `s${round}-m${position}`,
    round,
    position,
    participantA: a,
    participantB: b,
    winnerId: b === null ? a : null,
    walkover: b === null,
  }
}

/**
 * Setter opp neste runde blant de aktive: grupper etter stilling, sorter på seed,
 * øvre halvdel mot nedre halvdel i hver gruppe og unngå omkamper med enkle bytter.
 * Går en gruppe opp i oddetall, flyttes den lavest rangerte ned til neste gruppe.
 * Ved oddetall får den lavest rangerte som ikke har hatt fri runde en bye.
 */
export function generateSwissRound(
  participants: Participant[],
  rounds: Match[][],
  config: SwissConfig,
): Match[] {
  const roundIndex = rounds.length
  const records = computeRecords(participants, rounds, config)
  const active = [...records.values()]
    .filter((r) => r.status === 'active')
    .sort(
      (x, y) =>
        y.score - x.score || x.lossScore - y.lossScore || x.participant.seed - y.participant.seed,
    )
  if (active.length === 0) return []

  const matches: Match[] = []
  if (active.length % 2 === 1) {
    const byeIndex = findLastIndex(active, (r) => !r.hadBye)
    const [bye] = active.splice(byeIndex === -1 ? active.length - 1 : byeIndex, 1)
    matches.push(swissMatch(roundIndex, 0, bye.participant.id, null))
  }

  const groups = new Map<string, SwissRecord[]>()
  for (const record of active) {
    const key = `${record.score}|${record.lossScore}`
    groups.set(key, [...(groups.get(key) ?? []), record])
  }

  const pairs: [SwissRecord, SwissRecord][] = []
  let carry: SwissRecord[] = []
  for (const group of groups.values()) {
    const pool = [...carry, ...group]
    carry = pool.length % 2 === 1 ? [pool.pop()!] : []
    pairs.push(...pairGroup(pool))
  }

  const paired = pairs.map(([a, b], i) => swissMatch(roundIndex, i, a.participant.id, b.participant.id))
  return [...paired, ...matches].map((m, i) => ({ ...m, position: i, id: `s${roundIndex}-m${i}` }))
}

function pairGroup(pool: SwissRecord[]): [SwissRecord, SwissRecord][] {
  const half = pool.length / 2
  const top = pool.slice(0, half)
  const bottom = pool.slice(half)
  const used = new Set<number>()
  return top.map((player) => {
    let index = bottom.findIndex(
      (opp, j) => !used.has(j) && !player.opponents.includes(opp.participant.id),
    )
    if (index === -1) index = bottom.findIndex((_, j) => !used.has(j))
    used.add(index)
    return [player, bottom[index]]
  })
}

function findLastIndex<T>(items: T[], predicate: (item: T) => boolean): number {
  for (let i = items.length - 1; i >= 0; i--) if (predicate(items[i])) return i
  return -1
}

/** Returnerer en feilmelding, eller null når resultatet er gyldig. Uavgjort er lov i vinner/taper-modus. */
export function validateSwissResult(match: Match, result: MatchResult, scoring: ScoringMode): string | null {
  if (scoring === 'winLoss' && result.isDraw) return null
  if (result.isDraw) return 'Uavgjort er ikke lov i poengmodus'
  if (result.winnerId !== match.participantA && result.winnerId !== match.participantB) {
    return 'Vinneren må være en av de to deltakerne'
  }
  return scoring === 'points' ? validateScores(match, result) : null
}

/** Høyeste antall runder Swiss-fasen kan trenge. Sikring mot evig løkke. */
export function maxSwissRounds(config: SwissConfig): number {
  return 2 * (config.winsToAdvance + config.lossesToEliminate)
}

export function isSwissDone(participants: Participant[], rounds: Match[][], config: SwissConfig): boolean {
  if (rounds.length === 0 || !isRoundComplete(rounds.at(-1))) return false
  if (rounds.length >= maxSwissRounds(config)) return true
  const records = computeRecords(participants, rounds, config)
  const active = [...records.values()].filter((r) => r.status === 'active')
  return active.length === 0
}
