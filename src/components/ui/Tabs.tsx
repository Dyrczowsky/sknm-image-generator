import { createContext, useContext, useId } from 'react'
import type { ComponentProps, KeyboardEvent, ReactNode } from 'react'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import { rovingTarget } from './keys'

// Zakładki sterowane z zewnątrz:
//
//   <Tabs value={tab} onChange={setTab}>
//     <TabList label="Sekcje edytora" tabs={[{ value: 'template', label: 'Szablon' }, ...]} />
//     <TabPanel value="template">...</TabPanel>
//     <TabPanel value="content">...</TabPanel>
//   </Tabs>
//
// `Tabs` nie rysuje własnego elementu - listę i panele można rozdzielić
// dowolnym układem (lista przyklejona, panel przewijany). Panele nieaktywne
// zostają w drzewie z atrybutem `hidden`, więc wpisane w nich dane nie giną.

interface TabsContextValue {
  value: string
  onChange: (value: string) => void
  baseId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs(): TabsContextValue {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabList i TabPanel muszą być wewnątrz <Tabs>')
  return context
}

const tabId = (baseId: string, value: string) => `${baseId}-tab-${value}`
const panelId = (baseId: string, value: string) => `${baseId}-panel-${value}`

interface TabsProps<T extends string> {
  value: T
  onChange: (value: T) => void
  children: ReactNode
}

export function Tabs<T extends string>({ value, onChange, children }: TabsProps<T>) {
  const baseId = useId()
  return (
    <TabsContext.Provider value={{ value, onChange: onChange as (value: string) => void, baseId }}>
      {children}
    </TabsContext.Provider>
  )
}

export interface TabSpec<T extends string = string> {
  value: T
  label: string
  icon?: IconName
  // Dodatek za podpisem, np. `<Badge>` z liczbą.
  badge?: ReactNode
  disabled?: boolean
}

interface TabListProps<T extends string> {
  // Nazwa listy dla czytników ekranu.
  label: string
  tabs: readonly TabSpec<T>[]
  // Zakładki dzielą szerokość po równo (wąskie panele, telefon).
  fill?: boolean
  className?: string
}

const TAB =
  'relative inline-flex h-11 flex-none cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap border-0 bg-transparent px-3 text-[0.875rem] font-medium text-muted transition-colors duration-150 after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent hover:text-fg focus-visible:-outline-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-selected:font-bold aria-selected:text-fg aria-selected:after:bg-accent min-[900px]:h-10'

// Strzałki ← → (oraz Home / End) przenoszą fokus i od razu wybierają zakładkę;
// Tab wychodzi z listy do aktywnego panelu.
export function TabList<T extends string>({ label, tabs, fill = false, className }: TabListProps<T>) {
  const { value, onChange, baseId } = useTabs()
  // Gdy `value` nie pasuje do żadnej zakładki, w kolejce Tab zostaje pierwsza.
  const focusable = tabs.some((tab) => tab.value === value && !tab.disabled) ? value : tabs.find((tab) => !tab.disabled)?.value

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target = rovingTarget(event.key, index, tabs.map((tab) => !tab.disabled))
    if (target === null) return
    event.preventDefault()
    const next = tabs[target]
    if (!next) return
    onChange(next.value)
    document.getElementById(tabId(baseId, next.value))?.focus()
  }

  return (
    <div role="tablist" aria-label={label} className={`flex min-w-0 border-b border-border${className ? ` ${className}` : ''}`}>
      {tabs.map((tab, index) => {
        const selected = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            id={tabId(baseId, tab.value)}
            aria-selected={selected}
            aria-controls={panelId(baseId, tab.value)}
            tabIndex={tab.value === focusable ? 0 : -1}
            disabled={tab.disabled}
            className={fill ? `${TAB} min-w-0 flex-1` : TAB}
            onClick={() => onChange(tab.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {tab.icon && <Icon name={tab.icon} />}
            <span className={fill ? 'truncate' : undefined}>{tab.label}</span>
            {tab.badge}
          </button>
        )
      })}
    </div>
  )
}

interface TabPanelProps<T extends string> extends Omit<ComponentProps<'div'>, 'role' | 'id' | 'hidden' | 'aria-labelledby'> {
  value: T
}

// Treść jednej zakładki. Zawsze w drzewie; nieaktywna ma `hidden`.
export function TabPanel<T extends string>({ value, children, ...rest }: TabPanelProps<T>) {
  const tabs = useTabs()
  return (
    <div role="tabpanel" id={panelId(tabs.baseId, value)} aria-labelledby={tabId(tabs.baseId, value)} hidden={tabs.value !== value} {...rest}>
      {children}
    </div>
  )
}
