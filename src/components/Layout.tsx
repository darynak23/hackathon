import { Moon, Plus, Sun, Trophy } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'

export function Layout() {
  const { theme, toggle } = useTheme()

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
            Turneringer
          </NavLink>
          <Button asChild size="sm">
            <Link to="/ny">
              <Plus /> Ny turnering
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Bytt til lys modus' : 'Bytt til mørk modus'}
            title={theme === 'dark' ? 'Lys modus' : 'Mørk modus'}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </nav>
      </header>
      <Outlet />
      <footer className="mt-auto pt-6 text-center text-xs text-muted-foreground">
        Resultatene lagres lokalt i nettleseren.
      </footer>
    </div>
  )
}
