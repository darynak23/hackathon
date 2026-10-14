import { afterEach, describe, expect, it } from 'vitest'
import { setLanguage, tx } from './i18n'
import { suggestNames } from './names'
import { statusLabel, startTournament } from './tournament'
import { formatLabel } from '@/types'

afterEach(() => setLanguage('no'))

describe('språk', () => {
  it('bruker norsk som standard og bytter til engelsk', () => {
    expect(tx('Hei', 'Hello')).toBe('Hei')
    setLanguage('en')
    expect(tx('Hei', 'Hello')).toBe('Hello')
  })

  it('oversetter formatnavn og status', () => {
    const t = startTournament({
      name: 'T',
      sport: 'sjakk',
      scoring: 'winLoss',
      participantKind: 'individual',
      format: 'swiss',
      participants: ['A', 'B', 'C', 'D'],
    })
    expect(formatLabel('swissThenElimination')).toBe('Swiss + seedet sluttspill')
    expect(statusLabel(t)).toBe('Swiss, runde 1')
    setLanguage('en')
    expect(formatLabel('elimination')).toBe('Knockout')
    expect(statusLabel(t)).toBe('Swiss, round 1')
  })

  it('lager engelske navneforslag', () => {
    setLanguage('en')
    const names = suggestNames({ sport: 'basket', format: 'elimination' }, 6)
    expect(names).toHaveLength(6)
    expect(names.some((n) => /Basketball|Hoops|Dunk|Court|Buzzer/.test(n))).toBe(true)
  })
})
