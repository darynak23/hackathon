import { useContext } from 'react'
import { LanguageContext } from '@/lib/i18n'

export function useLanguage() {
  return useContext(LanguageContext)
}
