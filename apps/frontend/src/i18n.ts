import { useEffect, useState } from 'react'

export type Language = 'en' | 'fr'

const LANGUAGE_STORAGE_KEY = 'osai.language'

const dictionaries = {
  en: {
    'brand.tagline': 'Street-ready essentials',
    'nav.shop': 'Shop',
    'nav.wishlist': 'Saved',
    'nav.cart': 'Cart',
    'nav.track': 'Track',
    'nav.checkout': 'Checkout',
    'nav.profile': 'Profile',
    'nav.login': 'Login',
    'home.badge': 'New season essentials',
    'home.heroTitle': 'Clothes made for fast days and late nights.',
    'home.heroCopy':
      'OSAI brings clean streetwear pieces with sharp silhouettes, easy layering, and a checkout flow built to stay out of your way.',
    'home.shopCollection': 'Shop collection',
    'home.browseEdits': 'Browse edits',
  },
  fr: {
    'brand.tagline': 'Essentiels streetwear',
    'nav.shop': 'Boutique',
    'nav.wishlist': 'Sauvegardes',
    'nav.cart': 'Panier',
    'nav.track': 'Suivi',
    'nav.checkout': 'Paiement',
    'nav.profile': 'Profil',
    'nav.login': 'Connexion',
    'home.badge': 'Essentiels de saison',
    'home.heroTitle': 'Des pieces faites pour les journees rapides et les longues soirees.',
    'home.heroCopy':
      'OSAI propose un streetwear net, des coupes marquees, des pieces faciles a superposer et un paiement qui reste simple.',
    'home.shopCollection': 'Voir la collection',
    'home.browseEdits': 'Voir les edits',
  },
} satisfies Record<Language, Record<string, string>>

const isLanguage = (value: string | null): value is Language => value === 'en' || value === 'fr'

const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return isLanguage(storedLanguage) ? storedLanguage : 'en'
}

export const setStoredLanguage = (language: Language) => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  window.dispatchEvent(new CustomEvent('osai-language-change', { detail: language }))
}

export const useTranslation = () => {
  const [language, setLanguage] = useState<Language>(getStoredLanguage)

  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const nextLanguage = (event as CustomEvent<Language>).detail

      if (nextLanguage) {
        setLanguage(nextLanguage)
      }
    }

    window.addEventListener('osai-language-change', handleLanguageChange)
    return () => window.removeEventListener('osai-language-change', handleLanguageChange)
  }, [])

  return {
    language,
    setLanguage: setStoredLanguage,
    t: (key: keyof (typeof dictionaries)['en']) => dictionaries[language][key],
  }
}
