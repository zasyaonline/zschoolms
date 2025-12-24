import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div>
      <h1>Test Page - React is Working!</h1>
      <p>If you see this, React is loading correctly.</p>
    </div>
  </StrictMode>,
)
