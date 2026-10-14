export type Sport = 'basket' | 'sjakk' | 'annet'

/** 'points': begge får poeng, høyest vinner. 'winLoss': bare vinner/taper. */
export type ScoringMode = 'points' | 'winLoss'

export type ParticipantKind = 'individual' | 'team'

/**
 * 'elimination': bare utslagstre.
 * 'swiss': bare Swiss-fase, tabellen avgjør.
 * 'swissThenElimination': Swiss-fase, deretter utslagstre for de beste.
 */
export type TournamentFormat = 'elimination' | 'swiss' | 'swissThenElimination'

/** 'random': deltakerne stokkes før seed 1–N deles ut. 'seeded': brukeren bestemmer rekkefølgen. */
export type SeedingMode = 'random' | 'seeded'

export type Slot = 'A' | 'B'

export interface Participant {
  id: string
  name: string
  /** 1 er best. */
  seed: number
  /** Bare brukt når participantKind er 'team'. */
  members?: string[]
}

export interface Match {
  /** `r{round}-m{position}` i utslagstreet, `s{round}-m{position}` i Swiss. */
  id: string
  /** 0 er første runde. */
  round: number
  /** Posisjon i runden, 0-indeksert fra toppen. */
  position: number
  /** null betyr tom plass: venter på vinner, walkover i treet eller fri runde i Swiss. */
  participantA: string | null
  participantB: string | null
  scoreA?: number
  scoreB?: number
  winnerId: string | null
  /** Bare i Swiss med vinner/taper (sjakk). */
  isDraw?: boolean
  /** true når den ene plassen aldri får en deltaker (walkover eller fri runde). */
  walkover: boolean
}

export interface SwissConfig {
  /** Antall seire for å gå videre, f.eks. 3. */
  winsToAdvance: number
  /** Antall tap før man er ute, f.eks. 3. */
  lossesToEliminate: number
}

export interface SwissStage {
  config: SwissConfig
  /** Genereres én runde om gangen. */
  rounds: Match[][]
}

export interface Tournament {
  id: string
  name: string
  sport: Sport
  /** Fritekst når sport er 'annet'. */
  customSport?: string
  scoring: ScoringMode
  participantKind: ParticipantKind
  format: TournamentFormat
  seedingMode: SeedingMode
  participants: Participant[]
  /** Finnes når format er 'swiss' eller 'swissThenElimination'. */
  swiss?: SwissStage
  /** Hvor mange som går fra Swiss til sluttspill. */
  advanceCount?: number
  /** Utslagstreet. rounds[0] er første runde, siste element er finalen. Tomt før sluttspillet starter. */
  rounds: Match[][]
  createdAt: string
  updatedAt: string
}

/** Det skjemaet sender inn. Deltakerne står i seed-rekkefølge (første er seed 1). */
export interface NewTournamentInput {
  name: string
  sport: Sport
  customSport?: string
  scoring: ScoringMode
  participantKind: ParticipantKind
  format?: TournamentFormat
  seedingMode?: SeedingMode
  swiss?: SwissConfig
  advanceCount?: number
  participants: (string | { name: string; members?: string[] })[]
}

/** Det ResultDialog sender inn. Poeng brukes bare i poengmodus. */
export interface MatchResult {
  winnerId: string | null
  scoreA?: number
  scoreB?: number
  isDraw?: boolean
}

export const SPORT_LABELS: Record<Sport, string> = {
  basket: 'Basket',
  sjakk: 'Sjakk',
  annet: 'Annet',
}

export const FORMAT_LABELS: Record<TournamentFormat, string> = {
  elimination: 'Utslag',
  swiss: 'Swiss',
  swissThenElimination: 'Swiss + sluttspill',
}

export const SEEDING_LABELS: Record<SeedingMode, string> = {
  random: 'Tilfeldig',
  seeded: 'Etter seed',
}

export const DEFAULT_SCORING: Record<Sport, ScoringMode> = {
  basket: 'points',
  sjakk: 'winLoss',
  annet: 'winLoss',
}

export const DEFAULT_SWISS: SwissConfig = { winsToAdvance: 3, lossesToEliminate: 3 }

export function sportLabel(t: Pick<Tournament, 'sport' | 'customSport'>): string {
  return t.sport === 'annet' && t.customSport ? t.customSport : SPORT_LABELS[t.sport]
}
