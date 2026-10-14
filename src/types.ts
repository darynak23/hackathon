/** Oppsettvalg på forsiden – utvides senere med sport, faser osv. */
export type SetupMode = 'swiss' | 'seeding' | 'tilfeldig'

export const SETUP_OPTIONS: {
  id: SetupMode
  label: string
  description: string
}[] = [
  {
    id: 'swiss',
    label: 'Swiss',
    description: 'Alle spiller flere runder. Beste går videre.',
  },
  {
    id: 'seeding',
    label: 'Seeding',
    description: 'Plasserer deltakere etter seed i utslagstreet.',
  },
  {
    id: 'tilfeldig',
    label: 'Tilfeldig',
    description: 'Stokker deltakere og lager trekningen automatisk.',
  },
]
