import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './assets/fonts/fonts.css'
import './App.css'
import App from './App.jsx'
import { PosterPreviewPage } from './pages/PosterPreviewPage.jsx'

const posterMatch = window.location.pathname.match(/^\/poster\/([^/]+)\/?$/)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {posterMatch ? <PosterPreviewPage posterKey={posterMatch[1]} /> : <App />}
  </StrictMode>,
)
