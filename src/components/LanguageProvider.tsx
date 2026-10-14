import { useEffect, useState, type ReactNode } from 'react'
import { dictionaries, LanguageContext, type Language } from '@/lib/i18n'

const STORAGE_KEY = 'nome-turnering:language'

function readStoredLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'no'
  } catch {
    return 'no'
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(readStoredLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch {
      // lagring er bare en bekvemmelighet
    }
  }, [language])

  return (
    <LanguageContext value={{ language, setLanguage, t: dictionaries[language] }}>
      {children}
    </LanguageContext>
  )
}
