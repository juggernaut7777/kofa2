import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import PrivateRoute from './components/PrivateRoute'
import BusinessAI from './components/BusinessAI/BusinessAI'

// Redesigned pages (new Stitch UI)
import {
  LayoutRedesign,
  DashboardRedesign,
  ProductsRedesign,
  OrdersRedesign,
  InsightsRedesign,
  ExpensesRedesign,
  SettingsRedesign
} from './redesign'

// Public pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Verify from './pages/Verify'
import Shop from './pages/Shop'

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/shop/:shopName" element={<Shop />} />

            {/* Protected Routes - Redesigned UI (5 main pages) */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <LayoutRedesign><DashboardRedesign /></LayoutRedesign>
              </PrivateRoute>
            } />
            <Route path="/products" element={
              <PrivateRoute>
                <LayoutRedesign><ProductsRedesign /></LayoutRedesign>
              </PrivateRoute>
            } />
            <Route path="/orders" element={
              <PrivateRoute>
                <LayoutRedesign><OrdersRedesign /></LayoutRedesign>
              </PrivateRoute>
            } />
            <Route path="/insights" element={
              <PrivateRoute>
                <LayoutRedesign><InsightsRedesign /></LayoutRedesign>
              </PrivateRoute>
            } />
            <Route path="/expenses" element={
              <PrivateRoute>
                <LayoutRedesign><ExpensesRedesign /></LayoutRedesign>
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute>
                <LayoutRedesign><SettingsRedesign /></LayoutRedesign>
              </PrivateRoute>
            } />
          </Routes>

          {/* Business AI Assistant - Available on all pages */}
          <BusinessAI />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App

