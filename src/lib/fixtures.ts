import type { Match, Participant, Tournament } from '@/types'

function match(
  round: number,
  position: number,
  participantA: string | null,
  participantB: string | null,
  result: { winnerId: string; scoreA?: number; scoreB?: number } | null = null,
  isWalkover = false,
): Match {
  return {
    id: `r${round}-p${position}`,
    round,
    position,
    participantA,
    participantB,
    scoreA: result?.scoreA ?? null,
    scoreB: result?.scoreB ?? null,
    winnerId: result?.winnerId ?? null,
    isWalkover,
  }
}

function people(names: string[]): Participant[] {
  return names.map((name, i) => ({ id: `p${i}`, name }))
}

/** Sjakk, 8 spillere, vinner/taper. Runde 1 ferdig, semifinalen halvveis. */
export const chessFixture: Tournament = {
  id: 'fixture-chess',
  name: 'Lynsjakk fredag',
  sport: 'sjakk',
  scoring: 'winLoss',
  participantKind: 'individual',
  format: 'singleElimination',
  participants: people(['Magnus', 'Hikaru', 'Fabiano', 'Ding', 'Alireza', 'Ian', 'Wesley', 'Anish']),
  rounds: [
    [
      match(0, 0, 'p0', 'p1', { winnerId: 'p0' }),
      match(0, 1, 'p2', 'p3', { winnerId: 'p3' }),
      match(0, 2, 'p4', 'p5', { winnerId: 'p4' }),
      match(0, 3, 'p6', 'p7', { winnerId: 'p7' }),
    ],
    [match(1, 0, 'p0', 'p3', { winnerId: 'p0' }), match(1, 1, 'p4', 'p7')],
    [match(2, 0, 'p0', null)],
  ],
  createdAt: '2026-10-14T08:00:00.000Z',
  updatedAt: '2026-10-14T08:00:00.000Z',
}

/** Basket, 5 lag, poeng. 8 plasser, 3 walkovers, 3 lag rett til runde 2. */
export const basketFixture: Tournament = {
  id: 'fixture-basket',
  name: 'Basketcup lunsj',
  sport: 'basket',
  scoring: 'points',
  participantKind: 'team',
  format: 'singleElimination',
  participants: [
    { id: 'p0', name: 'Økonomi', members: ['Kari', 'Ola'] },
    { id: 'p1', name: 'Utvikling', members: ['Per', 'Pål'] },
    { id: 'p2', name: 'Salg', members: ['Espen', 'Askeladd'] },
    { id: 'p3', name: 'Innkjøp', members: ['Nora', 'Emil'] },
    { id: 'p4', name: 'Ledelse', members: ['Sofie', 'Jonas'] },
  ],
  rounds: [
    [
      match(0, 0, 'p0', 'p1', { winnerId: 'p1', scoreA: 58, scoreB: 62 }),
      match(0, 1, 'p2', null, { winnerId: 'p2' }, true),
      match(0, 2, 'p3', null, { winnerId: 'p3' }, true),
      match(0, 3, 'p4', null, { winnerId: 'p4' }, true),
    ],
    [match(1, 0, 'p1', 'p2'), match(1, 1, 'p3', 'p4')],
    [match(2, 0, null, null)],
  ],
  createdAt: '2026-10-14T08:00:00.000Z',
  updatedAt: '2026-10-14T08:00:00.000Z',
}

export const fixtures: Tournament[] = [chessFixture, basketFixture]
