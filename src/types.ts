export type Sport =
  | 'basket'
  | 'fotball'
  | 'handball'
  | 'volleyball'
  | 'ishockey'
  | 'bordtennis'
  | 'tennis'
  | 'sjakk'
  | 'esport'
  | 'annet'

/** 'points': begge får poeng, høyest vinner. 'winLoss': bare vinner/taper. */
export type ScoringMode = 'points' | 'winLoss'

export type ParticipantKind = 'individual' | 'team'

/** Nye formater (f.eks. 'roundRobin') legges til her etter avtale med person 1. */
export type TournamentFormat = 'singleElimination'

export type Slot = 'A' | 'B'

export interface Participant {
  id: string
  name: string
  /** Bare brukt når participantKind er 'team'. */
  members?: string[]
}

export interface Match {
  /** Format: `r{round}-p{position}`, f.eks. 'r0-p3'. */
  id: string
  /** 0 er første runde. */
  round: number
  /** Posisjon i runden, 0-indeksert fra toppen. */
  position: number
  /** null betyr tom plass (venter på vinner, eller walkover). */
  participantA: string | null
  participantB: string | null
  scoreA: number | null
  scoreB: number | null
  winnerId: string | null
  /** true når en av plassene aldri får en deltaker (bye). */
  isWalkover: boolean
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
  participants: Participant[]
  /** rounds[0] er første runde, siste element er finalen. */
  rounds: Match[][]
  createdAt: string
  updatedAt: string
}

/** Det skjemaet sender inn til createTournament. */
export interface NewTournamentInput {
  name: string
  sport: Sport
  customSport?: string
  scoring: ScoringMode
  participantKind: ParticipantKind
  format: TournamentFormat
  participants: { name: string; members?: string[] }[]
}

/** Det ResultDialog sender inn. Poeng er null i winLoss-modus. */
export interface MatchResult {
  winnerId: string
  scoreA: number | null
  scoreB: number | null
}

export type ValidationResult = { ok: true } | { ok: false; error: string }

export const SPORT_LABELS: Record<Sport, string> = {
  basket: 'Basket',
  fotball: 'Fotball',
  handball: 'Håndball',
  volleyball: 'Volleyball',
  ishockey: 'Ishockey',
  bordtennis: 'Bordtennis',
  tennis: 'Tennis',
  sjakk: 'Sjakk',
  esport: 'E-sport',
  annet: 'Annet',
}

export function sportLabel(t: Pick<Tournament, 'sport' | 'customSport'>): string {
  return t.sport === 'annet' && t.customSport ? t.customSport : SPORT_LABELS[t.sport]
}

export const DEFAULT_SCORING: Record<Sport, ScoringMode> = {
  basket: 'points',
  fotball: 'points',
  handball: 'points',
  volleyball: 'points',
  ishockey: 'points',
  bordtennis: 'points',
  tennis: 'winLoss',
  sjakk: 'winLoss',
  esport: 'winLoss',
  annet: 'winLoss',
}
