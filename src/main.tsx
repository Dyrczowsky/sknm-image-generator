import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import './assets/fonts/fonts.css'
import App from './App'
import { PosterPreviewPage } from './pages/PosterPreviewPage'
import { RenderPage } from './pages/RenderPage'
import { SHAPE_SIZE } from './posters/shape'
import type { PosterShape } from './types'

const base = import.meta.env.BASE_URL
const path = window.location.pathname.startsWith(base)
  ? window.location.pathname.slice(base.length - 1)
  : window.location.pathname
const posterMatch = path.match(/^\/poster\/([^/]+)(?:\/([^/]+))?\/?$/)
// Strona techniczna dla API (headless Chrome w Workerze); dane dostaje przez
// `window.sknmRender`, nic nie czyta z adresu.
const isRender = /^\/render\/?$/.test(path)
// `?shape=portrait|landscape` - podgląd szablonu w kształcie papieru;
// `?shape=cover|event` - banerowa wersja szablonu.
const shapeParam = new URLSearchParams(window.location.search).get('shape')
const previewShape: PosterShape = shapeParam !== null && shapeParam in SHAPE_SIZE ? (shapeParam as PosterShape) : 'square'

// Service worker (autoUpdate) wszędzie poza /render: headless Chrome z API
// nie potrzebuje cache'u, a SW mógłby podać przestarzałą stronę renderu.
if (!isRender) registerSW({ immediate: true })

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('brak #root')

createRoot(rootEl).render(
  <StrictMode>
    {isRender ? (
      <RenderPage />
    ) : posterMatch ? (
      <PosterPreviewPage posterKey={posterMatch[1]} scheme={posterMatch[2]} shape={previewShape} />
    ) : (
      <App />
    )}
  </StrictMode>,
)
