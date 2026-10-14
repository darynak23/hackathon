import { SPORT_LABELS, type Sport, type TournamentFormat } from '@/types'

export interface NameContext {
  sport: Sport
  customSport?: string
  format: TournamentFormat
  date?: Date
}

const NOUNS: Record<Exclude<Sport, 'annet'>, string[]> = {
  basket: ['Basketcupen', 'Kurvkampen', 'Dunkduellen', 'Trepoengeren', 'Returkampen', 'Hoops-mesterskapet'],
  sjakk: ['Sjakkmesterskapet', 'Brettkrigen', 'Lynsjakkcupen', 'Dronningduellen', 'Matt-maratonet', 'Rokadecupen'],
}

const GENERIC_NOUNS = ['Mesterskapet', 'Cupen', 'Kontorduellen', 'Kampen om pokalen', 'Utfordringen']

const FLAVOR: Record<TournamentFormat, string[]> = {
  elimination: ['Knockout', 'Showdown', 'Cup'],
  swiss: ['Swiss Open', 'Open', 'Classic'],
  swissThenElimination: ['Masters', 'Grand Prix', 'Championship'],
}

const TAGLINES = ['Hevnens time', 'Kampen om æren', 'Ingen nåde', 'Siste mann står', 'Legenden fortsetter', 'Nå blir det alvor']

function season(date: Date): string {
  const month = date.getMonth()
  if (month <= 1 || month === 11) return 'Vinter'
  if (month <= 4) return 'Vår'
  if (month <= 7) return 'Sommer'
  return 'Høst'
}

function nounsFor(ctx: NameContext): string[] {
  if (ctx.sport !== 'annet') return NOUNS[ctx.sport]
  const custom = ctx.customSport?.trim()
  if (!custom) return GENERIC_NOUNS
  const word = custom.charAt(0).toUpperCase() + custom.slice(1)
  return [`${word}-cupen`, `${word}-mesterskapet`, `${word}-duellen`, `${word}-kampen`]
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]
}

/** Lager `count` ulike navneforslag ut fra sport, format og årstid. */
export function suggestNames(ctx: NameContext, count = 4, random: () => number = Math.random): string[] {
  const date = ctx.date ?? new Date()
  const year = date.getFullYear()
  const sportName = ctx.sport === 'annet' && ctx.customSport?.trim() ? ctx.customSport.trim() : SPORT_LABELS[ctx.sport]
  const nouns = nounsFor(ctx)
  const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

  const templates: (() => string)[] = [
    () => `${pick(nouns, random)} ${year}`,
    () => `Nome Games ${sportName} ${pick(FLAVOR[ctx.format], random)}`,
    () => `${season(date)}${lowerFirst(pick(nouns, random))}`,
    () => `Den store ${lowerFirst(pick(nouns, random))}`,
    () => `${pick(nouns, random)}: ${pick(TAGLINES, random)}`,
  ]

  const result = new Set<string>()
  for (let attempt = 0; result.size < count && attempt < count * 20; attempt++) {
    result.add(pick(templates, random)())
  }
  return [...result]
}
