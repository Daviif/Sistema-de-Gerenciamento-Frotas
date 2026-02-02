import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (typeof document !== 'undefined') {
  const cs = getComputedStyle(document.documentElement)
  // log core theme vars to help debugging local theme issues
  // eslint-disable-next-line no-console
  console.log('[theme-vars]', {
    primary: cs.getPropertyValue('--primary')?.trim(),
    primary_fg: cs.getPropertyValue('--primary-foreground')?.trim(),
    background: cs.getPropertyValue('--background')?.trim(),
    foreground: cs.getPropertyValue('--foreground')?.trim(),
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
