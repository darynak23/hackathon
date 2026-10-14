import { useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'
import type { BracketColumn } from '@/lib/layout'
import type { Tournament } from '@/types'

/**
 * Strekene mellom kampene.
 *
 * Kampene posisjoneres med ren flex (kolonnene i Bracket.tsx), så det
 * faktiske pikselstedet til hver kamp vet bare nettleseren etter at den har
 * lagt ut siden. Derfor måler vi de ferdig plasserte kortene (via refs) og
 * tegner en SVG-overlegg med streker mellom dem, i stedet for å gjette
 * posisjonen med CSS-pseudoelementer. Det gir riktige streker uansett
 * skjermstørrelse, og blir automatisk speilvendt siden venstre side bruker
 * kortets høyre kant og høyre side bruker kortets venstre kant.
 */

export type MatchRefMap = Map<string, HTMLDivElement>

export interface ConnectorLine {
  key: string
  points: string
}

interface UseConnectorLinesArgs {
  containerRef: RefObject<HTMLDivElement | null>
  matchRefs: RefObject<MatchRefMap>
  tournament: Tournament
  columns: BracketColumn[]
}

export function useConnectorLines({
  containerRef,
  matchRefs,
  tournament,
  columns,
}: UseConnectorLinesArgs): ConnectorLine[] {
  const [lines, setLines] = useState<ConnectorLine[]>([])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || columns.length === 0) {
      setLines([])
      return
    }

    function recompute() {
      const containerEl = containerRef.current
      const refs = matchRefs.current
      if (!containerEl || !refs) return

      const containerBox = containerEl.getBoundingClientRect()
      const rectOf = (id: string) => {
        const el = refs.get(id)
        if (!el) return null
        const box = el.getBoundingClientRect()
        return {
          left: box.left - containerBox.left,
          right: box.right - containerBox.left,
          centerY: box.top - containerBox.top + box.height / 2,
        }
      }

      const next: ConnectorLine[] = []
      for (const column of columns) {
        if (column.side === 'final') continue // finalen kobler ikke videre

        for (const match of column.matches) {
          const rect = rectOf(match.id)
          if (!rect) continue

          const parent = tournament.rounds[match.round + 1]?.[Math.floor(match.position / 2)]
          const parentRect = parent ? rectOf(parent.id) : null
          if (!parentRect) continue

          const stubFrom = column.side === 'left' ? rect.right : rect.left
          const stubTo = column.side === 'left' ? parentRect.left : parentRect.right
          const midX = (stubFrom + stubTo) / 2

          next.push({
            key: match.id,
            points: `${stubFrom},${rect.centerY} ${midX},${rect.centerY} ${midX},${parentRect.centerY} ${stubTo},${parentRect.centerY}`,
          })
        }
      }
      setLines(next)
    }

    // to rAF-runder: la fonter/flex-layout sette seg før vi måler
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(recompute)
    })

    const resizeObserver = new ResizeObserver(recompute)
    resizeObserver.observe(container)
    window.addEventListener('resize', recompute)

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      resizeObserver.disconnect()
      window.removeEventListener('resize', recompute)
    }
  }, [containerRef, matchRefs, tournament, columns])

  return lines
}
