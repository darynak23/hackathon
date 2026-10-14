import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, Shuffle, Wand2 } from 'lucide-react'
import { cn } from 'cn'
import { SegmentedControl } from '@/components/SegmentedControl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { shuffle } from '@/lib/bracket'
import { suggestNames } from '@/lib/names'
import { parseParticipants } from '@/lib/participants'
import { advanceOptions } from '@/lib/tournament'
import {
  DEFAULT_SCORING,
  DEFAULT_SWISS,
  type NewTournamentInput,
  type ParticipantKind,
  type ScoringMode,
  type SeedingMode,
  type Sport,
  type TournamentFormat,
} from '@/types'

export interface CreateTournamentFormProps {
  onSubmit: (input: NewTournamentInput) => void
  initialFormat?: TournamentFormat
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Section({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 rounded-xl border bg-card/80 p-5 shadow-sm backdrop-blur-sm sm:p-6">
      <h2 className="flex items-center gap-3 font-display text-lg font-semibold">
        <span className="grid size-7 place-items-center rounded-full bg-primary text-sm text-primary-foreground">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function NumberStepper({
  value,
  onChange,
  min,
  max,
  label,
}: {
  value: number
  onChange: (n: number) => void
  min: number
  max: number
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="icon" aria-label={`Færre ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </Button>
      <span className="w-8 text-center text-xl font-bold tabular-nums">{value}</span>
      <Button type="button" variant="outline" size="icon" aria-label={`Flere ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </Button>
    </div>
  )
}

export function CreateTournamentForm({ onSubmit, initialFormat = 'elimination' }: CreateTournamentFormProps) {
  const [name, setName] = useState('')
  const [sport, setSport] = useState<Sport>('sjakk')
  const [customSport, setCustomSport] = useState('')
  const [scoring, setScoring] = useState<ScoringMode>(DEFAULT_SCORING.sjakk)
  const [kind, setKind] = useState<ParticipantKind>('individual')
  const [format, setFormat] = useState<TournamentFormat>(initialFormat)
  const [winsToAdvance, setWinsToAdvance] = useState(DEFAULT_SWISS.winsToAdvance)
  const [lossesToEliminate, setLossesToEliminate] = useState(DEFAULT_SWISS.lossesToEliminate)
  const [advanceCount, setAdvanceCount] = useState(8)
  const [seedingMode, setSeedingMode] = useState<SeedingMode>('random')
  const [text, setText] = useState('')
  const [order, setOrder] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const parsed = useMemo(() => parseParticipants(text, kind), [text, kind])
  const byName = new Map(parsed.map((p) => [p.name, p]))
  const ordered = [
    ...order.filter((n) => byName.has(n)),
    ...parsed.map((p) => p.name).filter((n) => !order.includes(n)),
  ]
  const isShuffled = parsed.length > 0 && parsed.every((p) => order.includes(p.name))
  const lineCount = text.split('\n').filter((l) => l.trim()).length
  const removed = lineCount - parsed.length

  const usesSwiss = format !== 'elimination'
  const advanceChoices = advanceOptions(parsed.length)
  const effectiveAdvance = advanceChoices.includes(advanceCount)
    ? advanceCount
    : (advanceChoices.at(-1) ?? 2)

  const errors: string[] = []
  if (!name.trim()) errors.push('Gi turneringen et navn')
  if (sport === 'annet' && !customSport.trim()) errors.push('Skriv hvilken sport det er')
  if (parsed.length < 2) errors.push('Legg inn minst 2 deltakere')
  if (format === 'swissThenElimination' && parsed.length < 3) {
    errors.push('Swiss med sluttspill krever minst 3 deltakere')
  }

  function changeSport(next: Sport) {
    setSport(next)
    setScoring(DEFAULT_SCORING[next])
  }

  function changeSeeding(next: SeedingMode) {
    setSeedingMode(next)
    if (next === 'random') setOrder(shuffle(ordered))
  }

  function move(index: number, delta: number) {
    const next = [...ordered]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setOrder(next)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (errors.length > 0) return
    const finalOrder = seedingMode === 'random' && !isShuffled ? shuffle(ordered) : ordered
    onSubmit({
      name: name.trim(),
      sport,
      ...(sport === 'annet' ? { customSport: customSport.trim() } : {}),
      scoring,
      participantKind: kind,
      format,
      seedingMode,
      ...(usesSwiss ? { swiss: { winsToAdvance, lossesToEliminate } } : {}),
      ...(format === 'swissThenElimination' ? { advanceCount: effectiveAdvance } : {}),
      participants: finalOrder.map((n) => byName.get(n)!),
    })
  }

  return (
    <form className="grid gap-5" onSubmit={submit} noValidate>
      <Section step={1} title="Turneringen">
        <Field label="Navn">
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="F.eks. Lunsjcup høst 2026"
              aria-label="Navn"
              autoFocus
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => setSuggestions(suggestNames({ sport, customSport, format }))}
            >
              <Wand2 /> {suggestions.length > 0 ? 'Nye forslag' : 'Foreslå navn'}
            </Button>
          </div>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label="Navneforslag">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setName(s)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-sm transition-colors outline-none hover:border-amber hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    name === s ? 'border-amber bg-accent text-foreground' : 'bg-card text-muted-foreground',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Sport">
            <Select value={sport} onValueChange={(v) => changeSport(v as Sport)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basket">Basket</SelectItem>
                <SelectItem value="sjakk">Sjakk</SelectItem>
                <SelectItem value="annet">Annet</SelectItem>
              </SelectContent>
            </Select>
            {sport === 'annet' && (
              <Input
                value={customSport}
                onChange={(e) => setCustomSport(e.target.value)}
                placeholder="Hvilken sport?"
                aria-label="Hvilken sport"
              />
            )}
          </Field>
          <Field label="Poengsystem" hint="Velges ut fra sport, men kan endres">
            <SegmentedControl
              label="Poengsystem"
              value={scoring}
              onChange={setScoring}
              options={[
                { value: 'points', label: 'Poeng' },
                { value: 'winLoss', label: 'Vinner/taper' },
              ]}
            />
          </Field>
        </div>
      </Section>

      <Section step={2} title="Format">
        <SegmentedControl
          label="Format"
          variant="cards"
          value={format}
          onChange={setFormat}
          options={[
            { value: 'elimination', label: 'Utslag', description: 'Taperen er ute. Finalen i midten av treet.' },
            { value: 'swiss', label: 'Swiss', description: 'Alle spiller flere runder mot noen med lik stilling.' },
            {
              value: 'swissThenElimination',
              label: 'Swiss + sluttspill',
              description: 'Swiss-fase først, så går de beste til utslagstreet.',
            },
          ]}
        />
        {usesSwiss && (
          <div className="grid gap-5 rounded-lg border border-dashed p-4 sm:grid-cols-3">
            <Field label="Seire for å gå videre">
              <NumberStepper label="seire" value={winsToAdvance} onChange={setWinsToAdvance} min={1} max={5} />
            </Field>
            <Field label="Tap før man er ute">
              <NumberStepper label="tap" value={lossesToEliminate} onChange={setLossesToEliminate} min={1} max={5} />
            </Field>
            {format === 'swissThenElimination' && (
              <Field label="Til sluttspill">
                <Select
                  value={String(effectiveAdvance)}
                  onValueChange={(v) => setAdvanceCount(Number(v))}
                  disabled={advanceChoices.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(advanceChoices.length > 0 ? advanceChoices : [2]).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} går videre
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>
        )}
      </Section>

      <Section step={3} title="Deltakere">
        <SegmentedControl
          label="Deltakertype"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'individual', label: 'Enkeltpersoner' },
            { value: 'team', label: 'Lag' },
          ]}
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <Field
            label={kind === 'team' ? 'Lag, ett per linje' : 'Navn, ett per linje'}
            hint={`${parsed.length} deltakere${removed > 0 ? `, ${removed} duplikat fjernet` : ''}`}
          >
            <Textarea
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={kind === 'team' ? 'Økonomi: Kari, Ola\nUtvikling: Per, Pål\nSalg' : 'Magnus\nHikaru\nFabiano\nDing'}
              className="min-h-56 font-mono text-sm"
            />
            {kind === 'team' && (
              <p className="text-xs text-muted-foreground">Medlemmer er valgfritt: «Lagnavn: navn, navn».</p>
            )}
          </Field>

          <Field
            label="Seeding"
            hint={
              seedingMode === 'seeded'
                ? 'Øverst er seed 1'
                : isShuffled
                  ? 'Denne rekkefølgen brukes'
                  : 'Stokkes når turneringen lages'
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl
                label="Seeding"
                value={seedingMode}
                onChange={changeSeeding}
                options={[
                  { value: 'random', label: 'Tilfeldig' },
                  { value: 'seeded', label: 'Etter seed' },
                ]}
              />
              {seedingMode === 'random' && (
                <Button type="button" variant="outline" size="sm" onClick={() => setOrder(shuffle(ordered))} disabled={ordered.length < 2}>
                  <Shuffle /> {isShuffled ? 'Stokk på nytt' : 'Stokk nå'}
                </Button>
              )}
            </div>
            {ordered.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Rekkefølgen vises her når du har lagt inn deltakere.
              </p>
            ) : (
              <ol className="grid max-h-72 gap-1 overflow-y-auto rounded-lg border bg-background/40 p-1.5">
                {ordered.map((n, i) => (
                  <li key={n} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted">
                    <span className="w-6 text-right font-mono text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                    <span className="flex-1 truncate">{n}</span>
                    {seedingMode === 'seeded' && (
                      <span className="flex gap-0.5">
                        <Button type="button" variant="ghost" size="icon" className="size-7" aria-label={`Flytt ${n} opp`} disabled={i === 0} onClick={() => move(i, -1)}>
                          <ArrowUp />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="size-7" aria-label={`Flytt ${n} ned`} disabled={i === ordered.length - 1} onClick={() => move(i, 1)}>
                          <ArrowDown />
                        </Button>
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Field>
        </div>
      </Section>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        {submitted && errors.length > 0 && (
          <p role="alert" className="text-sm text-destructive sm:mr-auto">
            {errors[0]}
          </p>
        )}
        <Button type="submit" size="lg" className="font-semibold">
          Lag turnering
        </Button>
      </div>
    </form>
  )
}
