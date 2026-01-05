import { useState, useRef, useContext } from 'react'
import { apiCall } from '../config/api'
import { ThemeContext } from '../context/ThemeContext'

const ProductImport = ({ onClose, onImportComplete }) => {
    const { theme } = useContext(ThemeContext)
    const [activeTab, setActiveTab] = useState('csv')
    const [importing, setImporting] = useState(false)
    const [previewData, setPreviewData] = useState([])
    const [error, setError] = useState('')
    const [googleSheetUrl, setGoogleSheetUrl] = useState('')
    const [pasteData, setPasteData] = useState('')
    const fileInputRef = useRef(null)
    const cameraInputRef = useRef(null)

    const isDark = theme === 'dark'

    // Parse CSV text to array of products
    const parseCSV = (csvText) => {
        const lines = csvText.trim().split('\n')
        if (lines.length < 2) return []

        const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
        const products = []

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim())
            if (values.length < 2) continue

            const product = {
                name: '',
                price_ngn: 0,
                stock_level: 0,
                description: '',
                category: ''
            }

            headers.forEach((header, idx) => {
                const value = values[idx] || ''
                if (header.includes('name') || header.includes('product')) {
                    product.name = value
                } else if (header.includes('price')) {
                    product.price_ngn = parseFloat(value.replace(/[^0-9.]/g, '')) || 0
                } else if (header.includes('stock') || header.includes('quantity') || header.includes('qty')) {
                    product.stock_level = parseInt(value.replace(/[^0-9]/g, '')) || 0
                } else if (header.includes('description') || header.includes('desc')) {
                    product.description = value
                } else if (header.includes('category') || header.includes('cat')) {
                    product.category = value
                }
            })

            if (product.name && product.price_ngn > 0) {
                products.push(product)
            }
        }

        return products
    }

    // Handle CSV file upload
    const handleCSVUpload = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setError('')
        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const products = parseCSV(event.target.result)
                if (products.length === 0) {
                    setError('No valid products found in CSV. Make sure columns include: name, price, stock')
                } else {
                    setPreviewData(products)
                }
            } catch (err) {
                setError('Failed to parse CSV file')
            }
        }
        reader.readAsText(file)
    }

    // Handle camera scan (OCR)
    const handleCameraScan = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setError('')
        setImporting(true)

        try {
            // Upload image and get OCR text
            const formData = new FormData()
            formData.append('image', file)

            // Use Gemini Vision API for OCR (via backend)
            const response = await apiCall('/products/scan-image', {
                method: 'POST',
                body: formData,
                headers: {} // Let browser set Content-Type for FormData
            })

            if (response.products && response.products.length > 0) {
                setPreviewData(response.products)
            } else if (response.text) {
                // Try to parse the OCR text as product list
                const lines = response.text.split('\n').filter(l => l.trim())
                const products = lines.map(line => {
                    // Pattern: "Product Name - N1500 x 10" or "Product Name 1500 10"
                    const match = line.match(/(.+?)[\s-]+[₦N]?(\d+[\d,]*)\s*[x×]?\s*(\d+)?/i)
                    if (match) {
                        return {
                            name: match[1].trim(),
                            price_ngn: parseFloat(match[2].replace(/,/g, '')),
                            stock_level: parseInt(match[3]) || 1,
                            description: '',
                            category: ''
                        }
                    }
                    return null
                }).filter(p => p && p.name && p.price_ngn > 0)

                if (products.length > 0) {
                    setPreviewData(products)
                } else {
                    setError('Could not extract products from image. Try a clearer photo or use CSV.')
                }
            }
        } catch (err) {
            console.error('OCR scan failed:', err)
            setError('Scan failed. Try uploading a clearer image or use CSV instead.')
        } finally {
            setImporting(false)
        }
    }

    // Handle Google Sheets import
    const handleGoogleSheetsImport = async () => {
        if (!googleSheetUrl) {
            setError('Please enter a Google Sheets URL')
            return
        }

        setError('')
        setImporting(true)

        try {
            // Extract sheet ID from URL
            const match = googleSheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
            if (!match) {
                setError('Invalid Google Sheets URL. Make sure the sheet is publicly viewable.')
                setImporting(false)
                return
            }

            const sheetId = match[1]

            // Fetch via backend (which handles CORS)
            const response = await apiCall('/products/import-google-sheet', {
                method: 'POST',
                body: JSON.stringify({ sheet_url: googleSheetUrl, sheet_id: sheetId })
            })

            if (response.products && response.products.length > 0) {
                setPreviewData(response.products)
            } else {
                setError('No products found in sheet. Make sure it has columns for name, price, stock.')
            }
        } catch (err) {
            console.error('Google Sheets import failed:', err)
            setError('Import failed. Make sure the sheet is publicly viewable (anyone with link can view).')
        } finally {
            setImporting(false)
        }
    }

    // Handle paste data
    const handlePasteImport = () => {
        if (!pasteData.trim()) {
            setError('Please paste your product data')
            return
        }

        setError('')

        // Try to parse as CSV or tab-separated
        const delimiter = pasteData.includes('\t') ? '\t' : ','
        const lines = pasteData.trim().split('\n')

        const products = lines.map(line => {
            const parts = line.split(delimiter).map(p => p.trim())
            if (parts.length >= 2) {
                return {
                    name: parts[0],
                    price_ngn: parseFloat(parts[1].replace(/[^0-9.]/g, '')) || 0,
                    stock_level: parseInt(parts[2]?.replace(/[^0-9]/g, '')) || 1,
                    description: parts[3] || '',
                    category: parts[4] || ''
                }
            }
            return null
        }).filter(p => p && p.name && p.price_ngn > 0)

        if (products.length > 0) {
            setPreviewData(products)
        } else {
            setError('Could not parse data. Use format: Name, Price, Stock (one per line)')
        }
    }

    // Submit import
    const handleImport = async () => {
        if (previewData.length === 0) {
            setError('No products to import')
            return
        }

        setImporting(true)
        setError('')

        try {
            const response = await apiCall('/products/import', {
                method: 'POST',
                body: JSON.stringify({ products: previewData })
            })

            if (response.status === 'success') {
                onImportComplete?.(response.imported || previewData.length)
                onClose()
            } else {
                setError(response.message || 'Import failed')
            }
        } catch (err) {
            console.error('Import failed:', err)
            setError('Failed to import products. Please try again.')
        } finally {
            setImporting(false)
        }
    }

    // Download CSV template
    const downloadTemplate = () => {
        const template = `name,price,stock,description,category
Nike Air Max,45000,10,Classic sneakers,Footwear
Polo Shirt Blue,15000,25,Cotton polo shirt,Clothing
Leather Bag,35000,5,Genuine leather bag,Accessories`

        const blob = new Blob([template], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'kofa_product_template.csv'
        a.click()
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const TabButton = ({ id, icon, label }) => (
        <button
            onClick={() => { setActiveTab(id); setPreviewData([]); setError('') }}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === id
                    ? 'bg-kofa-yellow text-black'
                    : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
        >
            <span>{icon}</span>
            <span className="hidden sm:inline">{label}</span>
        </button>
    )

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden ${isDark ? 'bg-dark-card' : 'bg-white'}`}>
                {/* Header */}
                <div className={`p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Import Products
                            </h2>
                            <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Add multiple products at once
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                        >
                            <span className="text-2xl">×</span>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4 flex-wrap">
                        <TabButton id="csv" icon="📄" label="CSV File" />
                        <TabButton id="camera" icon="📷" label="Camera Scan" />
                        <TabButton id="sheets" icon="📊" label="Google Sheets" />
                        <TabButton id="paste" icon="📋" label="Paste Data" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* CSV Tab */}
                    {activeTab === 'csv' && (
                        <div className="space-y-4">
                            <div className={`border-2 border-dashed rounded-xl p-8 text-center ${isDark ? 'border-gray-700' : 'border-gray-300'
                                }`}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleCSVUpload}
                                    className="hidden"
                                />
                                <div className="text-5xl mb-4">📄</div>
                                <p className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Upload CSV File
                                </p>
                                <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Columns: name, price, stock, description, category
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-6 py-2 bg-kofa-cobalt text-white rounded-lg hover:bg-kofa-cobalt/80"
                                    >
                                        Choose File
                                    </button>
                                    <button
                                        onClick={downloadTemplate}
                                        className={`px-6 py-2 rounded-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                        Download Template
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Camera Tab */}
                    {activeTab === 'camera' && (
                        <div className="space-y-4">
                            <div className={`border-2 border-dashed rounded-xl p-8 text-center ${isDark ? 'border-gray-700' : 'border-gray-300'
                                }`}>
                                <input
                                    ref={cameraInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleCameraScan}
                                    className="hidden"
                                />
                                <div className="text-5xl mb-4">📷</div>
                                <p className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Scan Product List
                                </p>
                                <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Take a photo of your handwritten or printed product list
                                </p>
                                <button
                                    onClick={() => cameraInputRef.current?.click()}
                                    disabled={importing}
                                    className="px-6 py-2 bg-kofa-cobalt text-white rounded-lg hover:bg-kofa-cobalt/80 disabled:opacity-50"
                                >
                                    {importing ? 'Scanning...' : 'Take Photo / Upload Image'}
                                </button>
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <p className="font-medium mb-1">Tips for best results:</p>
                                <ul className="list-disc ml-5 space-y-1">
                                    <li>Write clearly: Product Name - Price - Quantity</li>
                                    <li>Good lighting, no shadows</li>
                                    <li>Flat surface, no wrinkles</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Google Sheets Tab */}
                    {activeTab === 'sheets' && (
                        <div className="space-y-4">
                            <div>
                                <label className={`block mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Google Sheets URL
                                </label>
                                <input
                                    type="url"
                                    value={googleSheetUrl}
                                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                                    placeholder="https://docs.google.com/spreadsheets/d/..."
                                    className={`w-full px-4 py-3 rounded-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'
                                        } border focus:ring-2 focus:ring-kofa-yellow outline-none`}
                                />
                            </div>
                            <button
                                onClick={handleGoogleSheetsImport}
                                disabled={importing || !googleSheetUrl}
                                className="w-full px-6 py-3 bg-kofa-cobalt text-white rounded-lg hover:bg-kofa-cobalt/80 disabled:opacity-50"
                            >
                                {importing ? 'Importing...' : 'Import from Google Sheets'}
                            </button>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <p className="font-medium mb-1">Setup:</p>
                                <ol className="list-decimal ml-5 space-y-1">
                                    <li>Open your Google Sheet</li>
                                    <li>Click Share → "Anyone with the link can view"</li>
                                    <li>Copy the URL and paste above</li>
                                    <li>Make sure first row has headers: name, price, stock</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {/* Paste Tab */}
                    {activeTab === 'paste' && (
                        <div className="space-y-4">
                            <div>
                                <label className={`block mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Paste Your Product Data
                                </label>
                                <textarea
                                    value={pasteData}
                                    onChange={(e) => setPasteData(e.target.value)}
                                    placeholder={`Nike Air Max, 45000, 10
Polo Shirt, 15000, 25
Leather Bag, 35000, 5`}
                                    rows={8}
                                    className={`w-full px-4 py-3 rounded-lg resize-none ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'
                                        } border focus:ring-2 focus:ring-kofa-yellow outline-none font-mono text-sm`}
                                />
                            </div>
                            <button
                                onClick={handlePasteImport}
                                className="w-full px-6 py-3 bg-kofa-cobalt text-white rounded-lg hover:bg-kofa-cobalt/80"
                            >
                                Parse & Preview
                            </button>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Format: Name, Price, Stock (one product per line). You can paste directly from Excel or Google Sheets.
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Preview Table */}
                    {previewData.length > 0 && (
                        <div className="mt-6">
                            <h3 className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Preview ({previewData.length} products)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className={isDark ? 'bg-gray-800' : 'bg-gray-100'}>
                                        <tr>
                                            <th className={`px-4 py-2 text-left text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name</th>
                                            <th className={`px-4 py-2 text-left text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Price</th>
                                            <th className={`px-4 py-2 text-left text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Stock</th>
                                            <th className={`px-4 py-2 text-left text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Category</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-200'}`}>
                                        {previewData.slice(0, 10).map((product, idx) => (
                                            <tr key={idx}>
                                                <td className={`px-4 py-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.name}</td>
                                                <td className={`px-4 py-2 ${isDark ? 'text-kofa-yellow' : 'text-kofa-cobalt'}`}>
                                                    {formatCurrency(product.price_ngn)}
                                                </td>
                                                <td className={`px-4 py-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{product.stock_level}</td>
                                                <td className={`px-4 py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{product.category || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {previewData.length > 10 && (
                                    <p className={`text-center py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        ...and {previewData.length - 10} more
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`p-6 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} flex gap-4`}>
                    <button
                        onClick={onClose}
                        className={`flex-1 py-3 rounded-xl font-medium ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'
                            }`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={importing || previewData.length === 0}
                        className="flex-1 py-3 bg-gradient-to-r from-kofa-yellow to-yellow-500 text-black font-semibold rounded-xl disabled:opacity-50"
                    >
                        {importing ? 'Importing...' : `Import ${previewData.length} Products`}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProductImport
