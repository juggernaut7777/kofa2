import { useState, useEffect, useContext } from 'react'
import { apiCall } from '../config/api'
import { ThemeContext } from '../context/ThemeContext'

const DeliveryTracking = () => {
    const { theme } = useContext(ThemeContext)
    const [shipments, setShipments] = useState([])
    const [loading, setLoading] = useState(true)
    const [zones, setZones] = useState([])
    const isDark = theme === 'dark'

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const zonesData = await apiCall('/delivery/zones')
            setZones(zonesData.zones || [])
        } catch (error) {
            console.log('Using demo delivery data')
            setZones([
                { name: 'Lagos Island', base_fee: 1500, delivery_time: '2-4 hours' },
                { name: 'Lagos Mainland', base_fee: 2000, delivery_time: '3-5 hours' },
                { name: 'Abuja', base_fee: 3500, delivery_time: '1-2 days' },
                { name: 'Port Harcourt', base_fee: 4000, delivery_time: '1-2 days' },
                { name: 'Other States', base_fee: 5000, delivery_time: '2-4 days' },
            ])
            setShipments([
                { id: 'SHP001', order_id: 'ord-001', status: 'in_transit', destination: 'Lagos Island', eta: '2 hours' },
                { id: 'SHP002', order_id: 'ord-002', status: 'delivered', destination: 'Abuja', delivered_at: '2024-01-14' },
            ])
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-amber-500/20 text-amber-500',
            picked_up: 'bg-blue-500/20 text-blue-500',
            in_transit: 'bg-kofa-cobalt/20 text-kofa-sky',
            delivered: 'bg-green-500/20 text-green-500',
            failed: 'bg-red-500/20 text-red-500'
        }
        return styles[status] || 'bg-gray-500/20 text-gray-400'
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount)
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin w-10 h-10 border-4 border-kofa-yellow border-t-transparent rounded-full"></div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Delivery & Tracking
                </h2>
                <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Track shipments and manage delivery zones
                </p>
            </div>

            {/* Active Shipments */}
            <div className={`p-6 rounded-2xl mb-6 ${isDark ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    📦 Active Shipments
                </h3>

                {shipments.length === 0 ? (
                    <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        No active shipments
                    </p>
                ) : (
                    <div className="space-y-3">
                        {shipments.map((shipment) => (
                            <div
                                key={shipment.id}
                                className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-mono text-sm ${isDark ? 'text-kofa-yellow' : 'text-kofa-cobalt'}`}>
                                                {shipment.id}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusBadge(shipment.status)}`}>
                                                {shipment.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Order: {shipment.order_id} → {shipment.destination}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        {shipment.status === 'delivered' ? (
                                            <span className="text-green-500 text-sm">✓ Delivered</span>
                                        ) : (
                                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                ETA: {shipment.eta}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delivery Zones */}
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    🚚 Delivery Zones & Fees
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className={isDark ? 'bg-gray-800/50' : 'bg-gray-100'}>
                            <tr>
                                <th className={`px-4 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Zone
                                </th>
                                <th className={`px-4 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Delivery Fee
                                </th>
                                <th className={`px-4 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Estimated Time
                                </th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-200'}`}>
                            {zones.map((zone, idx) => (
                                <tr key={idx}>
                                    <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {zone.name}
                                    </td>
                                    <td className={`px-4 py-3 font-medium ${isDark ? 'text-kofa-yellow' : 'text-kofa-cobalt'}`}>
                                        {formatCurrency(zone.base_fee)}
                                    </td>
                                    <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {zone.delivery_time}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Help text */}
            <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-kofa-cobalt/20' : 'bg-blue-50'}`}>
                <p className={`text-sm ${isDark ? 'text-kofa-sky' : 'text-kofa-cobalt'}`}>
                    💡 <strong>Tip:</strong> Add delivery fees to your product prices or charge separately at checkout.
                </p>
            </div>
        </div>
    )
}

export default DeliveryTracking
