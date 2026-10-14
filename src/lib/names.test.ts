import { describe, expect, it } from 'vitest'
import { suggestNames } from './names'

describe('suggestNames', () => {
  it('gir det antallet ulike forslag som ble bedt om', () => {
    const names = suggestNames({ sport: 'basket', format: 'elimination' }, 4)
    expect(names).toHaveLength(4)
    expect(new Set(names).size).toBe(4)
    expect(names.every((n) => n.trim().length > 0)).toBe(true)
  })

  it('bruker fritekst-sporten når sport er annet', () => {
    const names = suggestNames({ sport: 'annet', customSport: 'bordtennis', format: 'swiss' }, 10)
    expect(names.some((n) => /bordtennis/i.test(n))).toBe(true)
  })

  it('tar med årstall og årstid', () => {
    const date = new Date('2026-10-14')
    const names = suggestNames({ sport: 'sjakk', format: 'swissThenElimination', date }, 30)
    expect(names.some((n) => n.includes('2026') || n.startsWith('Høst'))).toBe(true)
  })
})
