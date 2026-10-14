import { describe, expect, it } from 'vitest'
import type { NewTournamentInput, Tournament } from '../types'
import {
  clearResult,
  createTournament,
  getChampion,
  getMatch,
  getParticipant,
  isPlayable,
  resetTournament,
  roundCount,
  setResult,
  validateResult,
} from './bracket'

function input(n: number, scoring: NewTournamentInput['scoring'] = 'winLoss'): NewTournamentInput {
  return {
    name: 'Test',
    sport: scoring === 'points' ? 'basket' : 'sjakk',
    scoring,
    participantKind: 'individual',
    participants: Array.from({ length: n }, (_, i) => `P${i + 1}`),
  }
}

const idOf = (t: Tournament, name: string) => t.participants.find((p) => p.name === name)!.id

/** Lar A vinne alle spillbare kamper i en runde */
function playRound(t: Tournament, round: number): Tournament {
  for (const m of t.rounds[round]) {
    if (isPlayable(m) && !m.winnerId) t = setResult(t, m.id, { winnerId: m.participantA! })
  }
  return t
}

describe('roundCount', () => {
  it('runder opp til nærmeste 2-er-potens', () => {
    expect(roundCount(2)).toBe(1)
    expect(roundCount(4)).toBe(2)
    expect(roundCount(5)).toBe(3)
    expect(roundCount(8)).toBe(3)
    expect(roundCount(9)).toBe(4)
    expect(roundCount(16)).toBe(4)
  })
})

describe('createTournament', () => {
  it('8 deltakere gir 3 runder og 7 kamper', () => {
    const t = createTournament(input(8))
    expect(t.rounds).toHaveLength(3)
    expect(t.rounds.flat()).toHaveLength(7)
    expect(t.rounds.map((r) => r.length)).toEqual([4, 2, 1])
    expect(t.rounds[0].every((m) => !m.walkover)).toBe(true)
  })

  it('5 deltakere gir 8 plasser, 3 walkovers og 3 deltakere rett til runde 2', () => {
    const t = createTournament(input(5))
    expect(t.rounds[0].length * 2).toBe(8)
    expect(t.rounds[0].filter((m) => m.walkover)).toHaveLength(3)
    const inRound2 = t.rounds[1].flatMap((m) => [m.participantA, m.participantB]).filter(Boolean)
    expect(inRound2).toHaveLength(3)
  })

  it('ingen kamp i runde 1 har to tomme plasser', () => {
    for (let n = 2; n <= 33; n++) {
      const t = createTournament(input(n))
      for (const m of t.rounds[0]) {
        expect(m.participantA ?? m.participantB).not.toBeNull()
      }
      const placed = t.rounds[0].flatMap((m) => [m.participantA, m.participantB]).filter(Boolean)
      expect(new Set(placed).size).toBe(n)
    }
  })

  it('walkovers fordeles på begge halvdeler av treet', () => {
    const t = createTournament(input(6))
    const half = t.rounds[0].length / 2
    expect(t.rounds[0].slice(0, half).filter((m) => m.walkover)).toHaveLength(1)
    expect(t.rounds[0].slice(half).filter((m) => m.walkover)).toHaveLength(1)
  })

  it('2 deltakere gir bare en finale', () => {
    const t = createTournament(input(2))
    expect(t.rounds).toHaveLength(1)
    expect(t.rounds[0]).toHaveLength(1)
    expect(isPlayable(t.rounds[0][0])).toBe(true)
  })

  it('krever minst 2 deltakere', () => {
    expect(() => createTournament(input(1))).toThrow()
  })

  it('tar med lagmedlemmer', () => {
    const t = createTournament({
      ...input(2),
      participantKind: 'team',
      participants: [{ name: 'Lag A', members: ['Ola', 'Kari'] }, 'Lag B'],
    })
    expect(t.participants[0].members).toEqual(['Ola', 'Kari'])
  })
})

describe('setResult', () => {
  it('vinneren går til floor(p/2), plass A for partall og B for oddetall', () => {
    let t = createTournament(input(8))
    const m2 = t.rounds[0][2]
    const m3 = t.rounds[0][3]
    t = setResult(t, m2.id, { winnerId: m2.participantB! })
    t = setResult(t, m3.id, { winnerId: m3.participantA! })
    expect(t.rounds[1][1].participantA).toBe(m2.participantB)
    expect(t.rounds[1][1].participantB).toBe(m3.participantA)
  })

  it('input-turneringen er uendret etter setResult', () => {
    const t = createTournament(input(8))
    const before = structuredClone(t)
    setResult(t, 'r0-m0', { winnerId: t.rounds[0][0].participantA! })
    expect(t).toEqual(before)
  })

  it('lagrer poeng i poengmodus', () => {
    let t = createTournament(input(2, 'points'))
    const m = t.rounds[0][0]
    t = setResult(t, m.id, { winnerId: m.participantA!, scoreA: 62, scoreB: 58 })
    expect(getMatch(t, m.id)).toMatchObject({ scoreA: 62, scoreB: 58, winnerId: m.participantA })
  })

  it('endre vinner i runde 1 etter at runde 2 er spilt nullstiller runde 2 og finalen', () => {
    let t = createTournament(input(8))
    t = playRound(t, 0)
    t = playRound(t, 1)
    t = playRound(t, 2)
    expect(getChampion(t)).not.toBeNull()

    const first = t.rounds[0][0]
    t = setResult(t, first.id, { winnerId: first.participantB! })

    expect(t.rounds[1][0].winnerId).toBeNull()
    expect(t.rounds[1][0].participantA).toBe(first.participantB)
    expect(t.rounds[2][0].winnerId).toBeNull()
    expect(t.rounds[2][0].participantA).toBeNull()
    expect(getChampion(t)).toBeNull()
    // Den andre halvdelen er urørt
    expect(t.rounds[1][1].winnerId).not.toBeNull()
    expect(t.rounds[2][0].participantB).toBe(t.rounds[1][1].winnerId)
  })

  it('endre bare poeng med samme vinner nullstiller ikke kampene etter', () => {
    let t = createTournament(input(4, 'points'))
    for (const m of t.rounds[0]) {
      t = setResult(t, m.id, { winnerId: m.participantA!, scoreA: 10, scoreB: 5 })
    }
    const fin = t.rounds[1][0]
    t = setResult(t, fin.id, { winnerId: fin.participantA!, scoreA: 3, scoreB: 1 })
    t = setResult(t, 'r0-m0', { winnerId: t.rounds[0][0].participantA!, scoreA: 20, scoreB: 5 })
    expect(t.rounds[1][0].winnerId).toBe(fin.participantA)
  })

  it('kaster ved ugyldig resultat', () => {
    const t = createTournament(input(2, 'points'))
    const m = t.rounds[0][0]
    expect(() => setResult(t, m.id, { winnerId: m.participantA!, scoreA: 50, scoreB: 50 })).toThrow()
  })
})

describe('clearResult', () => {
  it('fjerner resultatet og alt den gamle vinneren gikk videre til', () => {
    let t = createTournament(input(8))
    t = playRound(t, 0)
    t = playRound(t, 1)
    const first = t.rounds[0][0]
    t = clearResult(t, first.id)
    expect(t.rounds[0][0].winnerId).toBeNull()
    expect(t.rounds[1][0].participantA).toBeNull()
    expect(t.rounds[1][0].winnerId).toBeNull()
    expect(t.rounds[2][0].participantA).toBeNull()
    expect(t.rounds[1][1].winnerId).not.toBeNull()
  })

  it('walkover kan ikke fjernes', () => {
    const t = createTournament(input(5))
    const wo = t.rounds[0].find((m) => m.walkover)!
    expect(clearResult(t, wo.id)).toEqual(t)
  })
})

describe('validateResult', () => {
  const t = createTournament(input(2, 'points'))
  const m = t.rounds[0][0]
  const a = m.participantA!
  const b = m.participantB!

  it('uavgjort 50–50 i poengmodus gir feilmelding', () => {
    expect(validateResult(m, { winnerId: a, scoreA: 50, scoreB: 50 }, 'points')).toMatch(/uavgjort/i)
  })

  it('negative poeng blokkeres', () => {
    expect(validateResult(m, { winnerId: a, scoreA: 5, scoreB: -1 }, 'points')).not.toBeNull()
  })

  it('manglende poeng blokkeres i poengmodus', () => {
    expect(validateResult(m, { winnerId: a }, 'points')).not.toBeNull()
  })

  it('vinner må være en av de to', () => {
    expect(validateResult(m, { winnerId: 'noen-andre' }, 'winLoss')).not.toBeNull()
  })

  it('vinner må ha flest poeng', () => {
    expect(validateResult(m, { winnerId: b, scoreA: 62, scoreB: 58 }, 'points')).not.toBeNull()
  })

  it('gyldige resultater gir null', () => {
    expect(validateResult(m, { winnerId: a, scoreA: 62, scoreB: 58 }, 'points')).toBeNull()
    expect(validateResult(m, { winnerId: b }, 'winLoss')).toBeNull()
  })
})

describe('hjelpere', () => {
  it('isPlayable er usann for walkover og tomme plasser', () => {
    const t = createTournament(input(5))
    expect(isPlayable(t.rounds[0].find((m) => m.walkover)!)).toBe(false)
    expect(isPlayable(t.rounds[2][0])).toBe(false)
    expect(isPlayable(t.rounds[0].find((m) => !m.walkover)!)).toBe(true)
  })

  it('getChampion gir finalevinneren', () => {
    let t = createTournament(input(2))
    expect(getChampion(t)).toBeNull()
    t = setResult(t, 'r0-m0', { winnerId: idOf(t, 'P2') })
    expect(getChampion(t)?.name).toBe('P2')
  })

  it('getParticipant slår opp på id', () => {
    const t = createTournament(input(3))
    expect(getParticipant(t, idOf(t, 'P3'))?.name).toBe('P3')
    expect(getParticipant(t, null)).toBeUndefined()
  })

  it('resetTournament beholder deltakerne og tømmer resultatene', () => {
    let t = createTournament(input(5))
    t = playRound(t, 0)
    const r = resetTournament(t)
    expect(r.id).toBe(t.id)
    expect(r.participants).toEqual(t.participants)
    expect(r.rounds[0].filter((m) => m.winnerId)).toHaveLength(3)
  })
})
