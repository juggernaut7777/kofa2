import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Orders from './pages/Orders'
import Subscription from './pages/Subscription'
import Support from './pages/Support'

// #region agent log - App component mount
fetch('http://127.0.0.1:7243/ingest/10d59c38-d459-4ce0-b67c-7b3366efe76e', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'debug-session',
    runId: 'initial',
    hypothesisId: 'A',
    location: 'App.jsx:10',
    message: 'App component mounting',
    data: { timestamp: Date.now(), userAgent: navigator.userAgent },
    timestamp: Date.now()
  })
}).catch(() => {});
// #endregion

function App() {
  // #region agent log - App render start
  fetch('http://127.0.0.1:7243/ingest/10d59c38-d459-4ce0-b67c-7b3366efe76e', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'initial',
      hypothesisId: 'B',
      location: 'App.jsx:32',
      message: 'App render starting',
      data: { pathname: window.location.pathname, hash: window.location.hash },
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/products" element={<Layout><Products /></Layout>} />
        <Route path="/orders" element={<Layout><Orders /></Layout>} />
        <Route path="/subscription" element={<Layout><Subscription /></Layout>} />
        <Route path="/support" element={<Layout><Support /></Layout>} />
      </Routes>
    </Router>
  )
}

export default App
