import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import PrivateRoute from './components/PrivateRoute'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import BusinessAI from './components/BusinessAI/BusinessAI'

// Redesigned pages (new Stitch UI)
import {
  LayoutRedesign,
  DashboardRedesign,
  ProductsRedesign,
  OrdersRedesign,
  InsightsRedesign,
  ExpensesRedesign,
  SettingsRedesign,
  CustomersPage
} from './redesign'

// Public pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Verify from './pages/Verify'
import Shop from './pages/Shop'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import DataDeletion from './pages/DataDeletion'
import CookieNotice from './components/CookieNotice'

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/data-deletion" element={<DataDeletion />} />
            <Route path="/shop/:shopName" element={<Shop />} />

            {/* Protected Routes - Redesigned UI (5 main pages) */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <LayoutRedesign><ErrorBoundary><DashboardRedesign /></ErrorBoundary></LayoutRedesign>
              </PrivateRoute>
            } />
            <Route path="/products" element={
              <PrivateRoute>
                <LayoutRedesign><ErrorBoundary><ProductsRedesign /></ErrorBoundary></LayoutRedesign>
              </PrivateRoute>
            } />
            <Route path="/orders" element={
              <PrivateRoute>
                <LayoutRedesign><ErrorBoundary><OrdersRedesign /></ErrorBoundary></LayoutRedesign>
              </PrivateRoute>
            } />
            <Route path="/insights" element={
              <PrivateRoute>
                <LayoutRedesign><ErrorBoundary><InsightsRedesign /></ErrorBoundary></LayoutRedesign>
              </PrivateRoute>
            } />
            <Route path="/expenses" element={
              <PrivateRoute>
                <LayoutRedesign><ErrorBoundary><ExpensesRedesign /></ErrorBoundary></LayoutRedesign>
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute>
                <LayoutRedesign><ErrorBoundary><SettingsRedesign /></ErrorBoundary></LayoutRedesign>
              </PrivateRoute>
            } />
            <Route path="/customers" element={
              <PrivateRoute>
                <LayoutRedesign><ErrorBoundary><CustomersPage /></ErrorBoundary></LayoutRedesign>
              </PrivateRoute>
            } />
          </Routes>

          {/* Business AI Assistant - Available on all pages */}
          <BusinessAI />

          {/* Cookie Notice Banner */}
          <CookieNotice />
        </Router>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App

