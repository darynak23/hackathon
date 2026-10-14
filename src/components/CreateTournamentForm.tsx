import { useState } from 'react'
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
import { useLanguage } from '@/hooks/useLanguage'
import { DEFAULT_SCORING, type NewTournamentInput, type Sport } from '@/types'

// Eies av person 4. Props er låst.

export interface CreateTournamentFormProps {
  onSubmit: (input: NewTournamentInput) => void
}

export function CreateTournamentForm({ onSubmit }: CreateTournamentFormProps) {
  const [name, setName] = useState('')
  const [sport, setSport] = useState<Sport>('sjakk')
  const [participantsText, setParticipantsText] = useState('')
  const { t } = useLanguage()

  const names = [...new Set(participantsText.split('\n').map((s) => s.trim()).filter(Boolean))]
  const canSubmit = name.trim() !== '' && names.length >= 2

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!canSubmit) return
        onSubmit({
          name: name.trim(),
          sport,
          scoring: DEFAULT_SCORING[sport],
          participantKind: 'individual',
          format: 'singleElimination',
          participants: names.map((n) => ({ name: n })),
        })
      }}
    >
      <label className="grid gap-1 text-sm">
        {t.name}
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="grid gap-1 text-sm">
        {t.sport}
        <Select value={sport} onValueChange={(v) => setSport(v as Sport)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(t.sports).map(([id, label]) => (
              <SelectItem key={id} value={id}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="grid gap-1 text-sm">
        {t.participantsOnePerLine}
        <Textarea
          rows={8}
          value={participantsText}
          onChange={(e) => setParticipantsText(e.target.value)}
        />
      </label>
      <Button type="submit" disabled={!canSubmit}>
        {t.createTournament(names.length)}
      </Button>
    </form>
  )
}
