// Czyta plik jako data URL (base64). Używane przy wgrywaniu grafik/zdjęć
// w formularzu - plakat trzyma wtedy obraz jako string w stanie edytora.
export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(file)
  })
}
