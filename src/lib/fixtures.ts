import type { Match, NewTournamentInput, Tournament } from '@/types'
import { getParticipant, isPlayable } from './bracket'
import * as tournament from './tournament'

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Forutsigbart resultat: best seed vinner som regel, men hver tredje kamp er en overraskelse. */
function scriptedResult(t: Tournament, match: Match) {
  const a = getParticipant(t, match.participantA)!
  const b = getParticipant(t, match.participantB)!
  const h = hash(`${t.name}:${match.id}`)
  const favourite = a.seed < b.seed ? a : b
  const underdog = favourite === a ? b : a
  const winner = h % 3 === 0 ? underdog : favourite
  if (t.scoring === 'winLoss') return { winnerId: winner.id }
  const high = 60 + (h % 25)
  const low = high - 1 - ((h >> 5) % 14)
  return winner === a
    ? { winnerId: a.id, scoreA: high, scoreB: low }
    : { winnerId: b.id, scoreA: low, scoreB: high }
}

/** Spiller de neste `limit` spillbare kampene (alle hvis udefinert), og starter nye Swiss-runder og sluttspill underveis. */
export function simulate(t: Tournament, limit = Infinity): Tournament {
  let played = 0
  for (;;) {
    const open = [...(t.swiss?.rounds.flat() ?? []), ...t.rounds.flat()].find(
      (m) => tournament.isEditable(t, m) && isPlayable(m) && m.winnerId === null && !m.isDraw,
    )
    if (open && played < limit) {
      t = tournament.recordResult(t, open.id, scriptedResult(t, open))
      played++
      continue
    }
    if (played >= limit) return t
    if (tournament.canStartNextSwissRound(t)) t = tournament.startNextSwissRound(t)
    else if (tournament.canStartPlayoffs(t)) t = tournament.startPlayoffs(t)
    else return t
  }
}

function fixture(id: string, input: NewTournamentInput, played = Infinity): Tournament {
  const t = simulate(tournament.startTournament(input), played)
  const stamp = '2026-10-14T08:00:00.000Z'
  return { ...t, id, createdAt: stamp, updatedAt: stamp }
}

const chessPlayers = ['Magnus', 'Hikaru', 'Fabiano', 'Ding', 'Alireza', 'Ian', 'Wesley', 'Anish']

/** Sjakk, 8 spillere, utslag, vinner/taper. Ferdig spilt. */
export const chessFixture = fixture('fixture-chess', {
  name: 'Lynsjakk fredag',
  sport: 'sjakk',
  scoring: 'winLoss',
  participantKind: 'individual',
  format: 'elimination',
  seedingMode: 'seeded',
  participants: chessPlayers,
})

/** Basket, 5 lag, utslag, poeng. 8 plasser, 3 walkovers. Første kamp spilt. */
export const basketFixture = fixture(
  'fixture-basket',
  {
    name: 'Basketcup lunsj',
    sport: 'basket',
    scoring: 'points',
    participantKind: 'team',
    format: 'elimination',
    seedingMode: 'seeded',
    participants: [
      { name: 'Økonomi', members: ['Kari', 'Ola'] },
      { name: 'Utvikling', members: ['Per', 'Pål'] },
      { name: 'Salg', members: ['Espen', 'Askeladd'] },
      { name: 'Innkjøp', members: ['Nora', 'Emil'] },
      { name: 'Ledelse', members: ['Sofie', 'Jonas'] },
    ],
  },
  1,
)

/** Sjakk, 16 spillere, Swiss med sluttspill for 8. Midt i Swiss-fasen. */
export const swissFixture = fixture(
  'fixture-swiss',
  {
    name: 'Swiss-mesterskap',
    sport: 'sjakk',
    scoring: 'winLoss',
    participantKind: 'individual',
    format: 'swissThenElimination',
    seedingMode: 'seeded',
    swiss: { winsToAdvance: 3, lossesToEliminate: 3 },
    advanceCount: 8,
    participants: [...chessPlayers, 'Judit', 'Hou', 'Ju', 'Vishy', 'Levon', 'Teimour', 'Richard', 'Maxime'],
  },
  20,
)

export const fixtures: Tournament[] = [chessFixture, basketFixture, swissFixture]
