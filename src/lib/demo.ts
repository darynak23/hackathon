import type { Tournament } from '@/types'
import { simulate } from './fixtures'
import { startTournament } from './tournament'

/**
 * Demoen fra manuset: en ferdig sjakkturnering, og en basketturnering med Swiss
 * og sluttspill der Swiss-fasen er ferdig og sluttspillet er halvveis.
 */
export function createDemoTournaments(): Tournament[] {
  const chess = simulate(
    startTournament({
      name: 'Sjakk-NM for ansatte',
      sport: 'sjakk',
      scoring: 'winLoss',
      participantKind: 'individual',
      format: 'elimination',
      seedingMode: 'seeded',
      participants: ['Magnus', 'Hikaru', 'Fabiano', 'Ding', 'Alireza', 'Ian', 'Wesley', 'Anish'],
    }),
  )

  const basketTeams = ['Økonomi', 'Utvikling', 'Salg', 'Innkjøp', 'Ledelse', 'HR', 'Lager', 'Kundeservice']
  const basket = startTournament({
    name: 'Basketcup Nome Games',
    sport: 'basket',
    scoring: 'points',
    participantKind: 'team',
    format: 'swissThenElimination',
    seedingMode: 'seeded',
    swiss: { winsToAdvance: 2, lossesToEliminate: 2 },
    advanceCount: 4,
    participants: basketTeams.map((name) => ({ name })),
  })
  // 8 lag med 2 seire/2 tap gir 10 Swiss-kamper. Én kamp til spiller den første semifinalen.
  return [chess, simulate(basket, 11)]
}
