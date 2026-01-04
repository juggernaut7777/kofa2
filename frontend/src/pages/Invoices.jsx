import { useState, useEffect, useContext } from 'react'
import { apiCall, API_ENDPOINTS } from '../config/api'
import { ThemeContext } from '../context/ThemeContext'

const Invoices = () => {
    const { theme } = useContext(ThemeContext)
    const [invoices, setInvoices] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [orders, setOrders] = useState([])

    useEffect(() => {
        loadInvoices()
        loadOrders()
    }, [])

    const loadInvoices = async () => {
        try {
            setLoading(true)
            const data = await apiCall('/invoice/list')
            setInvoices(data.invoices || [])
        } catch (error) {
            console.error('Failed to load invoices:', error)
            // Demo data
            setInvoices([
                {
                    invoice_id: 'INV-20240104-ABC123',
                    customer_name: 'John Doe',
                    customer_phone: '+234801234567',
                    total: 45000,
                    vat: 3375,
                    grand_total: 48375,
                    paid: true,
                    created_at: '2024-01-04T10:30:00'
                },
                {
                    invoice_id: 'INV-20240103-DEF456',
                    customer_name: 'Jane Smith',
                    customer_phone: '+234809876543',
                    total: 25000,
                    vat: 1875,
                    grand_total: 26875,
                    paid: false,
                    created_at: '2024-01-03T14:20:00'
                }
            ])
        } finally {
            setLoading(false)
        }
    }

    const loadOrders = async () => {
        try {
            const data = await apiCall(API_ENDPOINTS.ORDERS)
            setOrders(data || [])
        } catch (error) {
            console.error('Failed to load orders:', error)
        }
    }

    const generateInvoice = async (order) => {
        try {
            const response = await apiCall('/invoice/create', {
                method: 'POST',
                body: JSON.stringify({
                    order_id: order.id,
                    customer_name: order.customer_phone,
                    customer_phone: order.customer_phone,
                    items: order.items || [],
                    delivery_fee: 0
                })
            })
            alert('Invoice generated successfully!')
            loadInvoices()
            setShowCreateModal(false)
        } catch (error) {
            console.error('Failed to generate invoice:', error)
            alert('Failed to generate invoice')
        }
    }

    const downloadReceipt = async (invoiceId, format = 'text') => {
        try {
            const response = await apiCall(`/invoice/${invoiceId}/download?format=${format}`)
            if (format === 'text') {
                // Copy to clipboard
                navigator.clipboard.writeText(response.invoice || response.receipt)
                alert('Receipt copied to clipboard!')
            } else {
                // Open HTML in new window for printing
                const win = window.open('', '_blank')
                win.document.write(response.html)
            }
        } catch (error) {
            console.error('Failed to download receipt:', error)
            alert('Failed to download receipt')
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-bg' : 'bg-slate-50'}`}>
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Invoices & Receipts
                        </h1>
                        <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Generate and manage invoices with VAT for your orders
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-kofa-yellow to-yellow-500 text-black font-semibold rounded-xl hover:shadow-lg transition-all"
                    >
                        + Generate Invoice
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total Invoices</p>
                        <p className={`text-3xl font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {invoices.length}
                        </p>
                    </div>
                    <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Paid</p>
                        <p className="text-3xl font-bold mt-2 text-green-500">
                            {invoices.filter(i => i.paid).length}
                        </p>
                    </div>
                    <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Unpaid</p>
                        <p className="text-3xl font-bold mt-2 text-amber-500">
                            {invoices.filter(i => !i.paid).length}
                        </p>
                    </div>
                    <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total Revenue</p>
                        <p className={`text-2xl font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(invoices.reduce((sum, i) => sum + (i.grand_total || 0), 0))}
                        </p>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className={`rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}>
                                <tr>
                                    <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Invoice ID
                                    </th>
                                    <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Customer
                                    </th>
                                    <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Amount
                                    </th>
                                    <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        VAT (7.5%)
                                    </th>
                                    <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Total
                                    </th>
                                    <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Status
                                    </th>
                                    <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Date
                                    </th>
                                    <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-800' : 'divide-gray-100'}`}>
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center">
                                            <div className="animate-spin w-8 h-8 border-4 border-kofa-yellow border-t-transparent rounded-full mx-auto"></div>
                                            <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading invoices...</p>
                                        </td>
                                    </tr>
                                ) : invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center">
                                            <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                No invoices yet. Generate one from an order!
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((invoice) => (
                                        <tr key={invoice.invoice_id} className={`${theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                                            <td className={`px-6 py-4 font-mono text-sm ${theme === 'dark' ? 'text-kofa-yellow' : 'text-kofa-cobalt'}`}>
                                                {invoice.invoice_id}
                                            </td>
                                            <td className={`px-6 py-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                <div>{invoice.customer_name}</div>
                                                <div className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {invoice.customer_phone}
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {formatCurrency(invoice.total)}
                                            </td>
                                            <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {formatCurrency(invoice.vat)}
                                            </td>
                                            <td className={`px-6 py-4 font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {formatCurrency(invoice.grand_total)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${invoice.paid
                                                        ? 'bg-green-500/20 text-green-500'
                                                        : 'bg-amber-500/20 text-amber-500'
                                                    }`}>
                                                    {invoice.paid ? 'Paid' : 'Unpaid'}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {formatDate(invoice.created_at)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => downloadReceipt(invoice.invoice_id, 'text')}
                                                        className="px-3 py-1.5 text-sm bg-kofa-cobalt/20 text-kofa-sky rounded-lg hover:bg-kofa-cobalt/30 transition-colors"
                                                    >
                                                        📋 Copy
                                                    </button>
                                                    <button
                                                        onClick={() => downloadReceipt(invoice.invoice_id, 'html')}
                                                        className="px-3 py-1.5 text-sm bg-kofa-yellow/20 text-kofa-yellow rounded-lg hover:bg-kofa-yellow/30 transition-colors"
                                                    >
                                                        🖨️ Print
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create Invoice Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className={`w-full max-w-lg rounded-2xl p-6 ${theme === 'dark' ? 'bg-dark-card' : 'bg-white'}`}>
                            <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Generate Invoice from Order
                            </h2>

                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {orders.length === 0 ? (
                                    <p className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                        No orders available
                                    </p>
                                ) : (
                                    orders.map((order) => (
                                        <div
                                            key={order.id}
                                            onClick={() => setSelectedOrder(order)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedOrder?.id === order.id
                                                    ? 'border-kofa-yellow bg-kofa-yellow/10'
                                                    : theme === 'dark'
                                                        ? 'border-gray-700 hover:border-gray-600'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                        Order #{order.id}
                                                    </p>
                                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {order.customer_phone}
                                                    </p>
                                                </div>
                                                <p className={`font-bold ${theme === 'dark' ? 'text-kofa-yellow' : 'text-kofa-cobalt'}`}>
                                                    {formatCurrency(order.total_amount)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className={`flex-1 py-3 rounded-xl font-medium ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => selectedOrder && generateInvoice(selectedOrder)}
                                    disabled={!selectedOrder}
                                    className="flex-1 py-3 bg-gradient-to-r from-kofa-yellow to-yellow-500 text-black font-semibold rounded-xl disabled:opacity-50"
                                >
                                    Generate Invoice
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Invoices
