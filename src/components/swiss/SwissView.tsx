import { cn } from 'cn'
import { getParticipant } from '@/lib/bracket'
import { computeRecords, isMatchDone, recordLabel, sortStandings, type SwissRecord } from '@/lib/swiss'
import { isEditable } from '@/lib/tournament'
import type { Match, Tournament } from '@/types'
import { useLanguage } from '@/hooks/useLanguage'
import { tx } from '@/lib/i18n'

export interface SwissViewProps {
  tournament: Tournament
  onMatchClick: (match: Match) => void
}

interface RecordGroup<T> {
  key: string
  score: number
  lossScore: number
  items: T[]
}

function groupBy<T>(items: T[], recordOf: (item: T) => SwissRecord | undefined): RecordGroup<T>[] {
  const groups = new Map<string, RecordGroup<T>>()
  for (const item of items) {
    const record = recordOf(item)
    const score = record?.score ?? 0
    const lossScore = record?.lossScore ?? 0
    const key = `${score}|${lossScore}`
    const group = groups.get(key) ?? { key, score, lossScore, items: [] }
    group.items.push(item)
    groups.set(key, group)
  }
  return [...groups.values()].sort((x, y) => y.score - x.score || x.lossScore - y.lossScore)
}

/** Kolonne per runde, med én boks per stilling (0–0, så 1–0 og 0–1 osv.). */
export function SwissView({ tournament, onMatchClick }: SwissViewProps) {
  useLanguage()
  const stage = tournament.swiss
  if (!stage) return null

  const final = computeRecords(tournament.participants, stage.rounds, stage.config)
  const decided = sortStandings(final.values()).filter((r) => r.status !== 'active')
  const advanced = groupBy(decided.filter((r) => r.status === 'advanced'), (r) => r)
  const eliminated = groupBy(decided.filter((r) => r.status === 'eliminated'), (r) => r)

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stage.rounds.map((round, r) => {
        const before = computeRecords(tournament.participants, stage.rounds, stage.config, r)
        const groups = groupBy(round, (m) => (m.participantA ? before.get(m.participantA) : undefined))
        const done = round.every(isMatchDone)
        return (
          <section key={r} className="flex w-60 shrink-0 flex-col gap-3">
            <header className="flex items-center justify-between px-1">
              <h3 className="font-display text-sm font-semibold tracking-wide uppercase">{tx(`Runde ${r + 1}`, `Round ${r + 1}`)}</h3>
              <span className={cn('text-xs', done ? 'text-win' : 'text-muted-foreground')}>
                {done ? tx('Ferdig', 'Done') : `${round.filter(isMatchDone).length}/${round.length}`}
              </span>
            </header>
            {groups.map((group) => (
              <div key={group.key} className="rounded-xl border bg-card/70 p-2 shadow-sm backdrop-blur-sm">
                <div className="mb-2 flex justify-center">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold tabular-nums">
                    {recordLabel(group.score, group.lossScore)}
                  </span>
                </div>
                <div className="grid gap-1.5">
                  {group.items.map((match) => (
                    <SwissMatch
                      key={match.id}
                      tournament={tournament}
                      match={match}
                      onClick={isEditable(tournament, match) ? onMatchClick : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        )
      })}

      {decided.length > 0 && (
        <section className="flex w-56 shrink-0 flex-col gap-3">
          <header className="px-1">
            <h3 className="font-display text-sm font-semibold tracking-wide uppercase">{tx('Avgjort', 'Decided')}</h3>
          </header>
          {advanced.map((group) => (
            <DecidedBox key={`a${group.key}`} tone="win" label={`${tx('Videre', 'Through')} ${recordLabel(group.score, group.lossScore)}`} records={group.items} />
          ))}
          {eliminated.map((group) => (
            <DecidedBox key={`e${group.key}`} tone="lose" label={`${tx('Ute', 'Out')} ${recordLabel(group.score, group.lossScore)}`} records={group.items} />
          ))}
        </section>
      )}
    </div>
  )
}

function DecidedBox({ tone, label, records }: { tone: 'win' | 'lose'; label: string; records: SwissRecord[] }) {
  return (
    <div
      className={cn(
        'rounded-xl border p-2',
        tone === 'win' ? 'border-win/40 bg-win/10' : 'border-lose/40 bg-lose/10',
      )}
    >
      <p className={cn('mb-1.5 text-center text-xs font-bold', tone === 'win' ? 'text-win' : 'text-lose')}>
        {label}
      </p>
      <ul className="grid gap-1 text-sm">
        {records.map((r) => (
          <li key={r.participant.id} className="flex items-center gap-2 rounded-md bg-card/70 px-2 py-1">
            <span className="w-4 text-right font-mono text-[0.65rem] text-muted-foreground">{r.participant.seed}</span>
            <span className="truncate">{r.participant.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SwissMatch({
  tournament,
  match,
  onClick,
}: {
  tournament: Tournament
  match: Match
  onClick?: (match: Match) => void
}) {
  const a = getParticipant(tournament, match.participantA)
  const b = getParticipant(tournament, match.participantB)
  const clickable = Boolean(onClick)
  const Tag = clickable ? 'button' : 'div'

  if (match.walkover) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-dashed px-2.5 py-1.5 text-sm">
        <span className="truncate font-medium">{a?.name ?? b?.name}</span>
        <span className="text-[0.65rem] font-semibold tracking-wide text-amber uppercase">{tx('Fri runde', 'Bye')}</span>
      </div>
    )
  }

  return (
    <Tag
      type={clickable ? 'button' : undefined}
      onClick={clickable ? () => onClick?.(match) : undefined}
      className={cn(
        'w-full overflow-hidden rounded-lg border bg-card text-left text-sm',
        clickable &&
          'cursor-pointer transition-all outline-none hover:border-amber focus-visible:ring-[3px] focus-visible:ring-ring/50',
        !isMatchDone(match) && clickable && 'border-amber/40',
      )}
    >
      {[
        { p: a, score: match.scoreA },
        { p: b, score: match.scoreB },
      ].map(({ p, score }, i) => {
        const won = match.winnerId !== null && match.winnerId === p?.id
        const lost = match.winnerId !== null && !won
        return (
          <div
            key={i}
            className={cn(
              'flex items-center gap-2 border-l-2 border-transparent px-2 py-1',
              i === 1 && 'border-t border-t-border',
              won && 'border-l-amber bg-amber/10 font-semibold',
              lost && 'text-muted-foreground',
            )}
          >
            <span className="w-4 text-right font-mono text-[0.65rem] text-muted-foreground">{p?.seed}</span>
            <span className="flex-1 truncate">{p?.name}</span>
            {match.isDraw ? (
              <span className="text-xs text-muted-foreground">½</span>
            ) : tournament.scoring === 'points' && score !== undefined ? (
              <span className="tabular-nums">{score}</span>
            ) : won ? (
              <span className="text-xs text-amber">{tx('S', 'W')}</span>
            ) : null}
          </div>
        )
      })}
    </Tag>
  )
}
