import { computed, readonly, ref } from 'vue'

/**
 * Install prompt plumbing shared by both installable apps of this project:
 * the user app (`index.html`) and the admin panel (`admin.html`).
 *
 * Nothing here needs to know which app is running. A `beforeinstallprompt`
 * event always belongs to the manifest of the current document, and each app
 * has its own entry document, so the very same code installs the user app on
 * `/` and the admin app on `/admin/*`. See `@/utils/pwaManifest` for why the
 * manifest link is never swapped at runtime.
 */

const deferredPrompt = ref(null)
const installed = ref(false)

let initialized = false

/**
 * iOS has no `beforeinstallprompt`: installing there is a manual
 * Share -> "Add to Home Screen" flow, so those users get instructions
 * instead of a prompt.
 */
function detectIos() {
  const ua = globalThis.navigator?.userAgent || ''

  // iPadOS 13+ reports a desktop Safari user agent; touch points give it away.
  const isIpadOs = /macintosh/i.test(ua) && (globalThis.navigator?.maxTouchPoints || 0) > 1

  return /iphone|ipad|ipod/i.test(ua) || isIpadOs
}

function detectStandalone() {
  const win = globalThis.window
  if (!win) return false

  return win.matchMedia?.('(display-mode: standalone)').matches === true
    || win.navigator?.standalone === true
}

const isIos = detectIos()

/**
 * Must run before the app mounts so no `beforeinstallprompt` is missed.
 * Calling it more than once is harmless.
 */
export function initInstallPrompt() {
  const win = globalThis.window
  if (initialized || !win) return

  initialized = true
  installed.value = detectStandalone()

  win.addEventListener('beforeinstallprompt', (event) => {
    // Without preventDefault Chromium shows its own mini infobar. Holding the
    // event lets the app ask at a moment that makes sense instead.
    event.preventDefault()
    deferredPrompt.value = event
  })

  win.addEventListener('appinstalled', () => {
    deferredPrompt.value = null
    installed.value = true
  })

  // Covers the app being opened in its installed window without a reload.
  win.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', (event) => {
    if (event.matches) installed.value = true
  })
}

/**
 * Shows the browser install dialog and reports its outcome:
 * `accepted`, `dismissed`, or `unavailable` when no prompt was captured.
 */
export async function promptInstall() {
  const event = deferredPrompt.value
  if (!event) return 'unavailable'

  // The captured event is single use; prompting twice with it throws. The
  // browser fires a fresh one by itself while the app stays installable.
  deferredPrompt.value = null
  event.prompt()

  const choice = await event.userChoice

  return choice?.outcome || 'dismissed'
}

export function useInstallPrompt() {
  return {
    // A real prompt is in hand and the app is not already installed.
    canInstall: computed(() => !installed.value && deferredPrompt.value !== null),

    // iOS can never hand us a prompt, so it gets the manual instructions.
    needsIosGuide: computed(() => !installed.value && isIos),

    isInstalled: readonly(installed),
    promptInstall,
  }
}
