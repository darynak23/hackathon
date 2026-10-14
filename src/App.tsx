import { useState } from 'react'
import { SETUP_OPTIONS, type SetupMode } from './types'
import './App.css'

function App() {
  const [selectedMode, setSelectedMode] = useState<SetupMode | null>(null)

  function handleSelect(mode: SetupMode) {
    setSelectedMode(mode)
    // Neste steg: gå videre til opprett-turnering med dette valget
    console.log('Valgt oppsett:', mode)
  }

  return (
    <div className="page">
      <div className="atmosphere" aria-hidden="true" />

      <header className="brand">
        <p className="brand-mark">Nome Games AS</p>
        <h1 className="brand-title">Turnering</h1>
        <p className="brand-lead">
          Velg hvordan turneringen skal settes opp. Resultatene lagres lokalt i
          nettleseren.
        </p>
      </header>

      <main className="setup">
        <p className="setup-label">Oppsett</p>
        <div className="setup-actions" role="group" aria-label="Turneringsoppsett">
          {SETUP_OPTIONS.map((option) => {
            const isActive = selectedMode === option.id
            return (
              <button
                key={option.id}
                type="button"
                className={`setup-btn${isActive ? ' is-active' : ''}`}
                aria-pressed={isActive}
                onClick={() => handleSelect(option.id)}
              >
                <span className="setup-btn-label">{option.label}</span>
                <span className="setup-btn-desc">{option.description}</span>
              </button>
            )
          })}
        </div>

        {selectedMode && (
          <p className="setup-status" role="status">
            Valgt:{' '}
            <strong>
              {SETUP_OPTIONS.find((o) => o.id === selectedMode)?.label}
            </strong>
            . Neste steg blir å legge inn deltakere.
          </p>
        )}
      </main>
    </div>
  )
}

export default App
