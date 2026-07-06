const USER_MANIFEST = '/manifest.webmanifest'
const ADMIN_MANIFEST = '/admin-manifest.webmanifest'
const USER_THEME_COLOR = '#2563EB'
const ADMIN_THEME_COLOR = '#0f172a'

export function syncPwaManifest(pathname = window.location.pathname) {
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/')
  const manifestHref = isAdminPath ? ADMIN_MANIFEST : USER_MANIFEST
  const themeColor = isAdminPath ? ADMIN_THEME_COLOR : USER_THEME_COLOR

  let manifestLink = document.querySelector('link[rel="manifest"]')
  if (!manifestLink) {
    manifestLink = document.createElement('link')
    manifestLink.setAttribute('rel', 'manifest')
    document.head.appendChild(manifestLink)
  }
  manifestLink.setAttribute('href', manifestHref)

  let themeMeta = document.querySelector('meta[name="theme-color"]')
  if (!themeMeta) {
    themeMeta = document.createElement('meta')
    themeMeta.setAttribute('name', 'theme-color')
    document.head.appendChild(themeMeta)
  }
  themeMeta.setAttribute('content', themeColor)
}
