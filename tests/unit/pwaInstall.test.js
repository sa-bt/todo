import { afterEach, describe, expect, it, vi } from 'vitest'

/*
 * The test environment is `node`, so the browser surface this module touches is
 * stubbed by hand: no jsdom is installed and adding one only for a handful of
 * event listeners is not worth the dependency.
 *
 * Module state is per import, so every case re-imports the module after
 * `vi.resetModules()` with the globals it needs already in place.
 */

const originalWindow = globalThis.window
const originalNavigator = globalThis.navigator

function installFakeBrowser({ userAgent = 'Mozilla/5.0 (Linux; Android 14)', standalone = false, maxTouchPoints = 0 } = {}) {
  const listeners = {}

  const fakeWindow = {
    navigator: { userAgent, maxTouchPoints },
    addEventListener(type, handler) {
      listeners[type] = handler
    },
    matchMedia: () => ({ matches: standalone, addEventListener() {} }),
  }

  Object.defineProperty(globalThis, 'window', { value: fakeWindow, configurable: true, writable: true })
  Object.defineProperty(globalThis, 'navigator', { value: fakeWindow.navigator, configurable: true, writable: true })

  return { listeners }
}

function makePromptEvent(outcome = 'accepted') {
  return {
    preventDefault: vi.fn(),
    prompt: vi.fn(),
    userChoice: Promise.resolve({ outcome }),
  }
}

async function loadModule() {
  vi.resetModules()
  return import('@/utils/pwaInstall')
}

afterEach(() => {
  Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true, writable: true })
  Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true, writable: true })
})

describe('pwaInstall', () => {
  it('offers no install button until the browser hands over a prompt', async () => {
    installFakeBrowser()

    const { initInstallPrompt, useInstallPrompt } = await loadModule()
    initInstallPrompt()

    const { canInstall, needsIosGuide } = useInstallPrompt()

    expect(canInstall.value).toBe(false)
    expect(needsIosGuide.value).toBe(false)
  })

  it('captures beforeinstallprompt and keeps the browser mini infobar away', async () => {
    const { listeners } = installFakeBrowser()

    const { initInstallPrompt, useInstallPrompt } = await loadModule()
    initInstallPrompt()

    const event = makePromptEvent()
    listeners.beforeinstallprompt(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(useInstallPrompt().canInstall.value).toBe(true)
  })

  it('drops the captured event after prompting, because it can only be used once', async () => {
    const { listeners } = installFakeBrowser()

    const { initInstallPrompt, useInstallPrompt } = await loadModule()
    initInstallPrompt()

    const event = makePromptEvent('dismissed')
    listeners.beforeinstallprompt(event)

    const { canInstall, promptInstall } = useInstallPrompt()

    expect(await promptInstall()).toBe('dismissed')
    expect(event.prompt).toHaveBeenCalledTimes(1)
    expect(canInstall.value).toBe(false)
    expect(await promptInstall()).toBe('unavailable')
  })

  it('hides the button once the app reports itself installed', async () => {
    const { listeners } = installFakeBrowser()

    const { initInstallPrompt, useInstallPrompt } = await loadModule()
    initInstallPrompt()

    listeners.beforeinstallprompt(makePromptEvent())
    listeners.appinstalled()

    const { canInstall, isInstalled } = useInstallPrompt()

    expect(isInstalled.value).toBe(true)
    expect(canInstall.value).toBe(false)
  })

  it('starts installed when the page is already running standalone', async () => {
    installFakeBrowser({ standalone: true })

    const { initInstallPrompt, useInstallPrompt } = await loadModule()
    initInstallPrompt()

    expect(useInstallPrompt().isInstalled.value).toBe(true)
  })

  it('falls back to the manual guide on iPhone', async () => {
    installFakeBrowser({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari' })

    const { initInstallPrompt, useInstallPrompt } = await loadModule()
    initInstallPrompt()

    const { canInstall, needsIosGuide } = useInstallPrompt()

    expect(canInstall.value).toBe(false)
    expect(needsIosGuide.value).toBe(true)
  })

  it('recognises iPadOS even though it claims to be a desktop Mac', async () => {
    installFakeBrowser({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari', maxTouchPoints: 5 })

    const { initInstallPrompt, useInstallPrompt } = await loadModule()
    initInstallPrompt()

    expect(useInstallPrompt().needsIosGuide.value).toBe(true)
  })

  it('does not offer the iOS guide on a real desktop Mac', async () => {
    installFakeBrowser({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari' })

    const { initInstallPrompt, useInstallPrompt } = await loadModule()
    initInstallPrompt()

    expect(useInstallPrompt().needsIosGuide.value).toBe(false)
  })
})
