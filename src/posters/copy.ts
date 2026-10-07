import type { PosterLang } from '../types'

// Wbudowany tekst plakatów i banerów w obu językach (przełącznik PL/EN):
// stałe podpisy oraz domyślne treści pól, które użytkownik może nadpisać
// w formularzu. Formularze biorą stąd polskie wersje jako placeholdery.
type Localized<T> = Record<PosterLang, T>

export const SITE_URL = 'sknm.pk.edu.pl'
export const SOCIAL_HANDLE = '@sknm.pk'

// Pełna nazwa koła - na banerze zawsze w całości („... Politechniki
// Krakowskiej"), bez skracania i bez rozbijania na nazwę koła i osobny
// podpis uczelni.
export const CLUB_NAME: Localized<string> = {
  pl: 'Studenckie Koło Naukowe Matematyków Politechniki Krakowskiej',
  en: 'Student Science Club of Mathematics of the Krakow University of Technology',
}

// Linie bloku `BrandingText` w rogu plakatu.
export const BRANDING_SHORT: Localized<string[]> = {
  pl: ['SKNM', 'POLITECHNIKA', 'KRAKOWSKA'],
  en: ['SKNM', 'KRAKOW UNIVERSITY', 'OF TECHNOLOGY'],
}

export const BRANDING_FULL: Localized<string[]> = {
  pl: ['STUDENCKIE KOŁO', 'NAUKOWE MATEMATYKÓW', 'POLITECHNIKI KRAKOWSKIEJ'],
  en: ['STUDENT SCIENCE CLUB', 'OF MATHEMATICS', 'KRAKOW UNIVERSITY OF TECHNOLOGY'],
}

export const BRANDING_EVENT: Localized<string[]> = {
  pl: ['WYDARZENIE', 'SKNM · PK'],
  en: ['EVENT', 'SKNM · PK'],
}

// Domyślna treść plakietki (`badge`, a w Konferencji też `badge2` w stopce),
// gdy pole formularza jest puste.
export const DEFAULT_BADGE = {
  wyklad: { pl: 'WYKŁAD OTWARTY', en: 'OPEN LECTURE' },
  warsztat: { pl: 'WARSZTATY', en: 'WORKSHOP' },
  seminarium: { pl: 'SEMINARIUM SKNM', en: 'SKNM SEMINAR' },
  wiecejInformacji: { pl: 'WIĘCEJ INFORMACJI', en: 'MORE INFORMATION' },
  rekrutacja: { pl: 'SPOTKANIE ORGANIZACYJNE', en: 'KICK-OFF MEETING' },
  gala: { pl: 'GALA SKNM', en: 'SKNM GALA' },
  komunikat: { pl: 'KOMUNIKAT', en: 'ANNOUNCEMENT' },
} satisfies Record<string, Localized<string>>

export const FREE_ENTRY: Localized<string> = {
  pl: `Wstęp wolny · ${SITE_URL}`,
  en: `Free entry · ${SITE_URL}`,
}

// Domyślny podtytuł Rekrutacji.
export const RECRUITMENT_PITCH: Localized<string> = {
  pl: 'Seminaria, konkursy, wyjazdy i własne projekty badawcze. Każdy rok studiów, każdy wydział.',
  en: 'Seminars, competitions, trips, and our own research projects. Every year of study, every faculty.',
}
