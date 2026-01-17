import { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { apiCall, cachedApiCall, API_ENDPOINTS, CACHE_KEYS, API_BASE_URL } from '../../config/api'
import { clearCache } from '../../utils/cache'
import { ThemeContext } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { Plus, Search, ScanLine, Package, Upload, X, RefreshCw, Edit2, Image, Camera } from 'lucide-react'
import BarcodeScanner from '../../components/BarcodeScanner/BarcodeScanner'

const ProductsRedesign = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { theme } = useContext(ThemeContext)
    const { user } = useAuth()
    const isDark = theme === 'dark'
    const fileInputRef = useRef(null)
    const imageInputRef = useRef(null)

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState('all')
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)

    const [newProduct, setNewProduct] = useState({
        name: '', price: '', stock: '', category: 'General', description: '', image: null
    })
    const [imagePreview, setImagePreview] = useState(null)

    useEffect(() => { loadProducts() }, [])

    useEffect(() => {
        if (location.state?.action === 'add') {
            setShowAddModal(true)
            navigate(location.pathname, { replace: true, state: {} })
        }
    }, [location, navigate])

    const normalizeProducts = (data) => {
        return (Array.isArray(data) ? data : []).map(p => ({
            ...p,
            name: p.name || p.product_name || 'Unnamed',
            price: p.price_ngn || p.price || p.selling_price || p.unit_price || 0,
            stock: p.stock_level ?? p.stock ?? p.quantity ?? 0,
            category: p.category || 'General',
            image: p.image_url || p.image || null
        }))
    }

    const loadProducts = async (forceRefresh = false) => {
        setLoading(true)
        try {
            // Pass user_id to filter products by current vendor
            const endpoint = user?.id ? `${API_ENDPOINTS.PRODUCTS}?user_id=${user.id}` : API_ENDPOINTS.PRODUCTS
            const cacheKey = user?.id ? `${CACHE_KEYS.PRODUCTS}_${user.id}` : CACHE_KEYS.PRODUCTS

            let data
            if (forceRefresh) {
                // Skip cache - fetch directly from API for instant update
                clearCache(cacheKey)
                data = await apiCall(endpoint)
            } else {
                data = await cachedApiCall(endpoint, cacheKey, (fresh) => {
                    setProducts(normalizeProducts(fresh))
                })
            }
            setProducts(normalizeProducts(data))
        } catch (e) { setProducts([]) }
        finally { setLoading(false) }
    }

    const formatCurrency = (n) => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`

    const getStockStatus = (stock) => {
        if (stock === 0) return { label: 'Out of Stock', color: 'red' }
        if (stock < 10) return { label: 'Low Stock', color: 'orange' }
        return { label: 'In Stock', color: 'green' }
    }

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (ev) => {
            setImagePreview(ev.target?.result)
            setNewProduct({ ...newProduct, image: file })
        }
        reader.readAsDataURL(file)
    }

    const handleSaveProduct = async () => {
        if (!newProduct.name || !newProduct.price) { alert('Please fill name and price'); return }
        setSaving(true)
        try {
            const productData = {
                name: newProduct.name,
                price_ngn: parseFloat(newProduct.price),
                stock_level: parseInt(newProduct.stock) || 0,
                category: newProduct.category,
                description: newProduct.description,
                user_id: user?.id  // Required for FK constraint
            }

            let productId = editingProduct?.id

            if (editingProduct) {
                await apiCall(API_ENDPOINTS.UPDATE_PRODUCT(productId), {
                    method: 'PUT',
                    body: JSON.stringify(productData)
                })
            } else {
                const response = await apiCall(API_ENDPOINTS.CREATE_PRODUCT, {
                    method: 'POST',
                    body: JSON.stringify(productData)
                })
                productId = response.id || response.product_id
            }

            // Upload image if selected
            if (newProduct.image && productId) {
                const formData = new FormData()
                formData.append('image', newProduct.image)

                try {
                    await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPLOAD_PRODUCT_IMAGE(productId)}`, {
                        method: 'POST',
                        body: formData
                    })
                } catch (imgErr) {
                    console.warn('Image upload failed:', imgErr)
                }
            }

            setShowAddModal(false)
            setEditingProduct(null)
            setNewProduct({ name: '', price: '', stock: '', category: 'General', description: '', image: null })
            setImagePreview(null)
            clearCache(CACHE_KEYS.PRODUCTS)  // Clear cache to force fresh fetch
            loadProducts(true)  // Force refresh - skip cache
        } catch (e) {
            alert('Failed to save product')
        } finally {
            setSaving(false)
        }
    }

    const handleEditProduct = (product) => {
        setEditingProduct(product)
        setNewProduct({
            name: product.name,
            price: product.price.toString(),
            stock: product.stock.toString(),
            category: product.category,
            description: product.description || '',
            image: null
        })
        setImagePreview(product.image)
        setShowAddModal(true)
    }

    const handleRestock = async (productId, amount) => {
        if (amount <= 0) return
        try {
            await apiCall(API_ENDPOINTS.RESTOCK_PRODUCT(productId), {
                method: 'POST',
                body: JSON.stringify({ quantity: amount })
            })
            loadProducts()
        } catch (e) { alert('Failed to restock') }
    }

    const handleCSVImport = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (event) => {
            try {
                const text = event.target?.result
                const lines = text.split('\n')
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue
                    const values = lines[i].split(',')
                    const product = {}
                    headers.forEach((h, idx) => {
                        if (h.includes('name')) product.name = values[idx]?.trim()
                        if (h.includes('price')) product.price = parseFloat(values[idx]) || 0
                        if (h.includes('stock') || h.includes('quantity')) product.stock_level = parseInt(values[idx]) || 0
                        if (h.includes('category')) product.category = values[idx]?.trim()
                    })
                    if (product.name && product.price) {
                        await apiCall(API_ENDPOINTS.CREATE_PRODUCT, {
                            method: 'POST',
                            body: JSON.stringify(product)
                        })
                    }
                }
                alert('Products imported!')
                loadProducts()
            } catch (err) { alert('Failed to import CSV') }
        }
        reader.readAsText(file)
        e.target.value = ''
    }

    const filters = [
        { id: 'all', label: 'All Items' },
        { id: 'low', label: 'Low Stock' },
        { id: 'out', label: 'Out of Stock' }
    ]

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase())
        if (activeFilter === 'low') return matchesSearch && p.stock > 0 && p.stock < 10
        if (activeFilter === 'out') return matchesSearch && p.stock === 0
        return matchesSearch
    })

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#0F0F12]' : 'bg-white'}`}>
            {/* Header */}
            <header className={`px-4 pt-4 pb-2 ${isDark ? 'text-white' : ''}`}>
                <h1 className="text-2xl font-bold">Inventory</h1>
            </header>

            <div className="px-4 pb-4 flex items-center justify-between">
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Manage stock levels and pricing</p>
                <div className="flex items-center gap-2">
                    <button className={`p-2 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'}`}
                        title="Scan Barcode" onClick={() => setShowBarcodeScanner(true)}>
                        <ScanLine size={20} className="text-[#0095FF]" />
                    </button>
                    <input type="file" ref={fileInputRef} accept=".csv" onChange={handleCSVImport} className="hidden" />
                    <button className={`p-2 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'}`}
                        title="Import CSV" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={20} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 pb-4">
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                    <Search size={20} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                    <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`} />
                </div>
            </div>

            {/* Filters */}
            <div className="px-4 pb-4 flex gap-2 overflow-x-auto">
                {filters.map(filter => (
                    <button key={filter.id} onClick={() => setActiveFilter(filter.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeFilter === filter.id ? 'bg-[#0095FF] text-white' : isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}>
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Products List */}
            <div className="px-4 pb-32 space-y-3">
                {loading ? (
                    <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <RefreshCw size={24} className="mx-auto animate-spin mb-2" />Loading...
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Package size={48} className="mx-auto mb-3 opacity-50" />
                        <p>No products found</p>
                        <button onClick={() => setShowAddModal(true)} className="mt-3 text-[#0095FF] font-medium">Add your first product</button>
                    </div>
                ) : filteredProducts.map(product => {
                    const status = getStockStatus(product.stock)
                    return (
                        <div key={product.id} className={`rounded-2xl p-4 ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white border border-gray-100 shadow-sm'}`}>
                            <div className="flex gap-4">
                                <div className={`w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Package size={24} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.name}</h3>
                                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{product.category}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color === 'green' ? 'bg-green-100 text-green-600' :
                                            status.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                                                'bg-red-100 text-red-600'
                                            }`}>{product.stock} in stock</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end justify-between">
                                    <span className="text-lg font-bold text-[#0095FF]">{formatCurrency(product.price)}</span>
                                    <button onClick={() => handleEditProduct(product)}
                                        className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                                        <Edit2 size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* FAB */}
            <button onClick={() => { setEditingProduct(null); setNewProduct({ name: '', price: '', stock: '', category: 'General', description: '', image: null }); setImagePreview(null); setShowAddModal(true) }}
                className="fixed bottom-24 right-4 w-14 h-14 bg-[#0095FF] text-white rounded-2xl shadow-lg flex items-center justify-center z-30">
                <Plus size={24} />
            </button>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
                    <div className={`rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#1A1A1F]' : 'bg-white'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : ''}`}>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                            <button onClick={() => { setShowAddModal(false); setEditingProduct(null) }} className={`p-1 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                                <X size={20} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                            </button>
                        </div>

                        {/* Image Upload */}
                        <div className="mb-4">
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Product Image</label>
                            <input type="file" ref={imageInputRef} accept="image/*" onChange={handleImageSelect} className="hidden" />
                            <div onClick={() => imageInputRef.current?.click()}
                                className={`w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden ${isDark ? 'border-white/20 hover:border-[#0095FF]' : 'border-gray-200 hover:border-[#0095FF]'
                                    }`}>
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <Camera size={24} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                                        <span className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Tap to add photo</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Product Name *</label>
                                <input type="text" placeholder="e.g. Premium T-Shirt" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10 focus:border-[#0095FF]' : 'bg-gray-100 focus:bg-white border border-gray-100 focus:border-[#0095FF]'}`} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Price (₦) *</label>
                                    <input type="number" placeholder="0" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                        className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100 border border-gray-100'}`} />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Stock</label>
                                    <input type="number" placeholder="0" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                        className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100 border border-gray-100'}`} />
                                </div>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Category</label>
                                <select value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100 border border-gray-100'}`}>
                                    <option value="General">General</option>
                                    <option value="Clothing">Clothing</option>
                                    <option value="Electronics">Electronics</option>
                                    <option value="Food">Food & Beverages</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Description</label>
                                <textarea placeholder="Product details..." value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl outline-none resize-none h-20 ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100 border border-gray-100'}`} />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setShowAddModal(false); setEditingProduct(null) }} className={`flex-1 py-3 rounded-xl font-semibold ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
                            <button onClick={handleSaveProduct} disabled={saving} className="flex-1 py-3 bg-[#0095FF] text-white rounded-xl font-semibold">
                                {saving ? 'Saving...' : editingProduct ? 'Save' : 'Add Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Barcode Scanner Modal */}
            <BarcodeScanner
                isOpen={showBarcodeScanner}
                onClose={() => setShowBarcodeScanner(false)}
                isDark={isDark}
                onProductScanned={async (scannedProduct) => {
                    // Create the product via API
                    try {
                        await apiCall(API_ENDPOINTS.CREATE_PRODUCT, {
                            method: 'POST',
                            body: JSON.stringify({
                                ...scannedProduct,
                                user_id: user?.id
                            })
                        })
                        loadProducts()
                        alert(`✅ Product "${scannedProduct.name}" added successfully!`)
                    } catch (e) {
                        alert('Failed to add product. Please try again.')
                    }
                }}
            />
        </div>
    )
}

export default ProductsRedesign
