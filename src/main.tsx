import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './assets/fonts/fonts.css'
import './App.css'
import App from './App'
import { PosterPreviewPage } from './pages/PosterPreviewPage'

const base = import.meta.env.BASE_URL
const path = window.location.pathname.startsWith(base)
  ? window.location.pathname.slice(base.length - 1)
  : window.location.pathname
const posterMatch = path.match(/^\/poster\/([^/]+)(?:\/([^/]+))?\/?$/)

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('brak #root')

createRoot(rootEl).render(
  <StrictMode>
    {posterMatch ? <PosterPreviewPage posterKey={posterMatch[1]} scheme={posterMatch[2]} /> : <App />}
  </StrictMode>,
)
