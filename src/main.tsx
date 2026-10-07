import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './assets/fonts/fonts.css'
import App from './App'
import { PosterPreviewPage } from './pages/PosterPreviewPage'
import { SHAPE_SIZE } from './posters/shape'
import type { PosterShape } from './types'

const base = import.meta.env.BASE_URL
const path = window.location.pathname.startsWith(base)
  ? window.location.pathname.slice(base.length - 1)
  : window.location.pathname
const posterMatch = path.match(/^\/poster\/([^/]+)(?:\/([^/]+))?\/?$/)
// `?shape=portrait|landscape` - podgląd szablonu w kształcie papieru;
// `?shape=cover|event` - banerowa wersja szablonu.
const shapeParam = new URLSearchParams(window.location.search).get('shape')
const previewShape: PosterShape = shapeParam !== null && shapeParam in SHAPE_SIZE ? (shapeParam as PosterShape) : 'square'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('brak #root')

createRoot(rootEl).render(
  <StrictMode>
    {posterMatch ? <PosterPreviewPage posterKey={posterMatch[1]} scheme={posterMatch[2]} shape={previewShape} /> : <App />}
  </StrictMode>,
)
