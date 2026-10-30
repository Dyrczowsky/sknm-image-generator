import { useState } from 'react'
import type { ReactNode } from 'react'
import { SLIDE_THEMES, THEME_KEYS } from '../../slides/themes'
import type { SlideAspect, SlideBackground } from '../../slides/types'
import { stepCount } from '../../slides/useDeckEditor'
import type { DeckEditor } from '../../slides/useDeckEditor'
import { SegmentedToggle } from '../SegmentedToggle'
import { Button, Icon, Popover, TabList, TabPanel, Tabs } from '../ui'
import type { IconName, TabSpec } from '../ui'
import { LayoutGallery } from './LayoutGallery'
import { TransitionGallery } from './TransitionGallery'

type RibbonTab = 'home' | 'design' | 'transitions'

const TABS: readonly TabSpec<RibbonTab>[] = [
  { value: 'home', label: 'Narzędzia główne' },
  { value: 'design', label: 'Projekt' },
  { value: 'transitions', label: 'Przejścia', icon: 'transition' },
]

const ASPECT_OPTIONS = [
  { value: '16:9', label: '16:9' },
  { value: '1:1', label: '1:1' },
] as const satisfies readonly { value: SlideAspect; label: string }[]

const BACKGROUND_OPTIONS = [
  { value: 'jasne', label: 'Jasne' },
  { value: 'ciemne', label: 'Ciemne' },
] as const satisfies readonly { value: SlideBackground; label: string }[]

// Panel zakładki: grupy obok siebie, na wąskim ekranie zawijają się. Bez
// przewijania w poziomie - przycinałoby wysuwaną galerię „Nowy slajd" (Popover bez portalu).
const PANEL = 'flex min-w-0 flex-wrap items-stretch gap-y-2 px-2 py-2 min-[900px]:flex-nowrap'

interface RibbonProps {
  editor: DeckEditor
}

// Wstążka nad slajdem, jak w PowerPoincie: Narzędzia główne / Projekt / Przejścia.
export function Ribbon({ editor }: RibbonProps) {
  const [tab, setTab] = useState<RibbonTab>('home')
  const { deck, slide, selected } = editor
  const total = deck.slides.length
  const steps = slide ? stepCount(slide.layout, slide.data) : 0

  return (
    <div className="flex-none border-b border-border bg-surface">
      <Tabs value={tab} onChange={setTab}>
        <div className="overflow-x-auto border-b border-border">
          <TabList label="Wstążka" tabs={TABS} className="-mb-px px-2" />
        </div>
        <TabPanel value="home" className={PANEL}>
          <Group label="Slajdy">
            <Popover
              label="Nowy slajd"
              className="max-h-[70dvh] overflow-y-auto"
              trigger={(props) => (
                <Button {...props} icon="plus" iconEnd="chevronDown">
                  Nowy slajd
                </Button>
              )}
            >
              {(close) => (
                <LayoutGallery
                  theme={deck.theme}
                  aspect={deck.viewAspect}
                  onPick={(key) => {
                    close()
                    editor.addSlide(key)
                  }}
                />
              )}
            </Popover>
            <Button variant="ghost" icon="copy" onClick={() => editor.duplicate()}>
              Duplikuj
            </Button>
            <Button variant="ghost" icon="trash" disabled={total <= 1} title={total <= 1 ? 'Prezentacja musi mieć co najmniej jeden slajd' : undefined} onClick={() => editor.remove()}>
              Usuń
            </Button>
          </Group>
          <Group label="Kolejność">
            <Button variant="ghost" icon="arrowUp" disabled={selected === 0} onClick={() => editor.move(selected, selected - 1)}>
              Przenieś w górę
            </Button>
            <Button variant="ghost" icon="arrowDown" disabled={selected >= total - 1} onClick={() => editor.move(selected, selected + 1)}>
              Przenieś w dół
            </Button>
          </Group>
        </TabPanel>

        <TabPanel value="design" className={PANEL}>
          <Group label="Format podglądu">
            <Icon name={deck.viewAspect === '1:1' ? 'aspectSquare' : 'aspectWide'} className="text-muted" />
            <SegmentedToggle value={deck.viewAspect} options={ASPECT_OPTIONS} ariaLabel="Format podglądu" onChange={editor.setViewAspect} />
          </Group>
          <Group label="Motyw">
            <div role="group" aria-label="Motyw prezentacji" className="flex items-center gap-1.5">
              {THEME_KEYS.map((key) => {
                const theme = SLIDE_THEMES[key]
                const active = deck.theme === key
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border bg-field px-2 text-[0.8125rem] font-semibold text-fg transition-colors hover:border-muted ${
                      active ? 'border-accent shadow-[0_0_0_1px_var(--accent)]' : 'border-border'
                    }`}
                    onClick={() => editor.setDeckProps({ theme: key })}
                  >
                    <span aria-hidden="true" className="relative block size-6 overflow-hidden rounded-[5px] shadow-[0_0_0_1px_rgb(0_0_0/0.15)]" style={{ background: theme.jasne.bg }}>
                      <span className="absolute inset-x-0 bottom-0 h-2" style={{ background: theme.ciemne.bg }} />
                      <span className="absolute top-1 left-1 h-1 w-3 rounded-full" style={{ background: theme.jasne.accent }} />
                    </span>
                    {theme.label}
                    {active && <Icon name="check" className="text-accent-text" />}
                  </button>
                )
              })}
            </div>
          </Group>
          <Group label="Ten slajd">
            <SegmentedToggle
              value={slide?.background ?? 'jasne'}
              options={BACKGROUND_OPTIONS}
              ariaLabel="Tło slajdu"
              onChange={(background) => editor.updateSlide({ background })}
            />
            <Toggle icon="mirror" pressed={slide?.mirrored ?? false} onClick={() => editor.updateSlide({ mirrored: !slide?.mirrored })}>
              Odbij układ
            </Toggle>
            <Toggle
              icon="play"
              pressed={Boolean(slide?.reveal) && steps > 0}
              disabled={steps === 0}
              title={steps === 0 ? 'Ten układ nie ma elementów do pokazywania po kolei' : 'Elementy pojawiają się po kolei, kliknięcie po kliknięciu'}
              onClick={() => editor.updateSlide({ reveal: !slide?.reveal })}
            >
              Pokazuj po kolei
            </Toggle>
          </Group>
        </TabPanel>

        <TabPanel value="transitions" className="px-4 py-3">
          {slide && (
            <TransitionGallery
              value={slide.transition ?? deck.transition}
              overridden={slide.transition !== undefined}
              duration={deck.duration}
              onChange={(transition) => editor.updateSlide({ transition })}
              onDurationChange={(duration) => editor.setDeckProps({ duration }, 'duration')}
              onApplyToAll={editor.applyTransitionToAll}
              onResetToDefault={() => editor.updateSlide({ transition: undefined })}
            />
          )}
        </TabPanel>
      </Tabs>
    </div>
  )
}

// Grupa przycisków z podpisem pod spodem (jak we wstążce Office).
function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-none flex-col items-start justify-between gap-1 border-r border-border px-3 last:border-r-0">
      <div className="flex min-h-10 items-center gap-1.5">{children}</div>
      <span className="text-[0.75rem] leading-none text-muted">{label}</span>
    </div>
  )
}

interface ToggleProps {
  icon: IconName
  pressed: boolean
  disabled?: boolean
  title?: string
  onClick: () => void
  children: string
}

// Przełącznik z napisem: stan niesie `aria-pressed` i znaczek ✓, nie tylko kolor.
function Toggle({ icon, pressed, disabled, title, onClick, children }: ToggleProps) {
  return (
    <Button
      variant={pressed ? 'outline' : 'ghost'}
      icon={icon}
      iconEnd={pressed ? 'check' : undefined}
      aria-pressed={pressed}
      disabled={disabled}
      title={title}
      className={pressed ? 'border-accent text-accent-text' : undefined}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
