import { Link, Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="relative isolate mx-auto flex min-h-svh max-w-7xl flex-col gap-8 p-6 md:p-10">
      <div className="atmosphere" aria-hidden="true" />
      <header>
        <Link to="/" className="brand-mark !mb-0 block !text-3xl">
          Nome Games
        </Link>
      </header>
      <Outlet />
    </div>
  )
}
