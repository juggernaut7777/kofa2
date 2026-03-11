import { Package, ShoppingCart, FileText, DollarSign, BarChart3 } from 'lucide-react'

/**
 * Empty state components for when there's no data to display.
 * Shows friendly illustrations with action buttons.
 */

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3rem 2rem',
  textAlign: 'center',
  gap: '1rem',
  minHeight: '40vh',
}

const iconWrapperStyle = (color) => ({
  width: 72, height: 72, borderRadius: '50%',
  background: `${color}15`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
})

const titleStyle = {
  fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', margin: 0,
}

const descStyle = {
  color: '#6b7280', maxWidth: 360, lineHeight: 1.6, fontSize: '0.9rem', margin: 0,
}

const btnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
  padding: '0.625rem 1.5rem', borderRadius: '0.5rem',
  background: '#6366f1', color: '#fff', border: 'none',
  cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem',
  marginTop: '0.5rem',
}

export function EmptyProducts({ onAdd }) {
  return (
    <div style={containerStyle}>
      <div style={iconWrapperStyle('#6366f1')}>
        <Package size={32} color="#6366f1" />
      </div>
      <h3 style={titleStyle}>No products yet</h3>
      <p style={descStyle}>
        Add your first product to start tracking inventory and making sales.
      </p>
      {onAdd && (
        <button style={btnStyle} onClick={onAdd}>
          + Add First Product
        </button>
      )}
    </div>
  )
}

export function EmptyOrders() {
  return (
    <div style={containerStyle}>
      <div style={iconWrapperStyle('#10b981')}>
        <ShoppingCart size={32} color="#10b981" />
      </div>
      <h3 style={titleStyle}>No orders yet</h3>
      <p style={descStyle}>
        Once customers start placing orders, they'll appear here.
        Share your storefront link to get started!
      </p>
    </div>
  )
}

export function EmptyExpenses() {
  return (
    <div style={containerStyle}>
      <div style={iconWrapperStyle('#f59e0b')}>
        <DollarSign size={32} color="#f59e0b" />
      </div>
      <h3 style={titleStyle}>No expenses recorded</h3>
      <p style={descStyle}>
        Track your business expenses to get accurate profit reports. 
        Add rent, supplies, transport, and more.
      </p>
    </div>
  )
}

export function EmptyInvoices() {
  return (
    <div style={containerStyle}>
      <div style={iconWrapperStyle('#3b82f6')}>
        <FileText size={32} color="#3b82f6" />
      </div>
      <h3 style={titleStyle}>No invoices yet</h3>
      <p style={descStyle}>
        Create professional invoices for your customers. They'll be stored here for easy access.
      </p>
    </div>
  )
}

export function EmptyInsights() {
  return (
    <div style={containerStyle}>
      <div style={iconWrapperStyle('#8b5cf6')}>
        <BarChart3 size={32} color="#8b5cf6" />
      </div>
      <h3 style={titleStyle}>Not enough data yet</h3>
      <p style={descStyle}>
        Make a few sales and add some products, then come back for AI-powered business insights.
      </p>
    </div>
  )
}
