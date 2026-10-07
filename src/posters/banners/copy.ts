import type { PosterLang } from '../../types'

// Stała treść banera: nazwa koła zamiast danych wydarzenia. Baner nie czyta
// tytułu, prelegenta ani daty z formularza - to wizytówka koła, nie plakat.
// Hasło i lista aktywności pochodzą z plakatu „Rekrutacja".
const COPY = {
  pl: {
    name: 'Studenckie Koło Naukowe Matematyków',
    university: 'Politechnika Krakowska',
    tagline: 'Seminaria, konkursy, wyjazdy i własne projekty badawcze. Każdy rok studiów, każdy wydział.',
    activities: ['Seminaria', 'Konkursy', 'Wyjazdy', 'Projekty badawcze'],
  },
  en: {
    name: 'Student Science Club of Mathematics',
    university: 'Krakow University of Technology',
    tagline: 'Seminars, competitions, trips, and our own research projects. Every year of study, every faculty.',
    activities: ['Seminars', 'Competitions', 'Trips', 'Research projects'],
  },
}

export const BANNER_SITE = 'sknm.pk.edu.pl'

export function bannerCopy(lang: PosterLang = 'pl') {
  return COPY[lang]
}
