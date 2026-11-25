import type { Block } from './blocks'

// Treść pokazywana, gdy formularz nie ma jeszcze bloków (miniatury, nowy plakat).
export const SAMPLE_BLOCKS: Block[] = [
  { id: 's1', type: 'heading', title: 'Wstęp' },
  { id: 's2', type: 'text', text: 'Badamy, jak twierdzenie Bayesa porządkuje wnioskowanie w zadaniach klasyfikacji. Plakat prezentuje założenia, metodę oraz najważniejsze wyniki projektu koła.' },
  { id: 's3', type: 'heading', title: 'Metody' },
  { id: 's4', type: 'latex', text: 'P(A\\mid B)=\\frac{P(B\\mid A)\\,P(A)}{P(B)}' },
  { id: 's5', type: 'text', text: 'Rozkład a priori aktualizujemy po każdej obserwacji, a parametry estymujemy metodą największej wiarygodności.' },
  { id: 's6', type: 'heading', title: 'Wyniki' },
  { id: 's7', type: 'bullets', text: 'Dokładność klasyfikacji wzrosła do 94%\nCzas obliczeń skrócony trzykrotnie\nMetoda stabilna dla małych próbek' },
  { id: 's8', type: 'callout', tone: 'wniosek', title: 'Wniosek', text: 'Podejście bayesowskie daje wiarygodne wyniki nawet przy niewielkiej liczbie danych.' },
  { id: 's9', type: 'heading', title: 'Bibliografia' },
  { id: 's10', type: 'text', text: '[1] T. Bayes, An Essay towards solving a Problem in the Doctrine of Chances, 1763.\n[2] C. Bishop, Pattern Recognition and Machine Learning, Springer 2006.' },
]
