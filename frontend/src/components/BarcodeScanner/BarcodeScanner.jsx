import { useState, useRef } from 'react'
import { X, Camera, Check, AlertCircle, RefreshCw, FileText, Loader } from 'lucide-react'

/**
 * OCRScanner Component
 * Uses camera to scan written/printed text and extract product info for inventory.
 * Uses Tesseract.js for OCR (Optical Character Recognition).
 */
const OCRScanner = ({ isOpen, onClose, onProductScanned, isDark = true }) => {
    const [imagePreview, setImagePreview] = useState(null)
    const [extractedText, setExtractedText] = useState('')
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState(null)
    const [tesseractLoaded, setTesseractLoaded] = useState(false)
    const fileInputRef = useRef(null)
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const [showCamera, setShowCamera] = useState(false)
    const [cameraStream, setCameraStream] = useState(null)

    // Product form state for confirmation
    const [productForm, setProductForm] = useState({
        name: '',
        price: '',
        stock: '1',
        category: 'General'
    })

    // Load Tesseract.js from CDN
    const loadTesseract = async () => {
        if (window.Tesseract) {
            setTesseractLoaded(true)
            return window.Tesseract
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://unpkg.com/tesseract.js@5.0.5/dist/tesseract.min.js'
            script.onload = () => {
                setTesseractLoaded(true)
                resolve(window.Tesseract)
            }
            script.onerror = () => reject(new Error('Failed to load OCR library'))
            document.head.appendChild(script)
        })
    }

    // Start camera
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            })
            setCameraStream(stream)
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
            setShowCamera(true)
            setError(null)
        } catch (err) {
            setError('Camera access denied. Please allow camera permissions or use file upload.')
        }
    }

    // Stop camera
    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop())
            setCameraStream(null)
        }
        setShowCamera(false)
    }

    // Capture photo from camera
    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current
            const canvas = canvasRef.current
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            canvas.getContext('2d').drawImage(video, 0, 0)
            const imageData = canvas.toDataURL('image/jpeg', 0.8)
            setImagePreview(imageData)
            stopCamera()
            processImage(imageData)
        }
    }

    // Handle file upload
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const imageData = event.target.result
            setImagePreview(imageData)
            processImage(imageData)
        }
        reader.readAsDataURL(file)
    }

    // Process image with OCR
    const processImage = async (imageData) => {
        setProcessing(true)
        setError(null)
        setExtractedText('')

        try {
            const Tesseract = await loadTesseract()

            const result = await Tesseract.recognize(
                imageData,
                'eng',
                {
                    logger: m => console.log('OCR Progress:', m)
                }
            )

            const text = result.data.text.trim()
            setExtractedText(text)

            // Try to parse product info from text
            parseProductFromText(text)

        } catch (err) {
            setError('Failed to process image. Please try again with a clearer photo.')
            console.error('OCR Error:', err)
        } finally {
            setProcessing(false)
        }
    }

    // Parse product info from extracted text
    const parseProductFromText = (text) => {
        const lines = text.split('\n').filter(l => l.trim())

        // Try to find price (numbers with naira symbol or large numbers)
        const priceMatch = text.match(/[₦N]?\s*(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)/i)
        const price = priceMatch ? priceMatch[1].replace(/,/g, '') : ''

        // Try to find stock/quantity
        const stockMatch = text.match(/(?:qty|quantity|stock|x)\s*[:=]?\s*(\d+)/i)
        const stock = stockMatch ? stockMatch[1] : '1'

        // First line is usually product name
        const name = lines[0]?.replace(/[₦N]?\d{1,3}(?:,?\d{3})*(?:\.\d{2})?/g, '').trim() || ''

        setProductForm(prev => ({
            ...prev,
            name: name,
            price: price,
            stock: stock
        }))
    }

    const handleConfirmProduct = () => {
        if (!productForm.name || !productForm.price) {
            setError('Please fill in product name and price')
            return
        }

        onProductScanned({
            name: productForm.name,
            price_ngn: parseFloat(productForm.price),
            stock_level: parseInt(productForm.stock) || 1,
            category: productForm.category
        })

        // Reset and close
        resetScanner()
        onClose()
    }

    const resetScanner = () => {
        setImagePreview(null)
        setExtractedText('')
        setProductForm({ name: '', price: '', stock: '1', category: 'General' })
        setError(null)
        stopCamera()
    }

    const handleClose = () => {
        resetScanner()
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-[#1A1A1F]' : 'bg-white'}`}>
                {/* Header */}
                <div className={`sticky top-0 flex items-center justify-between p-4 border-b ${isDark ? 'border-white/10 bg-[#1A1A1F]' : 'border-gray-200 bg-white'}`}>
                    <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        📷 Scan Text to Add Product
                    </h2>
                    <button onClick={handleClose} className={`p-2 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                        <X size={20} className={isDark ? 'text-white' : 'text-gray-600'} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                            <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                            <span className="text-sm text-red-500">{error}</span>
                        </div>
                    )}

                    {/* Camera/Upload Section */}
                    {!imagePreview && !showCamera && (
                        <div className="space-y-3">
                            <p className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Take a photo or upload an image of your product list, receipt, or price tag
                            </p>

                            <button
                                onClick={startCamera}
                                className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 bg-[#0095FF] text-white"
                            >
                                <Camera size={20} /> Take Photo
                            </button>

                            <div className="relative">
                                <div className={`h-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                                <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-xs ${isDark ? 'bg-[#1A1A1F] text-gray-500' : 'bg-white text-gray-400'}`}>
                                    or
                                </span>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}
                            >
                                <FileText size={20} /> Upload Image
                            </button>
                        </div>
                    )}

                    {/* Camera View */}
                    {showCamera && (
                        <div className="space-y-3">
                            <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                <canvas ref={canvasRef} className="hidden" />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={stopCamera}
                                    className={`flex-1 py-3 rounded-xl font-semibold ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={capturePhoto}
                                    className="flex-1 py-3 rounded-xl font-semibold bg-[#0095FF] text-white flex items-center justify-center gap-2"
                                >
                                    <Camera size={18} /> Capture
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Processing */}
                    {processing && (
                        <div className="py-12 text-center">
                            <Loader size={40} className="mx-auto mb-3 text-[#0095FF] animate-spin" />
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Reading text from image...
                            </p>
                        </div>
                    )}

                    {/* Extracted Text & Form */}
                    {imagePreview && !processing && (
                        <>
                            {/* Image Preview */}
                            <div className="mb-4">
                                <img
                                    src={imagePreview}
                                    alt="Captured"
                                    className="w-full h-40 object-cover rounded-xl"
                                />
                            </div>

                            {/* Extracted Text */}
                            {extractedText && (
                                <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                                    <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Extracted Text:
                                    </p>
                                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                        {extractedText.substring(0, 200)}{extractedText.length > 200 ? '...' : ''}
                                    </p>
                                </div>
                            )}

                            {/* Product Form */}
                            <div className="space-y-3">
                                <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    ✏️ Review and correct if needed:
                                </p>

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
                                    onClick={resetScanner}
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

export default OCRScanner
