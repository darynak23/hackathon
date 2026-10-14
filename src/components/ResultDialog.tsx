import { useState } from 'react'
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
import { useLanguage } from '@/hooks/useLanguage'
import { getParticipant, validateResult } from '@/lib/bracket'
import { translateError } from '@/lib/i18n'
import type { Match, MatchResult, Tournament } from '@/types'

// Eies av person 4. Props er låst.

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
      <DialogContent>
        {match && (
          <ResultForm
            key={match.id}
            tournament={tournament}
            match={match}
            onSave={onSave}
            onClear={onClear}
          />
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
  const { t } = useLanguage()

  if (!a || !b) return null

  const header = (
    <DialogHeader>
      <DialogTitle>
        {a.name} {t.versus} {b.name}
      </DialogTitle>
      <DialogDescription>
        {tournament.scoring === 'points' ? t.enterScores : t.clickWinner}
      </DialogDescription>
    </DialogHeader>
  )

  const clearButton = match.winnerId && (
    <Button variant="destructive" onClick={onClear}>
      {t.clearResult}
    </Button>
  )

  if (tournament.scoring === 'winLoss') {
    return (
      <>
        {header}
        <div className="grid grid-cols-2 gap-3">
          {[a, b].map((p) => (
            <Button
              key={p.id}
              size="lg"
              variant={match.winnerId === p.id ? 'default' : 'outline'}
              className="h-20 text-lg"
              onClick={() => onSave({ winnerId: p.id, scoreA: null, scoreB: null })}
            >
              {p.name}
            </Button>
          ))}
        </div>
        <DialogFooter>{clearButton}</DialogFooter>
      </>
    )
  }

  const numA = scoreA === '' ? NaN : Number(scoreA)
  const numB = scoreB === '' ? NaN : Number(scoreB)
  const filled = !Number.isNaN(numA) && !Number.isNaN(numB)
  const result: MatchResult = {
    winnerId: numA > numB ? a.id : b.id,
    scoreA: filled ? numA : null,
    scoreB: filled ? numB : null,
  }
  const validation = filled ? validateResult(tournament, match, result) : null

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (validation?.ok) onSave(result)
      }}
      className="grid gap-4"
    >
      {header}
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm">
          {a.name}
          <Input type="number" value={scoreA} onChange={(e) => setScoreA(e.target.value)} autoFocus />
        </label>
        <label className="grid gap-1 text-sm">
          {b.name}
          <Input type="number" value={scoreB} onChange={(e) => setScoreB(e.target.value)} />
        </label>
      </div>
      {validation && !validation.ok && (
        <p className="text-sm text-destructive">{translateError(t, validation.error)}</p>
      )}
      <DialogFooter>
        {clearButton}
        <Button type="submit" disabled={!validation?.ok}>
          {t.save}
        </Button>
      </DialogFooter>
    </form>
  )
}
