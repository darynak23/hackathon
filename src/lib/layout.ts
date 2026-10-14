import type { Match, Tournament } from '@/types'

// Eies av person 3.
//
// Geometrien for det speilvendte treet: hver kolonne er en vanlig flex-
// kolonne med samme faste høyde og `justify-content: space-around`. Det gir
// matematisk at hver kamp i en senere runde havner nøyaktig midt mellom sine
// to forgjengere, så lenge antall kamper halveres for hver runde (som det
// alltid gjør i en enkel utslagsturnering). Venstre og høyre halvdel regnes
// som to uavhengige, speilvendte under-trær som hver for seg fyller hele
// kolonnehøyden – det er derfor semifinalene på begge sider havner midt på,
// rett ved siden av finalen.

export const SLOT_HEIGHT = 84 // px – reservert høyde per kamp i en kolonne

/** Hvor høy en kolonne bør være, gitt hvor mange kamper runde 1 på denne siden har. */
export function columnHeight(round0CountOnThisSide: number): number {
  return Math.max(round0CountOnThisSide, 1) * SLOT_HEIGHT * 1.6
}

export interface BracketColumn {
  round: number
  side: 'left' | 'right' | 'final'
  matches: Match[]
}

export interface BracketLayout {
  /** Kolonner i den rekkefølgen de skal tegnes: venstre → finale → høyre. */
  columns: BracketColumn[]
  roundCount: number
  /** Antall kamper runde 1 hadde på hver side – styrer kolonnehøyden. */
  round0CountPerSide: number
}

/**
 * Deler kampene i et utslagstre i venstre og høyre halvdel per runde, med
 * finalen alene i midten. Første halvdel av posisjonene i hver runde går til
 * venstre, resten til høyre – slik at begge sider vokser innover mot midten.
 */
export function splitBracket(tournament: Tournament): BracketLayout {
  const rounds = tournament.rounds
  const roundCount = rounds.length
  if (roundCount === 0) {
    return { columns: [], roundCount: 0, round0CountPerSide: 0 }
  }

  const round0CountPerSide = rounds[0].length / 2

  const left: BracketColumn[] = []
  const right: BracketColumn[] = []
  for (let round = 0; round < roundCount - 1; round++) {
    const half = rounds[round].length / 2
    left.push({ round, side: 'left', matches: rounds[round].slice(0, half) })
    right.unshift({ round, side: 'right', matches: rounds[round].slice(half) })
  }

  const final: BracketColumn = {
    round: roundCount - 1,
    side: 'final',
    matches: rounds[roundCount - 1],
  }

  return { columns: [...left, final, ...right], roundCount, round0CountPerSide }
}

/** "Runde 1" / "Kvartfinale" / "Semifinale" / "Finale", regnet fra avstand til finalen. */
export function roundName(roundIndex: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundIndex
  if (fromEnd === 1) return 'Finale'
  if (fromEnd === 2) return 'Semifinale'
  if (fromEnd === 3) return 'Kvartfinale'
  return `Runde ${roundIndex + 1}`
}