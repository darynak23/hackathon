import { useState } from 'react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { getParticipant } from '@/lib/bracket'
import { phaseOf, validate } from '@/lib/tournament'
import type { Match, MatchResult, Tournament } from '@/types'

export interface ResultDialogProps {
  tournament: Tournament
  /** null betyr at dialogen er lukket. */
  match: Match | null
  onClose: () => void
  onSave: (result: MatchResult) => void
  onClear: () => void
}

export function ResultDialog({ tournament, match, onClose, onSave, onClear }: ResultDialogProps) {
  return (
    <Dialog open={match !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {match && (
          <ResultForm key={match.id} tournament={tournament} match={match} onSave={onSave} onClear={onClear} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ResultForm({
  tournament,
  match,
  onSave,
  onClear,
}: Omit<ResultDialogProps, 'match' | 'onClose'> & { match: Match }) {
  const a = getParticipant(tournament, match.participantA)
  const b = getParticipant(tournament, match.participantB)
  const [scoreA, setScoreA] = useState(match.scoreA?.toString() ?? '')
  const [scoreB, setScoreB] = useState(match.scoreB?.toString() ?? '')
  const [confirmClear, setConfirmClear] = useState(false)

  if (!a || !b) return null

  const inSwiss = phaseOf(match.id) === 'swiss'
  const hasResult = match.winnerId !== null || match.isDraw === true
  const allowDraw = inSwiss && tournament.scoring === 'winLoss'

  const header = (
    <DialogHeader>
      <DialogTitle className="font-display text-xl">
        {a.name} <span className="text-muted-foreground">mot</span> {b.name}
      </DialogTitle>
      <DialogDescription>
        {tournament.scoring === 'points'
          ? 'Skriv inn poengene. Vinneren regnes ut automatisk.'
          : allowDraw
            ? 'Klikk på vinneren, eller velg uavgjort.'
            : 'Klikk på vinneren.'}
      </DialogDescription>
    </DialogHeader>
  )

  const clearSection = hasResult && (
    <div className="mr-auto">
      {confirmClear ? (
        <div className="grid gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <p>
            {inSwiss
              ? 'Resultatet fjernes fra runden.'
              : 'Resultatet fjernes, og alle kampene etter i treet som vinneren hadde gått videre til, nullstilles også.'}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="destructive" size="sm" onClick={onClear}>
              Fjern resultat
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>
              Avbryt
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirmClear(true)}>
          Fjern resultat
        </Button>
      )}
    </div>
  )

  if (tournament.scoring === 'winLoss') {
    return (
      <>
        {header}
        <div className="grid grid-cols-2 gap-3">
          {[a, b].map((p) => {
            const isWinner = match.winnerId === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSave({ winnerId: p.id })}
                className={cn(
                  'grid h-28 place-items-center rounded-xl border-2 p-3 text-center font-display text-lg font-semibold transition-all outline-none hover:-translate-y-0.5 hover:border-amber focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  isWinner ? 'border-amber bg-accent' : 'border-border bg-card',
                )}
              >
                <span>
                  {p.name}
                  {isWinner && <span className="mt-1 block text-xs font-medium text-amber">Vinner</span>}
                </span>
              </button>
            )
          })}
        </div>
        {allowDraw && (
          <Button
            type="button"
            variant={match.isDraw ? 'default' : 'outline'}
            onClick={() => onSave({ winnerId: null, isDraw: true })}
          >
            Uavgjort (½ poeng hver)
          </Button>
        )}
        <DialogFooter>{clearSection}</DialogFooter>
      </>
    )
  }

  const numA = scoreA === '' ? NaN : Number(scoreA)
  const numB = scoreB === '' ? NaN : Number(scoreB)
  const filled = !Number.isNaN(numA) && !Number.isNaN(numB)
  const result: MatchResult = {
    winnerId: numA >= numB ? a.id : b.id,
    scoreA: numA,
    scoreB: numB,
  }
  const error = filled ? validate(tournament, match, result) : null
  const canSave = filled && error === null

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (canSave) onSave(result)
      }}
      className="grid gap-4"
    >
      {header}
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        {[
          { p: a, value: scoreA, set: setScoreA, autoFocus: true },
          { p: b, value: scoreB, set: setScoreB, autoFocus: false },
        ].map(({ p, value, set, autoFocus }, i) => (
          <label key={p.id} className={cn('grid gap-1.5 text-sm font-medium', i === 1 && 'col-start-3')}>
            <span className={cn('truncate', result.winnerId === p.id && filled && numA !== numB && 'text-amber')}>{p.name}</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={value}
              onChange={(e) => set(e.target.value)}
              autoFocus={autoFocus}
              aria-invalid={error !== null}
              className="h-14 text-center text-2xl font-semibold tabular-nums md:text-2xl"
            />
          </label>
        ))}
        <span className="col-start-2 row-start-1 pb-4 text-muted-foreground">–</span>
      </div>
      <p role="alert" className={cn('min-h-5 text-sm', error ? 'text-destructive' : 'text-muted-foreground')}>
        {error ?? (canSave ? `${getParticipant(tournament, result.winnerId)?.name} vinner` : '')}
      </p>
      <DialogFooter className="items-end">
        {clearSection}
        <Button type="submit" disabled={!canSave}>
          Lagre
        </Button>
      </DialogFooter>
    </form>
  )
}
