import { afterEach, describe, expect, it, vi } from 'vitest'
import { adminAppUrl, isAdminHost, isStandaloneApp } from '@/utils/appHost'

const originalWindow = globalThis.window

afterEach(() => {
  Object.defineProperty(globalThis, 'window', {
    value: originalWindow,
    configurable: true,
    writable: true,
  })
  vi.unstubAllEnvs()
})

describe('appHost', () => {
  it('recognises the production admin subdomain', () => {
    expect(isAdminHost('admin.sa-bt.ir')).toBe(true)
    expect(isAdminHost('sa-bt.ir')).toBe(false)
  })

  it('matches hostnames case-insensitively', () => {
    expect(isAdminHost('ADMIN.SA-BT.IR')).toBe(true)
  })

  it('keeps the admin link on the same origin when no admin host is configured', () => {
    // مقدار پیش‌فرض نباید اینجا جا بیفتد، وگرنه توسعه‌ی محلی به سرور اصلی می‌رود
    expect(adminAppUrl({ hostname: 'localhost', protocol: 'http:' })).toBe('/admin/')
  })

  it('points the admin link at the configured admin origin', () => {
    vi.stubEnv('VITE_ADMIN_HOST', 'admin.sa-bt.ir')

    expect(adminAppUrl({ hostname: 'sa-bt.ir', protocol: 'https:' })).toBe(
      'https://admin.sa-bt.ir/admin/',
    )
  })

  it('stays relative when the admin app is already the current origin', () => {
    vi.stubEnv('VITE_ADMIN_HOST', 'admin.sa-bt.ir')

    expect(adminAppUrl({ hostname: 'ADMIN.SA-BT.IR', protocol: 'https:' })).toBe('/admin/')
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
