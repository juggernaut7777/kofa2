import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Orders from './pages/Orders'
import Expenses from './pages/Expenses'
import Subscription from './pages/Subscription'
import Settings from './pages/Settings'
import Support from './pages/Support'
import Invoices from './pages/Invoices'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Layout><Dashboard /></Layout>
            </PrivateRoute>
          } />
          <Route path="/products" element={
            <PrivateRoute>
              <Layout><Products /></Layout>
            </PrivateRoute>
          } />
          <Route path="/orders" element={
            <PrivateRoute>
              <Layout><Orders /></Layout>
            </PrivateRoute>
          } />
          <Route path="/invoices" element={
            <PrivateRoute>
              <Layout><Invoices /></Layout>
            </PrivateRoute>
          } />
          <Route path="/analytics" element={
            <PrivateRoute>
              <Layout><Analytics /></Layout>
            </PrivateRoute>
          } />
          <Route path="/reports" element={
            <PrivateRoute>
              <Layout><Reports /></Layout>
            </PrivateRoute>
          } />
          <Route path="/expenses" element={
            <PrivateRoute>
              <Layout><Expenses /></Layout>
            </PrivateRoute>
          } />
          <Route path="/subscription" element={
            <PrivateRoute>
              <Layout><Subscription /></Layout>
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <Layout><Settings /></Layout>
            </PrivateRoute>
          } />
          <Route path="/support" element={
            <PrivateRoute>
              <Layout><Support /></Layout>
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
