interface FloatingReportButtonProps {
  onClick: () => void
}

// Pływający przycisk „Zgłoś błąd" — prawy dolny róg, zawsze widoczny.
// Na wąskich ekranach sama ikona (tekst chowany od 480px).
export function FloatingReportButton({ onClick }: FloatingReportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Zgłoś błąd"
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-[0.9rem] font-medium text-white shadow-lg transition-[background-color,transform] hover:bg-accent-hover active:scale-95"
    >
      <span aria-hidden>🐞</span>
      <span className="hidden min-[480px]:inline">Zgłoś błąd</span>
    </button>
  )
}
