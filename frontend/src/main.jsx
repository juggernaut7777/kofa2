import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// #region agent log - main.jsx execution start
fetch('http://127.0.0.1:7243/ingest/10d59c38-d459-4ce0-b67c-7b3366efe76e', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'debug-session',
    runId: 'initial',
    hypothesisId: 'D',
    location: 'main.jsx:1',
    message: 'main.jsx executing',
    data: { timestamp: Date.now(), rootElement: !!document.getElementById('root') },
    timestamp: Date.now()
  })
}).catch(() => {});
// #endregion

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
