interface ColorFieldProps {
  label: string
  // Pusty string = brak nadpisania (wartość ze schematu).
  value: string
  onChange: (value: string) => void
  // Kolor pokazywany w próbniku, gdy `value` jest pusty.
  fallback?: string
  // Tekst obok, gdy kolor nie jest nadpisany.
  autoLabel?: string
}

// Próbnik koloru z opcją „auto" (pusty string). Używany do nadpisań kolorów
// per szablon i koloru kodu QR - kolor domyślnie idzie ze schematu, a użytkownik
// może go nadpisać i wyczyścić z powrotem.
export function ColorField({ label, value, onChange, fallback = '#121212', autoLabel = 'Dopasowany do schematu' }: ColorFieldProps) {
  return (
    <div className="flex items-center gap-2.5">
      <input
        type="color"
        value={value || fallback}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 flex-none cursor-pointer rounded border border-field-border bg-field p-0.5"
        aria-label={label}
      />
      <span className="text-[0.85rem]">{label}</span>
      {value ? (
        <button
          type="button"
          className="ml-auto cursor-pointer rounded-lg border border-field-border bg-transparent px-3 py-[5px] text-[0.8rem] text-muted transition-[border-color,color] hover:border-accent hover:text-accent"
          onClick={() => onChange('')}
        >
          Wyczyść
        </button>
      ) : (
        <span className="ml-auto text-[0.8rem] text-muted">{autoLabel}</span>
      )}
    </div>
  )
}
