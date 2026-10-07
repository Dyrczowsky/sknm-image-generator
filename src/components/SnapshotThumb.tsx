import { fromSnapshot } from '../snapshot/snapshot'
import type { EditorSnapshot } from '../snapshot/snapshot'
import { shapeFor } from '../posters/formats'
import { posterRegistry } from '../posters/registry'
import { SHAPE_SIZE } from '../posters/shape'
import { decodeScheme } from '../utils/colorScheme'
import { PosterScaled } from './PosterScaled'

interface SnapshotThumbProps {
  snapshot: EditorSnapshot
  // Bok pola w px, w które miniatura jest wpisana (dłuższym bokiem).
  box: number
}

// Miniatura plakatu ze snapshotu w polu `box`×`box`. Obrazów nie wczytuje -
// plakaty pokazują wtedy własne zaślepki. Nie zna historii ani projektów.
export function SnapshotThumb({ snapshot, box }: SnapshotThumbProps) {
  const poster = posterRegistry[snapshot.poster_key]
  const frame = { width: box, height: box }
  if (!poster) return <div className="bg-border" style={frame} />

  const { form, colorScheme, lang } = fromSnapshot(snapshot, () => undefined)
  const { medium, format, orientation } = snapshot.export
  const shape = shapeFor(format, orientation)
  const { width, height } = SHAPE_SIZE[shape]
  const Poster = medium === 'banner' ? poster.Banner : poster.Component
  const { scheme, accent } = decodeScheme(colorScheme)

  return (
    <div className="flex items-center justify-center" style={frame}>
      <PosterScaled size={(box * width) / Math.max(width, height)} shape={shape}>
        <Poster data={form} scheme={scheme} accent={accent} lang={lang} />
      </PosterScaled>
    </div>
  )
}
