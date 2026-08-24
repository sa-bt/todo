import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { describe, expect, it } from 'vitest'

/*
 * دو اپ نصب‌شدنی این پروژه روی یک مبدأ زندگی می‌کنند، پس مرزشان فقط با
 * `scope` مشخص می‌شود. طبق مشخصات manifest، اگر `start_url` داخل `scope`
 * نباشد مرورگر `scope` را دور می‌ریزد و آن را به پوشه‌ی `start_url` برمی‌گرداند.
 * برای پنل، نتیجه‌ی آن خطا «/» بود؛ یعنی همان دامنه‌ی اپ کاربر، و از همان‌جا
 * مرورگر می‌توانست پیوند پنل را به اپ کاربرِ نصب‌شده بسپارد.
 */

function readManifest(name) {
  const path = fileURLToPath(new URL(`../../public/${name}`, import.meta.url))

  return JSON.parse(readFileSync(path, 'utf8'))
}

const userManifest = readManifest('manifest.webmanifest')
const adminManifest = readManifest('admin-manifest.webmanifest')

describe('web app manifests', () => {
  it.each([
    ['user', userManifest],
    ['admin', adminManifest],
  ])('keeps the %s start_url inside its own scope', (_name, manifest) => {
    expect(manifest.start_url.startsWith(manifest.scope)).toBe(true)
  })

  it('keeps the admin scope strictly narrower than the user scope', () => {
    expect(userManifest.scope).toBe('/')
    expect(adminManifest.scope.startsWith(userManifest.scope)).toBe(true)
    expect(adminManifest.scope).not.toBe(userManifest.scope)
  })

  it('gives each app its own identity and icons', () => {
    expect(adminManifest.id).not.toBe(userManifest.id)
    expect(adminManifest.icons.map((icon) => icon.src)).not.toEqual(
      userManifest.icons.map((icon) => icon.src),
    )
  })
})
