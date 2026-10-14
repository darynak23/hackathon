// Enkelt språkstøtte: norsk (standard) og engelsk.
//
// Hver tekst skrives som et par: tx('norsk', 'english'). Språket ligger i én global verdi, så
// både komponenter og vanlig logikk (feilmeldinger, statuslinjer) kan bruke det. Komponenter som
// viser tekst kaller useLanguage() (src/hooks/useLanguage.ts), slik at de tegnes på nytt når
// språket byttes.

export type Language = 'no' | 'en'

export const LANGUAGE_STORAGE_KEY = 'nome-sprak'

function readStoredLanguage(): Language {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'no'
  } catch {
    return 'no'
  }
}

let current: Language = readStoredLanguage()
const listeners = new Set<() => void>()

export function getLanguage(): Language {
  return current
}

export function setLanguage(language: Language): void {
  if (language === current) return
  current = language
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Privat modus uten localStorage: valget gjelder bare denne økten.
  }
  if (typeof document !== 'undefined') document.documentElement.lang = language
  listeners.forEach((listener) => listener())
}

export function subscribeLanguage(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Velger teksten for gjeldende språk. */
export function tx(no: string, en: string): string {
  return current === 'en' ? en : no
}

/** «1 deltaker» / «3 deltakere». */
export function plural(count: number, no: [string, string], en: [string, string]): string {
  const [one, many] = current === 'en' ? en : no
  return count === 1 ? one : many
}

/** Dato og klokkeslett på gjeldende språk. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(current === 'en' ? 'en-GB' : 'nb-NO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
