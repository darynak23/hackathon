import { useEffect, useRef, useState, type Ref } from 'react'
import { createPortal } from 'react-dom'
import { toPng } from 'html-to-image'
import { ImageDown, Loader2, Trophy } from 'lucide-react'
import { Badge } from '@/components/Badge'
import { Bracket } from '@/components/Bracket'
import { ChampionCenter } from '@/components/bracket-ui/ChampionCenter'
import { StandingsTable } from '@/components/swiss/StandingsTable'
import { SwissView } from '@/components/swiss/SwissView'
import { Button } from '@/components/ui/button'
import { getWinner, statusLabel } from '@/lib/tournament'
import { FORMAT_LABELS, SEEDING_LABELS, sportLabel, type Tournament } from '@/types'

const noop = () => {}

function fileName(t: Tournament) {
  const slug = t.name.toLowerCase().replace(/[^a-z0-9æøå]+/g, '-').replace(/^-|-$/g, '') || 'turnering'
  return `${slug}-${getWinner(t) ? 'resultat' : 'status'}.png`
}

/** Venter til strekene i treet er målt og fontene er lastet. */
async function settle() {
  await document.fonts.ready
  await new Promise((resolve) => setTimeout(resolve, 350))
}

/**
 * Lager et PNG-bilde av oppsettet og stillingen akkurat nå, enten turneringen
 * er underveis eller ferdig. Innholdet tegnes uten rullefelt utenfor skjermen.
 */
export function ExportImageButton({ tournament, onError }: { tournament: Tournament; onError: (message: string) => void }) {
  const [exporting, setExporting] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onErrorRef.current = onError
  })

  useEffect(() => {
    if (!exporting) return
    let cancelled = false
    void (async () => {
      try {
        await settle()
        const node = sheetRef.current
        if (cancelled || !node) return
        const url = await toPng(node, {
          pixelRatio: 2,
          width: node.scrollWidth,
          height: node.scrollHeight,
          style: { position: 'static', left: '0', top: '0' },
        })
        const link = document.createElement('a')
        link.href = url
        link.download = fileName(tournament)
        link.click()
      } catch {
        onErrorRef.current('Klarte ikke å lage bildet. Prøv igjen.')
      } finally {
        if (!cancelled) setExporting(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [exporting, tournament])

  return (
    <>
      <Button variant="outline" onClick={() => setExporting(true)} disabled={exporting}>
        {exporting ? <Loader2 className="animate-spin" /> : <ImageDown />} Last ned bilde
      </Button>
      {exporting &&
        createPortal(
          <div
            aria-hidden="true"
            className="pointer-events-none fixed top-0 left-[-100000px]"
          >
            <ExportSheet ref={sheetRef} tournament={tournament} />
          </div>,
          document.body,
        )}
    </>
  )
}

function ExportSheet({ tournament, ref }: { tournament: Tournament; ref: Ref<HTMLDivElement> }) {
  const winner = getWinner(tournament)
  const updated = new Date(tournament.updatedAt).toLocaleString('nb-NO', { dateStyle: 'medium', timeStyle: 'short' })
  const hasPlayoffs = tournament.rounds.length > 0

  return (
    <div
      ref={ref}
      className="grid w-max min-w-[960px] gap-8 p-10 text-foreground"
      style={{ background: 'var(--atmosphere)', backgroundColor: 'var(--bg)' }}
    >
      <header className="flex items-start justify-between gap-10">
        <div className="grid gap-3">
          <p className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Trophy className="size-4" />
            </span>
            Nome <span className="text-amber">Games</span>
          </p>
          <h1 className="font-display text-5xl font-bold tracking-tight">{tournament.name}</h1>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="amber">{sportLabel(tournament)}</Badge>
            <Badge>{FORMAT_LABELS[tournament.format]}</Badge>
            <Badge>{SEEDING_LABELS[tournament.seedingMode]}</Badge>
            <Badge>{tournament.scoring === 'points' ? 'Poeng' : 'Vinner/taper'}</Badge>
            <Badge>
              {tournament.participants.length} {tournament.participantKind === 'team' ? 'lag' : 'deltakere'}
            </Badge>
          </div>
        </div>
        <div className="grid justify-items-end gap-1 text-right">
          <Badge tone={winner ? 'win' : 'amber'} className="px-3 py-1 text-sm">
            {winner ? 'Ferdig' : 'Underveis'}
          </Badge>
          <p className="text-lg font-semibold">{winner ? `Vinner: ${winner.name}` : statusLabel(tournament)}</p>
          <p className="text-sm text-muted-foreground">Oppdatert {updated}</p>
        </div>
      </header>

      {tournament.format === 'swiss' && winner && (
        <div className="rounded-2xl border border-amber/40 bg-accent p-4">
          <ChampionCenter winner={winner} celebrate={false} />
        </div>
      )}

      {tournament.swiss && (
        <section className="grid gap-4">
          <h2 className="font-display text-2xl font-semibold">Swiss-fase</h2>
          <SwissView tournament={tournament} onMatchClick={noop} />
          <StandingsTable tournament={tournament} />
        </section>
      )}

      {hasPlayoffs && (
        <section className="grid gap-4">
          {tournament.swiss && <h2 className="font-display text-2xl font-semibold">Sluttspill</h2>}
          <div className="rounded-2xl border bg-card/40 p-6">
            <Bracket tournament={tournament} onMatchClick={noop} celebrate={false} />
          </div>
        </section>
      )}
    </div>
  )
}
