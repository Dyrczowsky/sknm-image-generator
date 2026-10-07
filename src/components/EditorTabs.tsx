import type { ReactNode } from 'react'
import { EDITOR_TABS } from '../utils/uiState'
import type { EditorTab } from '../utils/uiState'
import { TabList, TabPanel, Tabs } from './ui'
import type { IconName, TabSpec } from './ui'

interface EditorTabsProps {
  value: EditorTab
  onChange: (tab: EditorTab) => void
  // Treść trzech zakładek. Wszystkie są stale w drzewie (nieaktywna dostaje
  // `hidden`), więc wpisane dane i stan pól nie giną przy przełączaniu.
  template: ReactNode
  content: ReactNode
  look: ReactNode
  // Panel na całą szerokość okna (baner): lista zakładek nie rozciąga się
  // wtedy na cały ekran, tylko trzyma lewą krawędź.
  wide?: boolean
  className?: string
}

const TAB_ICON: Record<EditorTab, IconName> = { template: 'template', content: 'content', look: 'look' }
const TABS: readonly TabSpec<EditorTab>[] = EDITOR_TABS.map(({ tab, label }) => ({ value: tab, label, icon: TAB_ICON[tab] }))

// Każda zakładka przewija się osobno (od 900 px), więc przełączenie nie
// przenosi pozycji przewinięcia z jednej do drugiej.
const PANEL = 'p-4 min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:overflow-y-auto min-[900px]:[scrollbar-gutter:stable]'

// Lewy panel edytora: zakładki Szablon / Treść / Wygląd. Lista zakładek stoi
// w miejscu, przewija się tylko treść.
export function EditorTabs({ value, onChange, template, content, look, wide = false, className }: EditorTabsProps) {
  return (
    <section aria-label="Edycja plakatu" className={`flex min-w-0 flex-col bg-surface${className ? ` ${className}` : ''}`}>
      <Tabs value={value} onChange={onChange}>
        {/* Kreska pod zakładkami biegnie przez cały panel, także gdy sama
            lista jest węższa (jej własna kreska nakłada się na tę). */}
        <div className="flex-none border-b border-border">
          <TabList label="Sekcje edytora" tabs={TABS} fill className={`-mb-px px-2 ${wide ? 'min-[900px]:max-w-[30rem]' : ''}`} />
        </div>
        <TabPanel value="template" className={PANEL}>{template}</TabPanel>
        <TabPanel value="content" className={PANEL}>{content}</TabPanel>
        <TabPanel value="look" className={PANEL}>{look}</TabPanel>
      </Tabs>
    </section>
  )
}
