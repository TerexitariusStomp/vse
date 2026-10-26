import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/fraunces/standard-italic.css'
import '@fontsource-variable/inter'
import './index.css'
import App from './App.tsx'
import { PLACES } from './lib'

const legacy = new URLSearchParams(window.location.search).get('place')
if (legacy && PLACES.some((p) => p.id === legacy)) {
  history.replaceState(null, '', `/${legacy}${window.location.hash}`)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
