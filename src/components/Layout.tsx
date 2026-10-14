import { useEffect } from 'react'
import { Languages, Megaphone, Moon, Plus, Sun, Trophy } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useDramaticMode, useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/hooks/useLanguage'
import { tx } from '@/lib/i18n'

export function Layout() {
  const { theme, toggle } = useTheme()
  const { dramatic, toggle: toggleDramatic } = useDramaticMode()
  const { language, toggle: toggleLanguage } = useLanguage()

  useEffect(() => {
    document.title = tx('Nome Games – Turnering', 'Nome Games – Tournament')
    document.documentElement.lang = language
  }, [language])

  return (
    <div className="relative isolate mx-auto flex min-h-svh max-w-[1400px] flex-col gap-8 px-4 py-5 sm:px-6 md:px-10 md:py-8">
      <div className="atmosphere" aria-hidden="true" />
      <header className="flex items-center justify-between gap-4">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:-rotate-6">
            <Trophy className="size-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight whitespace-nowrap sm:text-xl">
            Nome <span className="text-amber">Games</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1.5">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `hidden rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:text-foreground sm:block ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`
            }
          >
            {tx('Turneringer', 'Tournaments')}
          </NavLink>
          <Button asChild size="sm">
            <Link to="/ny">
              <Plus /> {tx('Ny turnering', 'New tournament')}
            </Link>
          </Button>
          <Button
            variant={dramatic ? 'default' : 'ghost'}
            size="icon"
            onClick={toggleDramatic}
            aria-pressed={dramatic}
            aria-label="Dramatic mode"
            title={
              dramatic
                ? tx('Slå av dramatic mode', 'Turn off dramatic mode')
                : tx('Dramatic mode: all tekst i store bokstaver', 'Dramatic mode: all text in capitals')
            }
          >
            <Megaphone />
          </Button>
          <Button
            variant="ghost"
            className="gap-1 px-2 font-semibold"
            onClick={toggleLanguage}
            aria-label={tx('Switch to English', 'Bytt til norsk')}
            title={tx('Switch to English', 'Bytt til norsk')}
          >
            <Languages /> {language === 'en' ? 'EN' : 'NO'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={theme === 'dark' ? tx('Bytt til lys modus', 'Switch to light mode') : tx('Bytt til mørk modus', 'Switch to dark mode')}
            title={theme === 'dark' ? tx('Lys modus', 'Light mode') : tx('Mørk modus', 'Dark mode')}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </nav>
      </header>
      <Outlet />
      <footer className="mt-auto pt-6 text-center text-xs text-muted-foreground">
        {tx('Resultatene lagres lokalt i nettleseren.', 'Results are stored locally in the browser.')}
      </footer>
    </div>
  )
}
