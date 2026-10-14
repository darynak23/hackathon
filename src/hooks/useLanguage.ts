import { useCallback, useSyncExternalStore } from 'react'
import { getLanguage, setLanguage, subscribeLanguage, type Language } from '@/lib/i18n'

/** Språket og en bryter. Kall denne i komponenter som viser tekst, så de tegnes på nytt ved språkbytte. */
export function useLanguage() {
  const language = useSyncExternalStore(subscribeLanguage, getLanguage)
  const toggle = useCallback(() => setLanguage(getLanguage() === 'en' ? 'no' : 'en'), [])
  return { language: language as Language, toggle }
}
