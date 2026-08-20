import { toPng } from 'html-to-image'

// Rasteryzuje węzeł DOM plakatu (1080x1080) do PNG i pobiera go na dysk.
export async function downloadPosterAsPng(node, filename) {
  const dataUrl = await toPng(node, { width: 1080, height: 1080, pixelRatio: 1 })
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}
