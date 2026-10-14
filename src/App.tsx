import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LanguageProvider } from '@/components/LanguageProvider'
import { Layout } from '@/components/Layout'
import { HomePage } from '@/pages/HomePage'
import { NewTournamentPage } from '@/pages/NewTournamentPage'
import { TournamentPage } from '@/pages/TournamentPage'
import './App.css'

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="ny" element={<NewTournamentPage />} />
            <Route path="turnering/:id" element={<TournamentPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
