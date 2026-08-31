interface SiteFooterProps {
  onRequestClick: () => void
}

// Stopka aplikacji — adres strony + wejście do zgłoszenia zapotrzebowania
// na plakat (otwiera modal, ten składa `mailto:`).
export function SiteFooter({ onRequestClick }: SiteFooterProps) {
  return (
    <footer className="mt-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-6 pb-4 text-sm text-muted">
      <span>sknm.pk.edu.pl</span>
      <button
        type="button"
        onClick={onRequestClick}
        className="cursor-pointer underline hover:text-fg"
      >
        Potrzebujesz plakatu? Zgłoś zapotrzebowanie
      </button>
    </footer>
  )
}
