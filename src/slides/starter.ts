import { createDeck, createSlide } from './deck'
import type { Deck, Slide, SlideData } from './types'

// Startowa prezentacja „Poznajmy się" - odtworzenie prezentacji wzorcowej,
// slajd po slajdzie, na naszych układach. Zdjęcia zostają puste (użytkownik
// dodaje własne), a treść przepisana dosłownie (twarde spacje -> zwykłe).

// Nowy slajd układu `key` z podmienioną treścią. Jedno `createSlide`, więc
// klucze `data` zawsze zgadzają się z `defaults` układu.
function slajd(key: string, patch: Partial<Omit<Slide, 'id' | 'layout' | 'data'>>, dane: SlideData): Slide {
  const slide = createSlide(key)
  return { ...slide, ...patch, data: { ...slide.data, ...dane } }
}

export function createStarterDeck(): Deck {
  return createDeck('Poznajmy się', [
    // 1 - tytuł (ciemne tło)
    slajd('tytul', { background: 'ciemne' }, {
      kicker: 'Poznajmy się',
      title: 'Studenckie Koło Naukowe Matematyków',
      subtitle: 'Politechniki Krakowskiej',
      tagline: 'Co robimy, gdzie jeździmy i dlaczego warto do nas dołączyć.',
    }),
    // 2 - o nas
    slajd('tekstZdjecia', {}, {
      kicker: 'O nas',
      heading: 'Matematyka po zajęciach',
      lead: 'Jesteśmy studentami, którzy lubią matematykę także wtedy, gdy nikt nie wystawia za nią ocen.',
      lead2: 'Spotykamy się, słuchamy referatów, jeździmy na konferencje i organizujemy własną.',
      caption: 'Pierwsze spotkanie',
    }),
    // 3 - spotkania (odwrócony)
    slajd('tekstZdjecia', { mirrored: true }, {
      kicker: 'Spotkania',
      heading: 'Referaty od studentów dla studentów',
      lead: 'Na spotkaniach każdy może opowiedzieć o tym, co go wciągnęło: od teorii po zastosowania, które da się policzyć na własnym laptopie.',
      lead2: '',
      caption: 'Referaty na spotkaniach',
    }),
    // 4 - OMatKo!!!
    slajd('tekstZdjecia', {}, {
      kicker: 'Wyjazdy',
      heading: 'OMatKo!!!',
      lead: 'Ogólnopolska Matematyczna Konferencja Studentów: największe matematyczne wydarzenie dla studentów i doktorantów z całej Polski, organizowane przez koła naukowe Politechniki Wrocławskiej.',
      lead2: 'W myśl idei „studenci studentom” uczestnicy opowiadają o swoich zainteresowaniach i własnych badaniach.',
      place: 'Wrocław',
      caption: 'OMatKo!!!, Wrocław',
    }),
    // 5 - MathUp (odwrócony, jedno zdjęcie)
    slajd('tekstZdjecia', { mirrored: true }, {
      kicker: 'Wyjazdy',
      heading: 'MathUp',
      lead: 'Studencka Konferencja Zastosowań Matematyki na Politechnice Łódzkiej. Jej cel: pokazać, że matematyka jest wszędzie wokół nas.',
      lead2: 'Starsi studenci prezentują zastosowania matematyki młodszym rocznikom.',
      place: 'Łódź',
      showPhoto2: false,
      caption: 'MathUp, Łódź',
    }),
    // 6 - Poznań i Kraków (lista, z odsłanianiem)
    slajd('lista', { reveal: true }, {
      kicker: 'Wyjazdy',
      heading: 'Poznań i Kraków',
      entries: [
        {
          title: 'θβℓιcℤε',
          text: 'Coroczna ogólnopolska studencka konferencja matematyczna w Poznaniu, organizowana przez Koło Naukowe Matematyków UAM. Od teorii po zastosowania i informatykę.',
        },
        {
          title: 'OSSM',
          text: 'Ogólnopolska Sesja Studentów Matematyki, organizowana przez Koło Matematyków Studentów UJ. Trzy dni referatów i plakatów ze wszystkich działów matematyki.',
        },
      ],
      caption: 'OSSM UJ, Kraków',
    }),
    // 7 - dzień otwarty (odwrócony, jedno zdjęcie)
    slajd('tekstZdjecia', { mirrored: true }, {
      kicker: 'Na uczelni',
      heading: 'Dzień otwarty',
      lead: 'Pokazujemy matematykę kandydatom na studia: zagadki, gry i rozmowy o tym, jak naprawdę wygląda ten kierunek.',
      lead2: '',
      showPhoto2: false,
      caption: 'Dzień otwarty Politechniki Krakowskiej',
    }),
    // 8 - WSAD
    slajd('mozaika', {}, {
      kicker: 'Nasza konferencja',
      heading: 'WSAD',
      fullName: 'Ogólnopolskie Warsztaty Statystyki i Analizy Danych',
      lead: 'Co roku organizujemy je na Politechnice Krakowskiej. Przed nami XV edycja: referaty, plakaty i warsztaty.',
      tags: [{ text: 'statystyka' }, { text: 'inżynieria finansowa' }, { text: 'machine learning' }],
      link: 'wsad.edu.pl',
    }),
    // 9 - karty w siatce (z odsłanianiem)
    slajd('karty', { reveal: true }, {
      kicker: 'Po co to wszystko',
      heading: 'Koło to nie tylko matematyka',
      lead: 'Przy okazji referatów, wyjazdów i organizowania konferencji uczysz się rzeczy, których nie ma w sylabusie.',
      variant: 'siatka',
      cards: [
        { title: 'Pewność siebie', text: 'Pierwszy referat przed znajomymi z koła to najlepszy trening przed każdym następnym.' },
        { title: 'Wystąpienia publiczne', text: 'Od spotkania w sali po aulę na ogólnopolskiej konferencji.' },
        { title: 'Organizacja pracy', text: 'Terminy, podział zadań i projekty, które trzeba doprowadzić do końca.' },
        { title: 'Praca w zespole', text: 'Konferencji nie da się zorganizować w pojedynkę.' },
        { title: 'Ludzie', text: 'Znajomi z innych roczników, uczelni i miast.' },
        { title: 'Doświadczenie', text: 'Konkretne rzeczy do CV jeszcze przed pierwszą pracą.' },
      ],
    }),
    // 10 - plany na ten rok (karty numerowane, z odsłanianiem)
    slajd('karty', { reveal: true }, {
      kicker: 'Co przed nami',
      heading: 'Plany na ten rok',
      lead: '',
      variant: 'numerowane',
      cards: [
        { title: 'Spotkania dla pierwszego roku', text: 'Cykliczne spotkania dla osób, które dopiero zaczynają studia.' },
        { title: 'Duże projekty', text: 'Rozwijamy projekty, nad którymi pracuje się zespołowo przez cały rok.' },
        { title: 'XV edycja WSAD', text: 'Organizujemy kolejne Ogólnopolskie Warsztaty Statystyki i Analizy Danych.' },
        { title: 'Konferencje w całej Polsce', text: 'Wrocław, Łódź, Poznań, Kraków: jedziemy z referatami i plakatami.' },
      ],
    }),
    // 11 - zaproszenie (ciemne tło)
    slajd('zaproszenie', { background: 'ciemne' }, {
      kicker: 'Zaproszenie',
      heading: 'Wpadnij na spotkanie',
      date: '14 października',
      timePlace: '19:30 · sala S3, GIL',
      lead: 'Nie trzeba nic umieć ani nic przygotowywać. Wystarczy przyjść.',
      also: 'Przydadzą nam się też inne umiejętności',
      tags: [
        { text: 'planowanie' },
        { text: 'social media' },
        { text: 'grafika komputerowa' },
        { text: 'zdjęcia i wideo' },
        { text: 'pisanie tekstów' },
        { text: 'kontakt z partnerami' },
        { text: 'strony WWW' },
      ],
    }),
  ])
}

// Pusta prezentacja: sam slajd tytułowy.
export function createEmptyDeck(): Deck {
  return createDeck('Nowa prezentacja', [createSlide('tytul')])
}
