import { describe, expect, it } from 'vitest'
import { fixtures } from './fixtures'
import { parseTournaments } from './storage'

describe('parseTournaments', () => {
  it('gir tom liste for ødelagt JSON', () => {
    expect(parseTournaments('{ikke json')).toEqual([])
  })

  it('gir tom liste for null og feil type', () => {
    expect(parseTournaments(null)).toEqual([])
    expect(parseTournaments('{"a":1}')).toEqual([])
  })

  it('leser tilbake det som ble lagret', () => {
    expect(parseTournaments(JSON.stringify(fixtures))).toEqual(fixtures)
  })
})
