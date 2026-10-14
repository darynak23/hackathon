import { describe, expect, it } from 'vitest'
import type { NewTournamentInput, Tournament } from '@/types'
import { simulate } from './fixtures'
import { computeRecords, generateSwissRound, swissStandings } from './swiss'
import { toParticipants } from './bracket'
import * as T from './tournament'

function input(n: number, extra: Partial<NewTournamentInput> = {}): NewTournamentInput {
  return {
    name: 'Swiss',
    sport: 'sjakk',
    scoring: 'winLoss',
    participantKind: 'individual',
    format: 'swissThenElimination',
    swiss: { winsToAdvance: 3, lossesToEliminate: 3 },
    advanceCount: 8,
    participants: Array.from({ length: n }, (_, i) => `P${i + 1}`),
    ...extra,
  }
}

const allSwiss = (t: Tournament) => t.swiss!.rounds.flat()

describe('Swiss-paring', () => {
  it('første runde med seeding: 1 mot N/2+1, 2 mot N/2+2', () => {
    const participants = toParticipants(input(8).participants)
    const round = generateSwissRound(participants, [], { winsToAdvance: 3, lossesToEliminate: 3 })
    const seedOf = (id: string | null) => participants.find((p) => p.id === id)!.seed
    expect(round.map((m) => [seedOf(m.participantA), seedOf(m.participantB)])).toEqual([
      [1, 5],
      [2, 6],
      [3, 7],
      [4, 8],
    ])
  })

  it('setter opp mot noen med samme stilling', () => {
    let t = T.startTournament(input(8))
    t = simulate(t, 4)
    t = T.startNextSwissRound(t)
    const records = computeRecords(t.participants, t.swiss!.rounds.slice(0, 1), t.swiss!.config)
    for (const m of t.swiss!.rounds[1]) {
      expect(records.get(m.participantA!)!.wins).toBe(records.get(m.participantB!)!.wins)
    }
  })

  it('ingen møter samme motstander to ganger', () => {
    const t = simulate(T.startTournament(input(16)), 33)
    const pairs = allSwiss(t)
      .filter((m) => !m.walkover)
      .map((m) => [m.participantA, m.participantB].sort().join('|'))
    expect(new Set(pairs).size).toBe(pairs.length)
  })

  it('oddetall gir en fri runde som teller som seier', () => {
    const t = T.startTournament(input(7))
    const byes = t.swiss!.rounds[0].filter((m) => m.walkover)
    expect(byes).toHaveLength(1)
    expect(byes[0].winnerId).toBe(byes[0].participantA)
    const record = computeRecords(t.participants, t.swiss!.rounds, t.swiss!.config).get(byes[0].participantA!)
    expect(record?.wins).toBe(1)
  })

  it('ingen får fri runde to ganger så lenge det kan unngås', () => {
    const t = simulate(T.startTournament(input(7, { format: 'swiss' })))
    const byeIds = allSwiss(t).filter((m) => m.walkover).map((m) => m.participantA)
    expect(new Set(byeIds).size).toBe(byeIds.length)
  })
})

describe('Swiss-stilling', () => {
  it('16 spillere med 3/3 gir 8 videre og 8 ute', () => {
    const t = simulate(T.startTournament(input(16, { format: 'swiss' })))
    expect(T.swissDone(t)).toBe(true)
    const standings = swissStandings(t)
    expect(standings.filter((r) => r.status === 'advanced')).toHaveLength(8)
    expect(standings.filter((r) => r.status === 'eliminated')).toHaveLength(8)
    expect(standings[0].wins).toBe(3)
    expect(standings[0].losses).toBe(0)
  })

  it('uavgjort teller som et halvt poeng', () => {
    let t = T.startTournament(input(4))
    const m = t.swiss!.rounds[0][0]
    t = T.recordResult(t, m.id, { winnerId: null, isDraw: true })
    const record = computeRecords(t.participants, t.swiss!.rounds, t.swiss!.config).get(m.participantA!)
    expect(record?.score).toBe(0.5)
    expect(record?.lossScore).toBe(0.5)
  })

  it('Buchholz er summen av motstandernes seire', () => {
    const t = simulate(T.startTournament(input(8)), 8)
    const records = computeRecords(t.participants, t.swiss!.rounds, t.swiss!.config)
    for (const r of records.values()) {
      const expected = r.opponents.reduce((sum, id) => sum + records.get(id)!.score, 0)
      expect(r.buchholz).toBe(expected)
    }
  })
})

describe('Swiss-regler', () => {
  it('uavgjort blokkeres i poengmodus', () => {
    const t = T.startTournament(input(4, { scoring: 'points', sport: 'basket' }))
    const m = t.swiss!.rounds[0][0]
    expect(() => T.recordResult(t, m.id, { winnerId: m.participantA, scoreA: 50, scoreB: 50 })).toThrow()
  })

  it('neste runde kan bare startes når runden er ferdig', () => {
    let t = T.startTournament(input(8))
    expect(T.canStartNextSwissRound(t)).toBe(false)
    t = simulate(t, 4)
    expect(T.canStartNextSwissRound(t)).toBe(true)
  })

  it('bare siste runde kan endres', () => {
    let t = simulate(T.startTournament(input(8)), 4)
    t = T.startNextSwissRound(t)
    const old = t.swiss!.rounds[0][0]
    expect(T.isEditable(t, old)).toBe(false)
    expect(() => T.recordResult(t, old.id, { winnerId: old.participantB })).toThrow()
  })
})

describe('Fra Swiss til sluttspill', () => {
  it('de som går videre seedes inn i treet, beste mot svakeste', () => {
    let t = simulate(T.startTournament(input(16)), 33)
    expect(T.canStartPlayoffs(t)).toBe(true)
    t = T.startPlayoffs(t)
    expect(t.rounds).toHaveLength(3)
    const qualifiers = T.playoffQualifiers(t)
    expect(qualifiers).toHaveLength(8)
    expect(t.rounds[0][0].participantA).toBe(qualifiers[0].id)
    expect(t.rounds[0][0].participantB).toBe(qualifiers[7].id)
    const advancedIds = new Set(swissStandings(t).filter((r) => r.status === 'advanced').map((r) => r.participant.id))
    expect(qualifiers.every((p) => advancedIds.has(p.id))).toBe(true)
  })

  it('hele flyten gir en vinner', () => {
    const t = simulate(T.startTournament(input(16)))
    expect(T.getWinner(t)).not.toBeNull()
  })

  it('bare Swiss gir vinner fra tabellen', () => {
    const t = simulate(T.startTournament(input(8, { format: 'swiss' })))
    expect(T.getWinner(t)?.id).toBe(swissStandings(t)[0].participant.id)
  })

  it('nullstilling beholder deltakerne og starter Swiss på nytt', () => {
    const t = simulate(T.startTournament(input(8)))
    const r = T.restartTournament(t)
    expect(r.participants).toEqual(t.participants)
    expect(r.swiss!.rounds).toHaveLength(1)
    expect(r.rounds).toHaveLength(0)
  })
})
