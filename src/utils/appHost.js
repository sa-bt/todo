const DEFAULT_ADMIN_HOST = 'admin.sa-bt.ir'

export function isAdminHost(hostname = globalThis.location?.hostname || '') {
  const configuredHost = String(import.meta.env.VITE_ADMIN_HOST || DEFAULT_ADMIN_HOST)
    .trim()
    .toLowerCase()

  return String(hostname).trim().toLowerCase() === configuredHost
}

export function isStandaloneApp() {
  const win = globalThis.window

  if (!win) return false

  return (
    win.matchMedia?.('(display-mode: standalone)').matches === true ||
    win.navigator?.standalone === true
  )
}
