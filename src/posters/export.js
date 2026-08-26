import { toPng } from 'html-to-image'

// Formaty eksportu. Plakat sam w sobie jest zawsze renderowany jako 1080x1080
// (patrz PosterFrame) - formaty inne niż `square` dokładają tło wokół niego,
// zamiast przebudowywać layout każdego szablonu.
export const EXPORT_FORMATS = {
  square: { label: 'Kwadrat · 1080×1080', width: 1080, height: 1080 },
  story: { label: 'Story · 1080×1920', width: 1080, height: 1920 },
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Centruje plakat na płótnie o zadanych wymiarach. Tło poza plakatem dostaje
// kolor odczytany z jego własnego rogu, żeby dostawka nie wyglądała jak
// przypadkowa biała ramka wokół kolorowych szablonów.
async function compositeOnCanvas(posterDataUrl, width, height) {
  const img = await loadImage(posterDataUrl)
  if (width === img.width && height === img.height) return posterDataUrl

  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = img.width
  srcCanvas.height = img.height
  srcCanvas.getContext('2d').drawImage(img, 0, 0)
  const [r, g, b, a] = srcCanvas.getContext('2d').getImageData(4, 4, 1, 1).data

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, (width - img.width) / 2, (height - img.height) / 2)

  return canvas.toDataURL('image/png')
}

// Rasteryzuje węzeł DOM plakatu (1080x1080) do PNG w wybranym formacie
// i pobiera go na dysk.
export async function downloadPosterAsPng(node, filename, formatKey = 'square') {
  const format = EXPORT_FORMATS[formatKey] ?? EXPORT_FORMATS.square
  const posterDataUrl = await toPng(node, { width: 1080, height: 1080, pixelRatio: 1 })
  const dataUrl = await compositeOnCanvas(posterDataUrl, format.width, format.height)

  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}
