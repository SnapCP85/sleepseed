import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SleepSeed from './SleepSeed'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SleepSeed />
  </StrictMode>
)
