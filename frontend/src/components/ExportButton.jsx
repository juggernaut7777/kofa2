import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { API_BASE_URL } from '../config/api'
import { useToast } from './Toast'

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
  const { showToast } = useToast()

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
      showToast('CSV downloaded!', 'success')
    } catch (err) {
      console.error('Export error:', err)
      showToast('Export failed. Please try again.', 'error')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={downloading}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
        isDark
          ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/25'
          : 'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100'
      } ${downloading ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
    >
      {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      {label || 'Export CSV'}
    </button>
  )
}
