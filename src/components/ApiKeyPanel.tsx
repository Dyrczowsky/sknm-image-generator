import { useEffect, useState } from 'react'
import { requireSupabase } from '../supabase/client'
import { getApiKey, mcpCommand, regenerateApiKey, revokeApiKey } from '../supabase/apiKey'
import type { ApiKeyInfo } from '../supabase/apiKey'
import { Button, ConfirmButton, Input } from './ui'

const date = (iso: string) => new Date(iso).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })

// Osobisty klucz API (Worker sknm-api) w panelu konta: wygeneruj, wygeneruj
// nowy, usuń. Pełny klucz jest widoczny tylko zaraz po wygenerowaniu.
export function ApiKeyPanel({ userId }: { userId: string }) {
  const [info, setInfo] = useState<ApiKeyInfo | null | undefined>(undefined)
  const [fresh, setFresh] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getApiKey(requireSupabase()).then(setInfo, (e: Error) => setError(e.message))
  }, [])

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się.')
    }
    setBusy(false)
  }
  const generate = () => run(async () => {
    const key = await regenerateApiKey(requireSupabase())
    setFresh(key)
    setInfo(await getApiKey(requireSupabase()))
  })
  const revoke = () => run(async () => {
    await revokeApiKey(requireSupabase(), userId)
    setFresh(null)
    setInfo(null)
  })

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-2">
      <p className="m-0 px-1 text-[0.8125rem] font-semibold">Klucz API (AI / MCP)</p>
      {fresh ? (
        <>
          <p className="m-0 px-1 text-[0.75rem] text-muted">Skopiuj teraz - później zobaczysz tylko początek klucza.</p>
          <Input readOnly size="sm" value={fresh} aria-label="Nowy klucz API" onFocus={(e) => e.currentTarget.select()} />
          <Button size="sm" icon="copy" onClick={() => void navigator.clipboard.writeText(fresh)}>Kopiuj klucz</Button>
          <Button size="sm" variant="outline" icon="copy" onClick={() => void navigator.clipboard.writeText(mcpCommand(fresh))}>
            Kopiuj polecenie Claude Code
          </Button>
        </>
      ) : info ? (
        <p className="m-0 px-1 text-[0.75rem] text-muted">
          <code>{info.prefix}…</code>, utworzony {date(info.created_at)}
          {info.last_used_at ? `, użyty ${date(info.last_used_at)}` : ', jeszcze nieużyty'}
        </p>
      ) : info === null ? (
        <p className="m-0 px-1 text-[0.75rem] text-muted">Nie masz klucza.</p>
      ) : null}
      {info !== undefined && (
        info ? (
          <div className="flex gap-2">
            <ConfirmButton variant="outline" icon="retry" question="Stary klucz przestanie działać. Wygenerować nowy?" confirmLabel="Tak, nowy" onConfirm={() => void generate()} busy={busy}>
              Nowy klucz
            </ConfirmButton>
            <ConfirmButton icon="trash" question="Usunąć klucz? AI straci dostęp." onConfirm={() => void revoke()} busy={busy}>
              Usuń
            </ConfirmButton>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => void generate()} busy={busy}>Wygeneruj klucz</Button>
        )
      )}
      {error && <p className="m-0 px-1 text-[0.75rem] text-danger" role="alert">{error}</p>}
    </div>
  )
}
