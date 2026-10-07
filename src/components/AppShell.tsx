import type { ReactNode } from 'react'
import type { Page } from '../utils/route'
import { OFFSCREEN } from './styles'

interface AppShellProps {
  page: Page
  topBar: ReactNode
  // Strona edytora - ZAWSZE w drzewie. Poza edytorem jest tylko schowana
  // (`inert` + poza oknem, patrz `OFFSCREEN`), bo eksport rasteryzuje węzeł
  // plakatu z podglądu (`posterRef`), a skrót „Pobierz" działa na każdej stronie.
  editor: ReactNode
  // Bieżąca strona poboczna (Projekty, Grafiki, Historia, Notatki).
  children?: ReactNode
}

// Szkielet aplikacji: górny pasek i miejsce na stronę. Od 900 px całość ma
// wysokość okna i sama się nie przewija - przewijają się panele w środku
// (lewy panel edytora, treść strony pobocznej). Węziej przewija się dokument.
export function AppShell({ page, topBar, editor, children }: AppShellProps) {
  const onEditor = page === 'editor'
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg min-[900px]:h-dvh min-[900px]:overflow-hidden">
      {topBar}
      <main className="flex min-h-0 flex-1 flex-col">
        {/* Schowany edytor zachowuje wysokość, jaką ma pod górnym paskiem
            (3,5 rem od 900 px), żeby podgląd po powrocie nie zmieniał rozmiaru. */}
        <div
          data-page="editor"
          inert={!onEditor}
          className={`flex min-h-0 flex-col ${onEditor ? 'flex-1' : `${OFFSCREEN} min-[900px]:h-[calc(100dvh-3.5rem)]`}`}
        >
          {editor}
        </div>
        {!onEditor && (
          <div data-page={page} className="min-h-0 flex-1 min-[900px]:overflow-y-auto">
            {children}
          </div>
        )}
      </main>
    </div>
  )
}
