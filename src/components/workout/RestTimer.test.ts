import { describe, expect, it } from 'vitest'
import { formatCountdown, remainingSeconds } from './RestTimer'

describe('RestTimer helpers', () => {
  it('calcula segundos restantes pelo timestamp de término', () => {
    const now = 1_000_000
    expect(remainingSeconds(now + 90_000, now)).toBe(90)
    expect(remainingSeconds(now + 400, now)).toBe(1)
    expect(remainingSeconds(now - 5_000, now)).toBe(0)
  })

  it('formata contagem regressiva em M:SS', () => {
    expect(formatCountdown(120)).toBe('2:00')
    expect(formatCountdown(65)).toBe('1:05')
    expect(formatCountdown(9)).toBe('0:09')
    expect(formatCountdown(0)).toBe('0:00')
  })
})
