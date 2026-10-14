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
  formatLabel,
  seedingLabel,
  sportName,
  type NewTournamentInput,
  type ParticipantKind,
  type ScoringMode,
  type SeedingMode,
  type Sport,
  type TournamentFormat,
} from '@/types'
import { useLanguage } from '@/hooks/useLanguage'
import { tx } from '@/lib/i18n'

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
      <Button type="button" variant="outline" size="icon" aria-label={tx(`Færre ${label}`, `Fewer ${label}`)} disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </Button>
      <span className="w-8 text-center text-xl font-bold tabular-nums">{value}</span>
      <Button type="button" variant="outline" size="icon" aria-label={tx(`Flere ${label}`, `More ${label}`)} disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </Button>
    </div>
  )
}

export function CreateTournamentForm({ onSubmit, initialFormat = 'elimination' }: CreateTournamentFormProps) {
  useLanguage()
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
  if (!name.trim()) errors.push(tx('Gi turneringen et navn', 'Give the tournament a name'))
  if (sport === 'annet' && !customSport.trim()) errors.push(tx('Skriv hvilken sport det er', 'Enter which sport it is'))
  if (parsed.length < 2) errors.push(tx('Legg inn minst 2 deltakere', 'Enter at least 2 participants'))
  if (format === 'swissThenElimination' && parsed.length < 3) {
    errors.push(tx('Swiss med sluttspill krever minst 3 deltakere', 'Swiss with playoffs needs at least 3 participants'))
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
      <Section step={1} title={tx('Turneringen', 'The tournament')}>
        <Field label={tx('Navn', 'Name')}>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tx('F.eks. Lunsjcup høst 2026', 'E.g. Lunch Cup Autumn 2026')}
              aria-label={tx('Navn', 'Name')}
              autoFocus
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => setSuggestions(suggestNames({ sport, customSport, format }))}
            >
              <Wand2 /> {suggestions.length > 0 ? tx('Nye forslag', 'New suggestions') : tx('Foreslå navn', 'Suggest names')}
            </Button>
          </div>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label={tx('Navneforslag', 'Name suggestions')}>
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
                <SelectItem value="basket">{sportName('basket')}</SelectItem>
                <SelectItem value="sjakk">{sportName('sjakk')}</SelectItem>
                <SelectItem value="annet">{sportName('annet')}</SelectItem>
              </SelectContent>
            </Select>
            {sport === 'annet' && (
              <Input
                value={customSport}
                onChange={(e) => setCustomSport(e.target.value)}
                placeholder={tx('Hvilken sport?', 'Which sport?')}
                aria-label={tx('Hvilken sport', 'Which sport')}
              />
            )}
          </Field>
          <Field label={tx('Poengsystem', 'Scoring')} hint={tx('Velges ut fra sport, men kan endres', 'Chosen from the sport, but can be changed')}>
            <SegmentedControl
              label={tx('Poengsystem', 'Scoring')}
              value={scoring}
              onChange={setScoring}
              options={[
                { value: 'points', label: tx('Poeng', 'Points') },
                { value: 'winLoss', label: tx('Vinner/taper', 'Win/loss') },
              ]}
            />
          </Field>
        </div>
      </Section>

      <Section step={2} title={tx('Format', 'Format')}>
        <SegmentedControl
          label="Format"
          variant="cards"
          value={format}
          onChange={setFormat}
          options={[
            {
              value: 'elimination',
              label: formatLabel('elimination'),
              description: tx('Taperen er ute. Finalen i midten av treet.', 'The loser is out. The final is in the middle of the bracket.'),
            },
            {
              value: 'swiss',
              label: 'Swiss',
              description: tx('Alle spiller flere runder mot noen med lik stilling.', 'Everyone plays several rounds against opponents with the same record.'),
            },
            {
              value: 'swissThenElimination',
              label: formatLabel('swissThenElimination'),
              description: tx('Swiss-fase først, så går de beste til utslagstreet.', 'A Swiss stage first, then the best go on to the knockout bracket.'),
            },
          ]}
        />
        {usesSwiss && (
          <div className="grid gap-5 rounded-lg border border-dashed p-4 sm:grid-cols-3">
            <Field label={tx('Seire for å gå videre', 'Wins to advance')}>
              <NumberStepper label={tx('seire', 'wins')} value={winsToAdvance} onChange={setWinsToAdvance} min={1} max={5} />
            </Field>
            <Field label={tx('Tap før man er ute', 'Losses before elimination')}>
              <NumberStepper label={tx('tap', 'losses')} value={lossesToEliminate} onChange={setLossesToEliminate} min={1} max={5} />
            </Field>
            {format === 'swissThenElimination' && (
              <Field label={tx('Til sluttspill', 'To the playoffs')}>
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
                        {tx(`${n} går videre`, `${n} advance`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>
        )}
      </Section>

      <Section step={3} title={tx('Deltakere', 'Participants')}>
        <SegmentedControl
          label={tx('Deltakertype', 'Participant type')}
          value={kind}
          onChange={setKind}
          options={[
            { value: 'individual', label: tx('Enkeltpersoner', 'Individuals') },
            { value: 'team', label: tx('Lag', 'Teams') },
          ]}
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <Field
            label={
              kind === 'team'
                ? tx('Lag, ett per linje', 'Teams, one per line')
                : tx('Navn, ett per linje', 'Names, one per line')
            }
            hint={
              tx(`${parsed.length} deltakere`, `${parsed.length} participants`) +
              (removed > 0 ? tx(`, ${removed} duplikat fjernet`, `, ${removed} duplicate removed`) : '')
            }
          >
            <Textarea
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                kind === 'team'
                  ? tx('Økonomi: Kari, Ola\nUtvikling: Per, Pål\nSalg', 'Finance: Kari, Ola\nDevelopment: Per, Paul\nSales')
                  : 'Magnus\nHikaru\nFabiano\nDing'
              }
              className="min-h-56 font-mono text-sm"
            />
            {kind === 'team' && (
              <p className="text-xs text-muted-foreground">{tx('Medlemmer er valgfritt: «Lagnavn: navn, navn».', 'Members are optional: “Team name: name, name”.')}</p>
            )}
          </Field>

          <Field
            label="Seeding"
            hint={
              seedingMode === 'seeded'
                ? tx('Øverst er seed 1', 'Top is seed 1')
                : isShuffled
                  ? tx('Denne rekkefølgen brukes', 'This order will be used')
                  : tx('Stokkes når turneringen lages', 'Shuffled when the tournament is created')
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl
                label="Seeding"
                value={seedingMode}
                onChange={changeSeeding}
                options={[
                  { value: 'random', label: seedingLabel('random') },
                  { value: 'seeded', label: seedingLabel('seeded') },
                ]}
              />
              {seedingMode === 'random' && (
                <Button type="button" variant="outline" size="sm" onClick={() => setOrder(shuffle(ordered))} disabled={ordered.length < 2}>
                  <Shuffle /> {isShuffled ? tx('Stokk på nytt', 'Shuffle again') : tx('Stokk nå', 'Shuffle now')}
                </Button>
              )}
            </div>
            {ordered.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {tx('Rekkefølgen vises her når du har lagt inn deltakere.', 'The order appears here once you have entered participants.')}
              </p>
            ) : (
              <ol className="grid max-h-72 gap-1 overflow-y-auto rounded-lg border bg-background/40 p-1.5">
                {ordered.map((n, i) => (
                  <li key={n} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted">
                    <span className="w-6 text-right font-mono text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                    <span className="flex-1 truncate">{n}</span>
                    {seedingMode === 'seeded' && (
                      <span className="flex gap-0.5">
                        <Button type="button" variant="ghost" size="icon" className="size-7" aria-label={tx(`Flytt ${n} opp`, `Move ${n} up`)} disabled={i === 0} onClick={() => move(i, -1)}>
                          <ArrowUp />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="size-7" aria-label={tx(`Flytt ${n} ned`, `Move ${n} down`)} disabled={i === ordered.length - 1} onClick={() => move(i, 1)}>
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
          {tx('Lag turnering', 'Create tournament')}
        </Button>
      </div>
    </form>
  )
}
