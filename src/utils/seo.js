const SITE_URL = 'https://sa-bt.ir'

const landingSeo = {
  fa: {
    title: 'احمد بخشیان | توسعه‌دهنده Laravel و Vue',
    description: 'احمد بخشیان، توسعه‌دهنده بک‌اند با Laravel و PHP و علاقه‌مند به فرانت‌اند با Vue. سوابق کاری، مهارت‌ها و راه‌های ارتباطی.',
    locale: 'fa_IR',
  },
  en: {
    title: 'Ahmad Bakhshiyan | Laravel and Vue Developer',
    description: 'Ahmad Bakhshiyan is a backend developer specializing in Laravel and PHP, with Vue frontend experience. Explore his skills, experience, and contact details.',
    locale: 'en_US',
  },
}

function setMeta(selector, attributes) {
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value)
  })
}

function setLink(rel, href, hreflang = null) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('link')
    element.rel = rel
    document.head.appendChild(element)
  }

  element.href = href
  if (hreflang) element.hreflang = hreflang
}

function removeLink(rel) {
  document.head.querySelectorAll(`link[rel="${rel}"]`).forEach((element) => element.remove())
}

export function applySeo(to) {
  const language = to.meta.locale
  const isLanding = to.name === 'landing' && landingSeo[language]

  if (!isLanding) {
    document.title = to.meta.title || 'Do IT'
    setMeta('meta[name="robots"]', {
      name: 'robots',
      content: 'noindex, nofollow',
    })
    removeLink('canonical')
    removeLink('alternate')
    return
  }

  const seo = landingSeo[language]
  const canonicalUrl = `${SITE_URL}/${language}`
  const imageUrl = `${SITE_URL}/pwa-512x512.png`

  document.documentElement.lang = language
  document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr'
  document.title = seo.title

  setMeta('meta[name="description"]', { name: 'description', content: seo.description })
  setMeta('meta[name="robots"]', {
    name: 'robots',
    content: 'index, follow, max-image-preview:large',
  })
  setMeta('meta[property="og:type"]', { property: 'og:type', content: 'profile' })
  setMeta('meta[property="og:title"]', { property: 'og:title', content: seo.title })
  setMeta('meta[property="og:description"]', { property: 'og:description', content: seo.description })
  setMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
  setMeta('meta[property="og:image"]', { property: 'og:image', content: imageUrl })
  setMeta('meta[property="og:image:alt"]', {
    property: 'og:image:alt',
    content: language === 'fa' ? 'نشان احمد بخشیان' : 'Ahmad Bakhshiyan logo',
  })
  setMeta('meta[property="og:locale"]', { property: 'og:locale', content: seo.locale })
  setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
  setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: seo.title })
  setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: seo.description })
  setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl })

  setLink('canonical', canonicalUrl)
  setLink('alternate', `${SITE_URL}/fa`, 'fa')
  setLink('alternate', `${SITE_URL}/en`, 'en')
  setLink('alternate', `${SITE_URL}/fa`, 'x-default')
}

