import { createContext } from 'react'
import type { Sport, Tournament } from '@/types'

export type Language = 'no' | 'en'

const no = {
  switchLanguage: 'Switch to English',
  switchLanguageShort: 'EN',

  // Forside
  tournaments: 'Turneringer',
  homeLead:
    'Lag utslagsturneringer for basket, sjakk og alt annet. Resultatene lagres lokalt i nettleseren.',
  newTournament: 'Ny turnering',
  fillDemo: 'Fyll inn demo',
  export: 'Eksporter',
  import: 'Importer',
  imported: (count: number) => `Importerte ${count} turnering${count === 1 ? '' : 'er'}.`,
  importFailed: 'Kunne ikke importere filen',
  noTournaments: 'Ingen turneringer ennå.',
  createFirst: 'Lag den første',
  participants: (count: number) => `${count} deltakere`,
  delete: 'Slett',
  deleteLabel: (name: string) => `Slett ${name}`,
  confirmDelete: (name: string) => `Slette «${name}»?`,
  winner: 'Vinner',
  inProgress: 'Pågår',
  exportFileName: 'turneringer.json',

  // Turneringsside
  tournamentNotFound: 'Fant ikke turneringen',
  backToHome: 'Tilbake til forsiden',
  scoringPoints: 'Poeng',
  scoringWinLoss: 'Vinner/taper',
  confirmReset: 'Nullstille alle resultater? Deltakerne beholdes.',
  resetTournament: 'Nullstill turnering',

  // Skjema
  name: 'Navn',
  sport: 'Sport',
  participantsOnePerLine: 'Deltakere (én per linje)',
  createTournament: (count: number) => `Lag turnering (${count} deltakere)`,
  sports: { basket: 'Basket', sjakk: 'Sjakk', annet: 'Annet' } as Record<Sport, string>,

  // Resultatdialog
  versus: 'mot',
  enterScores: 'Skriv inn poeng.',
  clickWinner: 'Klikk på vinneren.',
  clearResult: 'Fjern resultat',
  save: 'Lagre',

  // Treet
  noMatches: 'Ingen kamper å vise ennå.',
  openMatch: 'Åpne resultat for kampen',
  waiting: 'Venter',
  walkover: 'Walkover',
  noWinnerYet: 'Ingen vinner ennå',
  final: 'Finale',
  semifinal: 'Semifinale',
  quarterfinal: 'Kvartfinale',
  round: (n: number) => `Runde ${n}`,

  /** Feilmeldinger fra lib/ er på norsk; her er de engelske motstykkene. */
  errors: {} as Record<string, string>,
}

export type Dictionary = typeof no

const en: Dictionary = {
  switchLanguage: 'Bytt til norsk',
  switchLanguageShort: 'NO',

  tournaments: 'Tournaments',
  homeLead:
    'Create knockout tournaments for basketball, chess and anything else. Results are stored locally in your browser.',
  newTournament: 'New tournament',
  fillDemo: 'Load demo',
  export: 'Export',
  import: 'Import',
  imported: (count: number) => `Imported ${count} tournament${count === 1 ? '' : 's'}.`,
  importFailed: 'Could not import the file',
  noTournaments: 'No tournaments yet.',
  createFirst: 'Create the first one',
  participants: (count: number) => `${count} participants`,
  delete: 'Delete',
  deleteLabel: (name: string) => `Delete ${name}`,
  confirmDelete: (name: string) => `Delete “${name}”?`,
  winner: 'Winner',
  inProgress: 'In progress',
  exportFileName: 'tournaments.json',

  tournamentNotFound: 'Tournament not found',
  backToHome: 'Back to home',
  scoringPoints: 'Points',
  scoringWinLoss: 'Win/loss',
  confirmReset: 'Reset all results? Participants are kept.',
  resetTournament: 'Reset tournament',

  name: 'Name',
  sport: 'Sport',
  participantsOnePerLine: 'Participants (one per line)',
  createTournament: (count: number) => `Create tournament (${count} participants)`,
  sports: { basket: 'Basketball', sjakk: 'Chess', annet: 'Other' },

  versus: 'vs',
  enterScores: 'Enter the scores.',
  clickWinner: 'Click the winner.',
  clearResult: 'Clear result',
  save: 'Save',

  noMatches: 'No matches to show yet.',
  openMatch: 'Open match result',
  waiting: 'Waiting',
  walkover: 'Walkover',
  noWinnerYet: 'No winner yet',
  final: 'Final',
  semifinal: 'Semifinal',
  quarterfinal: 'Quarterfinal',
  round: (n: number) => `Round ${n}`,

  errors: {
    'Vinneren må være en av de to deltakerne': 'The winner must be one of the two participants',
    'Uavgjort er ikke lov': 'Draws are not allowed',
    'Filen er ikke gyldig JSON': 'The file is not valid JSON',
    'Fant ingen turneringer i filen': 'No tournaments found in the file',
  },
}

export const dictionaries: Record<Language, Dictionary> = { no, en }

export interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: Dictionary
}

export const LanguageContext = createContext<LanguageContextValue>({
  language: 'no',
  setLanguage: () => {},
  t: no,
})

/** Oversetter en feilmelding fra lib/ hvis vi kjenner den, ellers vises den som den er. */
export function translateError(t: Dictionary, message: string): string {
  return t.errors[message] ?? message
}

/** Som `sportLabel` i types.ts, men på valgt språk. */
export function sportName(t: Dictionary, tournament: Pick<Tournament, 'sport' | 'customSport'>) {
  return tournament.sport === 'annet' && tournament.customSport
    ? tournament.customSport
    : t.sports[tournament.sport]
}

/** Som `roundName` i layout.ts, men på valgt språk. */
export function roundLabel(t: Dictionary, roundIndex: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundIndex
  if (fromEnd === 1) return t.final
  if (fromEnd === 2) return t.semifinal
  if (fromEnd === 3) return t.quarterfinal
  return t.round(roundIndex + 1)
}
