function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Ogólne pole do wgrania własnej grafiki (SVG/PNG/JPG) - używane zarówno dla
// logo, jak i dla zdjęć wymaganych przez niektóre szablony. Podaj
// `position`/`onPositionChange`, żeby dodatkowo pokazać suwaki X/Y do
// przesuwania kadru zdjęcia (ma sens tylko dla zdjęć wypełniających kadr -
// nie dla logo, które zawsze mieści się w całości).
export function ImageUpload({ label, hint, value, onChange, position, onPositionChange }) {
  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const dataUrl = await readAsDataUrl(file)
    onChange(dataUrl)
  }

  return (
    <div className="image-upload">
      <span className="image-upload-label">{label}</span>
      {hint && <p className="image-upload-hint">{hint}</p>}
      <div className="image-upload-row">
        {value && (
          <div className="image-upload-preview">
            <img src={value} alt={`Podgląd: ${label}`} />
          </div>
        )}
        <label className="image-upload-button">
          {value ? 'Zmień plik' : 'Wybierz plik'}
          <input type="file" accept=".svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg" onChange={handleFile} />
        </label>
        {value && (
          <button type="button" className="image-upload-remove" onClick={() => onChange(null)}>
            Usuń
          </button>
        )}
      </div>

      {value && position && onPositionChange && (
        <div className="image-upload-position">
          <label className="image-upload-position-row">
            <span>Pozycja w poziomie</span>
            <input
              type="range"
              min="0"
              max="100"
              value={position.x ?? 50}
              onChange={(e) => onPositionChange('x', Number(e.target.value))}
            />
          </label>
          <label className="image-upload-position-row">
            <span>Pozycja w pionie</span>
            <input
              type="range"
              min="0"
              max="100"
              value={position.y ?? 50}
              onChange={(e) => onPositionChange('y', Number(e.target.value))}
            />
          </label>
        </div>
      )}
    </div>
  )
}
