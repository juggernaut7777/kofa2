import { useState, useEffect, useRef } from 'react'
import { X, Camera, Check, AlertCircle, RefreshCw } from 'lucide-react'

/**
 * BarcodeScanner Component
 * Scans barcodes using device camera and shows confirmation before adding to inventory.
 * Uses html5-qrcode library loaded via dynamic import.
 */
const BarcodeScanner = ({ isOpen, onClose, onProductScanned, isDark = true }) => {
    const [scanning, setScanning] = useState(false)
    const [scannedData, setScannedData] = useState(null)
    const [error, setError] = useState(null)
    const [html5QrCode, setHtml5QrCode] = useState(null)
    const scannerRef = useRef(null)
    const scannerContainerRef = useRef(null)

    // Product form state for confirmation
    const [productForm, setProductForm] = useState({
        name: '',
        barcode: '',
        price: '',
        stock: '',
        category: 'General'
    })

    // Load html5-qrcode library dynamically
    useEffect(() => {
        if (!isOpen) return

        const loadScanner = async () => {
            try {
                // Dynamic import of html5-qrcode
                const { Html5Qrcode } = await import('https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js')
                setHtml5QrCode(Html5Qrcode)
            } catch (e) {
                // Fallback: try loading from window if CDN loaded via script tag
                if (window.Html5Qrcode) {
                    setHtml5QrCode(window.Html5Qrcode)
                } else {
                    setError('Failed to load scanner library. Please refresh and try again.')
                }
            }
        }

        // Load library via script tag as more reliable fallback
        if (!window.Html5Qrcode) {
            const script = document.createElement('script')
            script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
            script.onload = () => {
                setHtml5QrCode(window.Html5Qrcode)
            }
            script.onerror = () => {
                setError('Failed to load barcode scanner. Check your internet connection.')
            }
            document.head.appendChild(script)
        } else {
            setHtml5QrCode(window.Html5Qrcode)
        }

        return () => {
            stopScanner()
        }
    }, [isOpen])

    const startScanner = async () => {
        if (!html5QrCode || !scannerContainerRef.current) return

        setError(null)
        setScanning(true)

        try {
            const scanner = new html5QrCode('barcode-scanner-container')
            scannerRef.current = scanner

            await scanner.start(
                { facingMode: 'environment' }, // Back camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 150 },
                    aspectRatio: 1.5
                },
                (decodedText, decodedResult) => {
                    // Barcode scanned successfully
                    handleScanSuccess(decodedText, decodedResult)
                },
                (errorMessage) => {
                    // Scan error (normal during scanning, ignore)
                }
            )
        } catch (err) {
            setError(`Camera error: ${err.message || 'Unable to access camera'}`)
            setScanning(false)
        }
    }

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop()
                scannerRef.current.clear()
            } catch (e) {
                // Ignore cleanup errors
            }
            scannerRef.current = null
        }
        setScanning(false)
    }

    const handleScanSuccess = async (barcodeText, result) => {
        // Stop scanner immediately
        await stopScanner()

        // Set scanned data
        setScannedData({
            barcode: barcodeText,
            format: result?.result?.format?.formatName || 'Unknown'
        })

        // Pre-fill form with barcode
        setProductForm(prev => ({
            ...prev,
            barcode: barcodeText,
            name: '', // User needs to fill this
            price: '',
            stock: '1',
            category: 'General'
        }))
    }

    const handleConfirmProduct = () => {
        if (!productForm.name || !productForm.price) {
            setError('Please fill in product name and price')
            return
        }

        onProductScanned({
            name: productForm.name,
            barcode: productForm.barcode,
            price_ngn: parseFloat(productForm.price),
            stock_level: parseInt(productForm.stock) || 1,
            category: productForm.category
        })

        // Reset and close
        setScannedData(null)
        setProductForm({ name: '', barcode: '', price: '', stock: '', category: 'General' })
        onClose()
    }

    const handleRetry = () => {
        setScannedData(null)
        setError(null)
        startScanner()
    }

    const handleClose = () => {
        stopScanner()
        setScannedData(null)
        setError(null)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className={`w-full max-w-md rounded-2xl overflow-hidden ${isDark ? 'bg-[#1A1A1F]' : 'bg-white'}`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {scannedData ? 'Confirm Product' : 'Scan Barcode'}
                    </h2>
                    <button onClick={handleClose} className={`p-2 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                        <X size={20} className={isDark ? 'text-white' : 'text-gray-600'} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                            <AlertCircle size={18} className="text-red-500" />
                            <span className="text-sm text-red-500">{error}</span>
                        </div>
                    )}

                    {!scannedData ? (
                        // Scanner View
                        <>
                            <div
                                id="barcode-scanner-container"
                                ref={scannerContainerRef}
                                className="w-full h-64 bg-black rounded-xl overflow-hidden mb-4"
                            >
                                {!scanning && !error && (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
                                        <Camera size={48} className="mb-2" />
                                        <p className="text-sm">Camera preview will appear here</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={scanning ? stopScanner : startScanner}
                                disabled={!html5QrCode}
                                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${scanning
                                        ? 'bg-red-500 text-white'
                                        : 'bg-[#0095FF] text-white disabled:bg-gray-400'
                                    }`}
                            >
                                {scanning ? (
                                    <><X size={18} /> Stop Scanning</>
                                ) : (
                                    <><Camera size={18} /> Start Camera</>
                                )}
                            </button>

                            <p className={`text-xs text-center mt-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Point camera at product barcode
                            </p>
                        </>
                    ) : (
                        // Confirmation Form
                        <>
                            <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'}`}>
                                <p className="text-green-500 text-sm font-medium">✓ Barcode Scanned!</p>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {scannedData.barcode} ({scannedData.format})
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Product Name *</label>
                                    <input
                                        type="text"
                                        value={productForm.name}
                                        onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter product name"
                                        className={`w-full mt-1 px-4 py-3 rounded-xl text-sm ${isDark
                                                ? 'bg-white/5 text-white border border-white/10 placeholder-gray-500'
                                                : 'bg-gray-100 text-gray-800 border border-gray-200 placeholder-gray-400'
                                            } focus:outline-none focus:ring-2 focus:ring-[#0095FF]/50`}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Price (₦) *</label>
                                        <input
                                            type="number"
                                            value={productForm.price}
                                            onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                                            placeholder="0"
                                            className={`w-full mt-1 px-4 py-3 rounded-xl text-sm ${isDark
                                                    ? 'bg-white/5 text-white border border-white/10'
                                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                                                } focus:outline-none focus:ring-2 focus:ring-[#0095FF]/50`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Stock</label>
                                        <input
                                            type="number"
                                            value={productForm.stock}
                                            onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                                            placeholder="1"
                                            className={`w-full mt-1 px-4 py-3 rounded-xl text-sm ${isDark
                                                    ? 'bg-white/5 text-white border border-white/10'
                                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                                                } focus:outline-none focus:ring-2 focus:ring-[#0095FF]/50`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Category</label>
                                    <select
                                        value={productForm.category}
                                        onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                                        className={`w-full mt-1 px-4 py-3 rounded-xl text-sm ${isDark
                                                ? 'bg-white/5 text-white border border-white/10'
                                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                                            } focus:outline-none`}
                                    >
                                        <option value="General">General</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Food">Food & Beverages</option>
                                        <option value="Clothing">Clothing</option>
                                        <option value="Beauty">Beauty & Health</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={handleRetry}
                                    className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    <RefreshCw size={16} /> Scan Again
                                </button>
                                <button
                                    onClick={handleConfirmProduct}
                                    className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-[#0095FF] text-white"
                                >
                                    <Check size={16} /> Add Product
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default BarcodeScanner
