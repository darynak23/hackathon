import { Badge } from '@/components/Badge'
import { recordLabel, swissStandings } from '@/lib/swiss'
import type { Tournament } from '@/types'
import { useLanguage } from '@/hooks/useLanguage'
import { tx } from '@/lib/i18n'

const STATUS = {
  advanced: { label: () => tx('Videre', 'Through'), tone: 'win' },
  eliminated: { label: () => tx('Ute', 'Out'), tone: 'lose' },
  active: { label: () => tx('Spiller', 'Playing'), tone: 'neutral' },
} as const

export function StandingsTable({ tournament }: { tournament: Tournament }) {
  useLanguage()
  const standings = swissStandings(tournament)
  const showPoints = tournament.scoring === 'points'

  return (
    <div className="overflow-x-auto rounded-xl border bg-card/80 shadow-sm backdrop-blur-sm">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="border-b bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
          <tr>
            <th className="px-3 py-2.5 font-semibold">#</th>
            <th className="px-3 py-2.5 font-semibold">{tx('Deltaker', 'Participant')}</th>
            <th className="px-3 py-2.5 text-center font-semibold">{tx('Stilling', 'Record')}</th>
            <th className="px-3 py-2.5 text-center font-semibold" title={tx('Seire / uavgjort / tap', 'Wins / draws / losses')}>
              {tx('S / U / T', 'W / D / L')}
            </th>
            <th className="px-3 py-2.5 text-center font-semibold" title={tx('Summen av motstandernes seire', 'The sum of the opponents’ wins')}>
              Buchholz
            </th>
            {showPoints && <th className="px-3 py-2.5 text-center font-semibold">+/−</th>}
            <th className="px-3 py-2.5 text-right font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((r, i) => {
            const diff = r.pointsFor - r.pointsAgainst
            return (
              <tr key={r.participant.id} className="border-b last:border-0 hover:bg-muted/40">
                <td className="px-3 py-2 font-mono text-muted-foreground tabular-nums">{i + 1}</td>
                <td className="px-3 py-2">
                  <span className="font-medium">{r.participant.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">seed {r.participant.seed}</span>
                  {r.hadBye && <span className="ml-2 text-xs text-amber">{tx('fri runde', 'bye')}</span>}
                </td>
                <td className="px-3 py-2 text-center font-bold tabular-nums">
                  {recordLabel(r.score, r.lossScore)}
                </td>
                <td className="px-3 py-2 text-center tabular-nums">
                  {r.wins} / {r.draws} / {r.losses}
                </td>
                <td className="px-3 py-2 text-center tabular-nums">{r.buchholz}</td>
                {showPoints && (
                  <td className="px-3 py-2 text-center tabular-nums">{diff > 0 ? `+${diff}` : diff}</td>
                )}
                <td className="px-3 py-2 text-right">
                  <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label()}</Badge>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
