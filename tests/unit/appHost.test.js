import { afterEach, describe, expect, it, vi } from 'vitest'
import { isAdminHost, isStandaloneApp } from '@/utils/appHost'

const originalWindow = globalThis.window

afterEach(() => {
  Object.defineProperty(globalThis, 'window', {
    value: originalWindow,
    configurable: true,
    writable: true,
  })
})

describe('appHost', () => {
  it('recognises the production admin subdomain', () => {
    expect(isAdminHost('admin.sa-bt.ir')).toBe(true)
    expect(isAdminHost('sa-bt.ir')).toBe(false)
  })

  it('matches hostnames case-insensitively', () => {
    expect(isAdminHost('ADMIN.SA-BT.IR')).toBe(true)
  })

  it('detects an installed app through display mode', () => {
    Object.defineProperty(globalThis, 'window', {
      value: {
        navigator: {},
        matchMedia: vi.fn(() => ({ matches: true })),
      },
      configurable: true,
      writable: true,
    })

    expect(isStandaloneApp()).toBe(true)
  })

  it('keeps a regular browser on the public root', () => {
    Object.defineProperty(globalThis, 'window', {
      value: {
        navigator: {},
        matchMedia: vi.fn(() => ({ matches: false })),
      },
      configurable: true,
      writable: true,
    })

    expect(isStandaloneApp()).toBe(false)
  })
})
