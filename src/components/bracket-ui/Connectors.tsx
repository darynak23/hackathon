import type { ConnectorLine } from './useConnectorLines'

/** Rene SVG-streker mellom kampene – posisjonene er allerede regnet ut av useConnectorLines. */
export function Connectors({ lines }: { lines: ConnectorLine[] }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      {lines.map((line) => (
        <polyline
          key={line.key}
          points={line.points}
          fill="none"
          stroke="var(--line)"
          strokeWidth={1.25}
        />
      ))}
    </svg>
  )
}
