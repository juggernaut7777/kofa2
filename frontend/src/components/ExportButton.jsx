import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { API_BASE_URL } from '../config/api'

/**
 * ExportButton — triggers a CSV download from the backend export endpoints.
 *
 * Usage:
 *   <ExportButton type="products" label="Export Products" />
 *   <ExportButton type="orders" label="Export Orders" />
 *   <ExportButton type="expenses" label="Export Expenses" />
 */
export default function ExportButton({ type, label, isDark }) {
  const [downloading, setDownloading] = useState(false)

  const handleExport = async () => {
    setDownloading(true)
    try {
      const token = localStorage.getItem('token')
      const resp = await fetch(`${API_BASE_URL}/export/${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!resp.ok) throw new Error('Export failed')

      const blob = await resp.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = resp.headers.get('Content-Disposition')?.split('filename=')[1] || `kofa_${type}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      alert('Export failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={downloading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.5rem 0.85rem', borderRadius: '0.5rem',
        background: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
        color: '#6366f1', border: '1px solid rgba(99,102,241,0.25)',
        cursor: downloading ? 'wait' : 'pointer',
        fontSize: '0.8rem', fontWeight: 500,
        opacity: downloading ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
    >
      {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      {label || 'Export CSV'}
    </button>
  )
}
