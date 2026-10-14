import type { Match, Tournament } from '@/types'

// Eies av person 3.

export interface SplitBracket {
  /** Venstre side, runde 0 først og innover mot finalen. */
  left: Match[][]
  /** Høyre side, runde 0 først og innover mot finalen. */
  right: Match[][]
  final: Match | null
}

export function splitBracket(tournament: Tournament): SplitBracket {
  const rounds = tournament.rounds
  const final = rounds.at(-1)?.[0] ?? null
  const inner = rounds.slice(0, -1)
  return {
    left: inner.map((round) => round.slice(0, round.length / 2)),
    right: inner.map((round) => round.slice(round.length / 2)),
    final,
  }
}

export function roundName(roundIndex: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundIndex
  if (fromEnd === 1) return 'Finale'
  if (fromEnd === 2) return 'Semifinale'
  if (fromEnd === 3) return 'Kvartfinale'
  return `Runde ${roundIndex + 1}`
}
