function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Wgrywanie własnego logo (SVG/PNG/JPG), które podmienia domyślne logo PK
// w miejscach na logo w plakacie. Bez pliku zostaje logo PK z assets.
export function LogoUpload({ value, onChange }) {
  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const dataUrl = await readAsDataUrl(file)
    onChange(dataUrl)
  }

  return (
    <div className="logo-upload">
      <span className="logo-upload-label">Własne logo (opcjonalnie)</span>
      <p className="logo-upload-hint">
        Najlepiej plik SVG (skaluje się bez utraty jakości), PNG lub JPG też
        zadziałają. Bez wgranego pliku w plakacie pojawi się domyślne logo PK.
      </p>
      <div className="logo-upload-row">
        {value && (
          <div className="logo-upload-preview">
            <img src={value} alt="Podgląd wgranego logo" />
          </div>
        )}
        <label className="logo-upload-button">
          {value ? 'Zmień plik' : 'Wybierz plik'}
          <input type="file" accept=".svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg" onChange={handleFile} />
        </label>
        {value && (
          <button type="button" className="logo-upload-remove" onClick={() => onChange(null)}>
            Usuń
          </button>
        )}
      </div>
    </div>
  )
}
