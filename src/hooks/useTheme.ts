import { useCallback, useState } from 'react'

/** En av/på-innstilling som lagres som en klasse på <html> og i localStorage. index.html setter den før første render. */
function useHtmlClass(className: string, storageKey: string) {
  const [enabled, setEnabled] = useState(() => document.documentElement.classList.contains(className))

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains(className)
    document.documentElement.classList.toggle(className, next)
    try {
      localStorage.setItem(storageKey, next ? 'on' : 'off')
    } catch {
      // Privat modus uten localStorage: innstillingen gjelder bare denne økten.
    }
    setEnabled(next)
  }, [className, storageKey])

  return [enabled, toggle] as const
}

export function useTheme() {
  const [isDark, toggle] = useHtmlClass('dark', 'nome-tema')
  return { theme: isDark ? ('dark' as const) : ('light' as const), toggle }
}

/** DRAMATIC MODE: all tekst i store bokstaver. */
export function useDramaticMode() {
  const [dramatic, toggle] = useHtmlClass('dramatic', 'nome-dramatisk')
  return { dramatic, toggle }
}
