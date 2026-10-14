import { Link, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/hooks/useLanguage'

export function Layout() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="relative isolate mx-auto flex min-h-svh max-w-7xl flex-col gap-8 p-6 md:p-10">
      <div className="atmosphere" aria-hidden="true" />
      <header className="flex items-center justify-between gap-4">
        <Link to="/" className="brand-mark !mb-0 block !text-3xl">
          Nome Games
        </Link>
        <Button
          variant="outline"
          size="sm"
          aria-label={t.switchLanguage}
          title={t.switchLanguage}
          onClick={() => setLanguage(language === 'no' ? 'en' : 'no')}
        >
          {t.switchLanguageShort}
        </Button>
      </header>
      <Outlet />
    </div>
  )
}
