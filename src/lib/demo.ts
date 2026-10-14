import type { Tournament } from '@/types'
import { basketFixture, chessFixture } from './fixtures'

// Eies av person 5: en ferdig sjakkturnering og en basketturnering halvveis spilt.

export function createDemoTournaments(): Tournament[] {
  const now = new Date().toISOString()
  return [chessFixture, basketFixture].map((t) => ({
    ...structuredClone(t),
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }))
}
