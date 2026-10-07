import type { PosterLang } from '../../types'

// Stała treść banera: pełna nazwa koła zamiast danych wydarzenia. Nazwa
// występuje zawsze w całości („... Politechniki Krakowskiej") - nie skracamy
// jej i nie rozbijamy na nazwę koła i osobny podpis uczelni. Baner nie czyta
// tytułu, prelegenta ani daty z formularza - to wizytówka koła, nie plakat.
const COPY = {
  pl: {
    name: 'Studenckie Koło Naukowe Matematyków Politechniki Krakowskiej',
  },
  en: {
    name: 'Student Science Club of Mathematics of the Krakow University of Technology',
  },
}

export const BANNER_SITE = 'sknm.pk.edu.pl'

export function bannerCopy(lang: PosterLang = 'pl') {
  return COPY[lang]
}
