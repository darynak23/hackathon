import type { ParticipantKind } from '@/types'

export interface ParsedParticipant {
  name: string
  members?: string[]
}

/** Én per linje. Lag skrives som «Lagnavn: Ola, Kari». Tomme linjer og duplikater fjernes. */
export function parseParticipants(text: string, kind: ParticipantKind): ParsedParticipant[] {
  const seen = new Set<string>()
  const result: ParsedParticipant[] = []
  for (const line of text.split('\n')) {
    const [rawName, rawMembers] = kind === 'team' ? line.split(/:(.*)/s) : [line]
    const name = rawName.trim()
    if (!name || seen.has(name.toLowerCase())) continue
    seen.add(name.toLowerCase())
    const members = rawMembers
      ?.split(',')
      .map((m) => m.trim())
      .filter(Boolean)
    result.push(members && members.length > 0 ? { name, members } : { name })
  }
  return result
}
