import type { ComponentType, CSSProperties, RefObject } from 'react'
import type { PosterExport } from '../editor/usePosterExport'
import { SHAPE_SIZE } from '../posters/shape'
import type { AccentName, PosterLang, PosterProps, RawPosterData } from '../types'
import { fitWidth, stagePadding } from '../utils/fit'
import { useElementSize } from '../utils/useElementSize'
import { ExportBar } from './ExportBar'
import { PosterPreview } from './PosterPreview'
import { Icon } from './ui'

// Szerokość podglądu, zanim scena zostanie zmierzona (pierwszy render, testy).
const UNMEASURED_SIZE = 360

interface PreviewPaneProps {
  // Ref do węzła plakatu w pełnej rozdzielczości - z niego powstaje plik.
  posterRef: RefObject<HTMLDivElement | null>
  Component?: ComponentType<PosterProps>
  data: RawPosterData
  scheme?: string
  accent?: AccentName
  lang: PosterLang
  exporter: PosterExport
  // Panel schowany (telefon, widok „Edycja"): poza kolejką fokusu i czytnikami.
  inert?: boolean
  className?: string
}

// Prawy panel edytora: ustawienia eksportu, a pod nimi podgląd, którego kształt
// zmieniają. Podgląd jest wpisany w scenę w OBU wymiarach (kwadrat, pion,
// poziom, oba banery), więc nigdy nie jest przycięty i nie wymusza przewijania.
//
// Scena nie zależy od rozmiaru plakatu (plakat jest w niej pozycjonowany
// absolutnie): od 900 px bierze resztę wysokości panelu, a węziej ma proporcje
// plakatu, ale nie więcej wysokości, niż zostaje w oknie telefonu między
// górnymi paskami (ok. 21 rem z dwuwierszowym paskiem eksportu) a dolnym
// paskiem „Pobierz" (ok. 4 rem) - wysoki plakat A4 też widać w całości.
export function PreviewPane({ posterRef, Component, data, scheme, accent, lang, exporter, inert, className }: PreviewPaneProps) {
  const [stageRef, stage] = useElementSize<HTMLDivElement>()
  const shape = SHAPE_SIZE[exporter.shape]
  const size = fitWidth(stage, shape, stagePadding(stage)) || UNMEASURED_SIZE
  const ratio = { '--preview-ratio': `${shape.width} / ${shape.height}` } as CSSProperties

  return (
    <section aria-label="Podgląd i eksport" inert={inert} className={`flex min-w-0 flex-col bg-sunken${className ? ` ${className}` : ''}`}>
      <ExportBar exporter={exporter} className="flex-none border-b border-border bg-bg px-4 py-2 min-[900px]:min-h-13" />
      <div
        ref={stageRef}
        style={ratio}
        className="relative aspect-(--preview-ratio) max-h-[max(14rem,calc(100dvh-27rem))] min-h-40 w-full overflow-hidden min-[900px]:aspect-auto min-[900px]:max-h-none min-[900px]:min-h-0 min-[900px]:flex-1"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <PosterPreview posterRef={posterRef} Component={Component} data={data} scheme={scheme} accent={accent} lang={lang} shape={exporter.shape} size={size} />
        </div>
        {exporter.note && (
          <p
            role="status"
            className="absolute inset-x-3 bottom-3 m-0 mx-auto flex w-fit max-w-[calc(100%-1.5rem)] items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-[0.8125rem] leading-snug text-fg shadow-pop"
          >
            <Icon name="info" className="mt-px text-muted" />
            <span>{exporter.note}</span>
          </p>
        )}
      </div>
    </section>
  )
}
