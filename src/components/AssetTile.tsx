import { useState } from 'react'
import type { FormEvent } from 'react'
import { ASSET_NAME_MAX_LENGTH } from '../assets/remoteLibrary'
import type { LibraryAsset } from '../assets/remoteLibrary'
import { formatTimestamp } from '../utils/formatDate'
import { AssetThumb } from './AssetThumb'
import { Badge, ConfirmButton, IconButton, Input } from './ui'

interface AssetTileProps {
  asset: LibraryAsset
  // Data URL miniatury albo `undefined` do czasu wczytania.
  thumb: string | undefined
  // Własne wgranie zalogowanej osoby: tylko ono da się przemianować i usunąć.
  own: boolean
  onRename: (ref: string, name: string) => void
  onRemove: (ref: string) => void
}

const KIND_LABEL = { logo: 'Logotyp', photo: 'Zdjęcie' } as const

// Kafelek biblioteki: miniatura, nazwa, rodzaj, autor i data. Własne wgrania
// mają zmianę nazwy w miejscu i usunięcie z pytaniem.
export function AssetTile({ asset, thumb, own, onRename, onRemove }: AssetTileProps) {
  const [draft, setDraft] = useState<string | null>(null)

  const save = (e: FormEvent) => {
    e.preventDefault()
    const name = draft?.trim()
    if (!name) return
    if (name !== asset.name) onRename(asset.ref, name)
    setDraft(null)
  }

  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface p-3">
      <AssetThumb src={thumb} fit={asset.kind === 'photo' ? 'cover' : 'contain'} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {draft === null ? (
          <div className="flex min-w-0 items-center gap-2">
            <strong className="min-w-0 truncate text-[0.9375rem]" title={asset.name}>{asset.name || 'Bez nazwy'}</strong>
            <Badge>{KIND_LABEL[asset.kind]}</Badge>
          </div>
        ) : (
          <form className="flex min-w-0 items-center gap-1.5" onSubmit={save}>
            <Input
              size="sm"
              className="flex-1"
              value={draft}
              maxLength={ASSET_NAME_MAX_LENGTH}
              autoFocus
              aria-label="Nazwa grafiki"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setDraft(null)
              }}
            />
            <IconButton type="submit" icon="check" label="Zapisz nazwę" disabled={!draft.trim()} />
            <IconButton icon="close" label="Anuluj zmianę nazwy" onClick={() => setDraft(null)} />
          </form>
        )}
        <span className="truncate text-[0.8125rem] text-muted" title={asset.author_email}>{asset.author_email}</span>
        <span className="truncate text-[0.8125rem] text-muted">{formatTimestamp(asset.created_at)}</span>
      </div>
      {own && (
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
          {draft === null && <IconButton icon="pencil" label="Zmień nazwę" onClick={() => setDraft(asset.name)} />}
          <ConfirmButton
            icon="trash"
            question="Usunąć z biblioteki? Plakaty, które już używają tej grafiki, zachowają ją."
            onConfirm={() => onRemove(asset.ref)}
          >
            Usuń z biblioteki
          </ConfirmButton>
        </div>
      )}
    </li>
  )
}
