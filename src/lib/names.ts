import { getLanguage } from '@/lib/i18n'
import { sportName, type Sport, type TournamentFormat } from '@/types'

export interface NameContext {
  sport: Sport
  customSport?: string
  format: TournamentFormat
  date?: Date
}

type Words = Record<'no' | 'en', string[]>

const NOUNS: Record<Exclude<Sport, 'annet'>, Words> = {
  basket: {
    no: ['Basketcupen', 'Kurvkampen', 'Dunkduellen', 'Trepoengeren', 'Returkampen', 'Hoops-mesterskapet'],
    en: ['Basketball Cup', 'Hoops Championship', 'Dunk Duel', 'Buzzer Beater Cup', 'Court Clash', 'Slam Dunk Open'],
  },
  sjakk: {
    no: ['Sjakkmesterskapet', 'Brettkrigen', 'Lynsjakkcupen', 'Dronningduellen', 'Matt-maratonet', 'Rokadecupen'],
    en: ['Chess Championship', 'Battle of the Board', 'Blitz Cup', 'Queen’s Gambit Cup', 'Checkmate Marathon', 'Castling Cup'],
  },
}

const GENERIC_NOUNS: Words = {
  no: ['Mesterskapet', 'Cupen', 'Kontorduellen', 'Kampen om pokalen', 'Utfordringen'],
  en: ['Championship', 'Cup', 'Office Duel', 'Battle for the Trophy', 'The Challenge'],
}

const FLAVOR: Record<TournamentFormat, string[]> = {
  elimination: ['Knockout', 'Showdown', 'Cup'],
  swiss: ['Swiss Open', 'Open', 'Classic'],
  swissThenElimination: ['Masters', 'Grand Prix', 'Championship'],
}

const TAGLINES: Words = {
  no: ['Hevnens time', 'Kampen om æren', 'Ingen nåde', 'Siste mann står', 'Legenden fortsetter', 'Nå blir det alvor'],
  en: ['Time for Revenge', 'The Fight for Glory', 'No Mercy', 'Last One Standing', 'The Legend Continues', 'Now It Gets Serious'],
}

const SEASONS = {
  winter: { no: 'Vinter', en: 'Winter' },
  spring: { no: 'Vår', en: 'Spring' },
  summer: { no: 'Sommer', en: 'Summer' },
  autumn: { no: 'Høst', en: 'Autumn' },
}

function seasonKey(date: Date): keyof typeof SEASONS {
  const month = date.getMonth()
  if (month <= 1 || month === 11) return 'winter'
  if (month <= 4) return 'spring'
  if (month <= 7) return 'summer'
  return 'autumn'
}

function nounsFor(ctx: NameContext): string[] {
  const lang = getLanguage()
  if (ctx.sport !== 'annet') return NOUNS[ctx.sport][lang]
  const custom = ctx.customSport?.trim()
  if (!custom) return GENERIC_NOUNS[lang]
  const word = custom.charAt(0).toUpperCase() + custom.slice(1)
  return lang === 'en'
    ? [`${word} Cup`, `${word} Championship`, `${word} Duel`, `${word} Showdown`]
    : [`${word}-cupen`, `${word}-mesterskapet`, `${word}-duellen`, `${word}-kampen`]
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]
}

/** Lager `count` ulike navneforslag ut fra sport, format og årstid, på gjeldende språk. */
export function suggestNames(ctx: NameContext, count = 4, random: () => number = Math.random): string[] {
  const lang = getLanguage()
  const date = ctx.date ?? new Date()
  const year = date.getFullYear()
  const sport = ctx.sport === 'annet' && ctx.customSport?.trim() ? ctx.customSport.trim() : sportName(ctx.sport)
  const nouns = nounsFor(ctx)
  const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
  const season = SEASONS[seasonKey(date)][lang]

  const templates: (() => string)[] = [
    () => `${pick(nouns, random)} ${year}`,
    () => `Nome Games ${sport} ${pick(FLAVOR[ctx.format], random)}`,
    () => (lang === 'en' ? `${season} ${pick(nouns, random)}` : `${season}${lowerFirst(pick(nouns, random))}`),
    () => (lang === 'en' ? `The Great ${pick(nouns, random)}` : `Den store ${lowerFirst(pick(nouns, random))}`),
    () => `${pick(nouns, random)}: ${pick(TAGLINES[lang], random)}`,
  ]

  const result = new Set<string>()
  for (let attempt = 0; result.size < count && attempt < count * 20; attempt++) {
    result.add(pick(templates, random)())
  }
  return [...result]
}
