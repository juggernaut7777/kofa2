import { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, API_ENDPOINTS, API_BASE_URL } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'

const ProductsRedesign = () => {
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'
    const fileInputRef = useRef(null)
    const imageInputRef = useRef(null)

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showProductDetail, setShowProductDetail] = useState(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [selectedImage, setSelectedImage] = useState(null)
    const [showImportModal, setShowImportModal] = useState(false)

    const [newProduct, setNewProduct] = useState({
        name: '', price: '', stock: '', category: '', description: ''
    })

    const categories = [
        { id: 'All', icon: '🏪', color: 'gray' },
        { id: 'Textiles', icon: '🧵', color: 'rose' },
        { id: 'Electronics', icon: '📱', color: 'blue' },
        { id: 'Beauty', icon: '💄', color: 'pink' },
        { id: 'Fashion', icon: '👟', color: 'violet' },
        { id: 'Food', icon: '🍔', color: 'amber' },
    ]

    useEffect(() => { loadProducts() }, [])

    const loadProducts = async () => {
        setLoading(true)
        try {
            const data = await apiCall(API_ENDPOINTS.PRODUCTS)
            setProducts(Array.isArray(data) ? data : [])
        } catch (e) {
            setProducts([
                { id: 1, name: 'Ankara Fabric Pattern Royal Blue', price: 12000, stock: 24, category: 'Textiles', image_url: 'https://images.unsplash.com/photo-1594032194509-0f8f7ad0b6a7?w=400' },
                { id: 2, name: 'Premium Wireless Earbuds Pro', price: 45000, stock: 8, category: 'Electronics', image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400' },
                { id: 3, name: 'Luxury Face Serum Collection', price: 28000, stock: 3, category: 'Beauty', image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400' },
                { id: 4, name: 'Designer Sneakers Limited', price: 89000, stock: 5, category: 'Fashion', image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
            ])
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (n) => {
        if (n >= 1000000) return `₦${(n / 1000000).toFixed(1)}M`
        if (n >= 1000) return `₦${Math.round(n / 1000)}K`
        return `₦${n}`
    }

    const handleImageSelect = (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) { alert('Image must be less than 5MB'); return }
        setSelectedImage(file)
        const reader = new FileReader()
        reader.onload = (e) => setImagePreview(e.target.result)
        reader.readAsDataURL(file)
    }

    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.price) { alert('Please fill name and price'); return }
        setSaving(true)
        try {
            await apiCall(API_ENDPOINTS.CREATE_PRODUCT, {
                method: 'POST',
                body: JSON.stringify({
                    name: newProduct.name,
                    price: parseFloat(newProduct.price),
                    stock: parseInt(newProduct.stock) || 0,
                    category: newProduct.category || 'General',
                    description: newProduct.description,
                    image_url: imagePreview
                })
            })
            await loadProducts()
            resetForm()
        } catch (e) {
            setProducts([...products, { id: Date.now(), ...newProduct, price: parseFloat(newProduct.price), stock: parseInt(newProduct.stock) || 0, image_url: imagePreview }])
            resetForm()
        } finally {
            setSaving(false)
        }
    }

    const resetForm = () => {
        setShowAddModal(false)
        setNewProduct({ name: '', price: '', stock: '', category: '', description: '' })
        setImagePreview(null)
        setSelectedImage(null)
    }

    const handleEditProduct = async () => {
        if (!editingProduct) return
        setSaving(true)
        try {
            await apiCall(API_ENDPOINTS.UPDATE_PRODUCT(editingProduct.id), {
                method: 'PUT',
                body: JSON.stringify({ ...editingProduct, image_url: imagePreview || editingProduct.image_url })
            })
            await loadProducts()
        } catch (e) {
            setProducts(products.map(p => p.id === editingProduct.id ? { ...editingProduct, image_url: imagePreview || editingProduct.image_url } : p))
        }
        setShowEditModal(false)
        setEditingProduct(null)
        setImagePreview(null)
        setSaving(false)
    }

    const handleDeleteProduct = async (id) => {
        if (!confirm('Delete this product?')) return
        try {
            await apiCall(API_ENDPOINTS.DELETE_PRODUCT(id), { method: 'DELETE' })
            await loadProducts()
        } catch (e) {
            setProducts(products.filter(p => p.id !== id))
        }
        setShowProductDetail(null)
    }

    const handleRestock = async (product) => {
        const qty = prompt(`Add stock for ${product.name}. Current: ${product.stock}`, '10')
        if (!qty || isNaN(parseInt(qty))) return
        const addQty = parseInt(qty)
        try {
            await apiCall(API_ENDPOINTS.RESTOCK_PRODUCT(product.id), {
                method: 'POST',
                body: JSON.stringify({ quantity: addQty })
            })
            await loadProducts()
        } catch (e) {
            setProducts(products.map(p => p.id === product.id ? { ...p, stock: p.stock + addQty } : p))
        }
    }

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const getCategoryIcon = (cat) => categories.find(c => c.id === cat)?.icon || '📦'

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#030712]' : 'bg-gray-50'}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading products...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen font-['Inter',system-ui,sans-serif] ${isDark ? 'bg-[#030712]' : 'bg-gray-50'}`}>

            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-violet-500/10' : 'bg-violet-500/5'}`}></div>
                <div className={`absolute bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-500/5'}`}></div>
            </div>

            <div className="relative max-w-md mx-auto pb-28">

                {/* Premium Header */}
                <header className={`sticky top-0 z-30 px-5 pt-4 pb-3 ${isDark ? 'bg-[#030712]/80' : 'bg-gray-50/80'} backdrop-blur-2xl`}>
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => navigate('/dashboard')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <span className="text-lg">←</span>
                        </button>
                        <div className="flex gap-2">
                            <button onClick={loadProducts} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                <span className="text-lg">🔄</span>
                            </button>
                            <button onClick={() => setShowImportModal(true)} className={`px-4 h-10 rounded-xl flex items-center gap-2 font-semibold transition-all hover:scale-105 ${isDark ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'}`}>
                                <span>↓</span>
                                <span className="text-sm">Import</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Products</h1>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{products.length} items in catalog</p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all text-2xl font-bold"
                        >
                            +
                        </button>
                    </div>
                </header>

                {/* Search */}
                <div className="px-5 pt-3">
                    <div className={`flex items-center rounded-2xl h-12 border backdrop-blur-xl transition-all focus-within:ring-2 focus-within:ring-emerald-500/50 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                        <span className="pl-4 text-gray-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`flex-1 bg-transparent border-none focus:outline-none px-3 text-sm ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="pr-4 text-gray-400 hover:text-gray-300">✕</button>
                        )}
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 px-5 pt-4 overflow-x-auto no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 h-10 rounded-xl whitespace-nowrap transition-all hover:scale-105 ${selectedCategory === cat.id
                                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/25'
                                    : isDark ? 'bg-white/5 text-gray-400 border border-white/10' : 'bg-white text-gray-600 border border-gray-200'
                                }`}
                        >
                            <span>{cat.icon}</span>
                            <span className="text-sm">{cat.id}</span>
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-5">
                        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-4 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <span className="text-5xl">📦</span>
                        </div>
                        <p className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No products found</p>
                        <p className={`text-sm text-center mb-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {searchQuery ? 'Try a different search' : 'Add your first product'}
                        </p>
                        <button onClick={() => setShowAddModal(true)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-bold shadow-lg hover:scale-105 transition-all">
                            + Add Product
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 p-5">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => setShowProductDetail(product)}
                                className={`group rounded-2xl overflow-hidden border backdrop-blur-xl cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}
                            >
                                {/* Image */}
                                <div className="relative aspect-square overflow-hidden">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-100 to-gray-50'}`}>
                                            <span className="text-5xl opacity-30">{getCategoryIcon(product.category)}</span>
                                        </div>
                                    )}

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    {/* Low Stock Badge */}
                                    {product.stock <= 3 && (
                                        <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg text-white text-[10px] font-bold shadow-lg">
                                            ⚡ Low Stock
                                        </div>
                                    )}

                                    {/* Category Badge */}
                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-white text-[10px] font-bold">
                                        {product.category}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                    <p className={`text-sm font-semibold leading-tight line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.name}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-lg font-black text-emerald-500">{formatCurrency(product.price)}</p>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${product.stock <= 3 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{product.stock}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Product Detail Modal */}
            {showProductDetail && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProductDetail(null)}></div>
                    <div className={`relative w-full max-w-md rounded-t-3xl overflow-hidden ${isDark ? 'bg-[#030712]' : 'bg-white'}`}>
                        {/* Hero Image */}
                        <div className="relative h-64">
                            {showProductDetail.image_url ? (
                                <img src={showProductDetail.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                    <span className="text-6xl opacity-30">{getCategoryIcon(showProductDetail.category)}</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            <button onClick={() => setShowProductDetail(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all">
                                ✕
                            </button>
                            <div className="absolute bottom-4 left-4 right-4">
                                <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg text-white text-xs font-bold">{showProductDetail.category}</span>
                                <h2 className="text-2xl font-bold text-white mt-2">{showProductDetail.name}</h2>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-3xl font-black text-emerald-500">{formatCurrency(showProductDetail.price)}</p>
                                <div className="flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-full ${showProductDetail.stock <= 3 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{showProductDetail.stock} in stock</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => { setEditingProduct({ ...showProductDetail }); setImagePreview(showProductDetail.image_url); setShowEditModal(true); setShowProductDetail(null) }}
                                    className={`flex flex-col items-center gap-2 py-4 rounded-2xl transition-all hover:scale-105 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}
                                >
                                    <span className="text-xl">✏️</span>
                                    <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Edit</span>
                                </button>
                                <button
                                    onClick={() => handleRestock(showProductDetail)}
                                    className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-emerald-500/10 transition-all hover:scale-105"
                                >
                                    <span className="text-xl">📦</span>
                                    <span className="text-xs font-semibold text-emerald-500">Restock</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteProduct(showProductDetail.id)}
                                    className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-red-500/10 transition-all hover:scale-105"
                                >
                                    <span className="text-xl">🗑️</span>
                                    <span className="text-xs font-semibold text-red-500">Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetForm}></div>
                    <div className={`relative w-full max-w-md rounded-t-3xl overflow-hidden ${isDark ? 'bg-[#030712]' : 'bg-white'}`}>
                        <div className="w-full flex justify-center pt-3">
                            <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-white/20' : 'bg-gray-300'}`}></div>
                        </div>

                        <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                            <button onClick={resetForm} className="text-red-500 font-semibold">Cancel</button>
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>New Product</h3>
                            <button onClick={handleAddProduct} disabled={saving} className="text-emerald-500 font-semibold disabled:opacity-50">
                                {saving ? '...' : 'Save'}
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5">
                            {/* Image Upload */}
                            <div className="flex justify-center">
                                <input type="file" ref={imageInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                                <button
                                    onClick={() => imageInputRef.current?.click()}
                                    className={`w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 overflow-hidden transition-all hover:scale-105 hover:border-emerald-500 ${isDark ? 'border-white/20 bg-white/5' : 'border-gray-300 bg-gray-50'}`}
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <span className="text-3xl">📷</span>
                                            <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Add Photo</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Form */}
                            <div>
                                <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Product Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Premium Wireless Headphones"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    className={`w-full rounded-xl px-4 py-3.5 border focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Price (₦) *</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={newProduct.price}
                                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                        className={`w-full rounded-xl px-4 py-3.5 border focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Stock</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={newProduct.stock}
                                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                        className={`w-full rounded-xl px-4 py-3.5 border focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Category</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {categories.filter(c => c.id !== 'All').map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setNewProduct({ ...newProduct, category: cat.id })}
                                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all hover:scale-105 ${newProduct.category === cat.id
                                                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                                                    : isDark ? 'bg-white/5' : 'bg-gray-100'
                                                }`}
                                        >
                                            <span className="text-lg">{cat.icon}</span>
                                            <span className="text-[9px] font-bold">{cat.id}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className={`w-full max-w-sm rounded-2xl p-6 ${isDark ? 'bg-[#030712]' : 'bg-white'}`}>
                        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Edit Product</h3>
                        <div className="space-y-4">
                            <input type="file" ref={imageInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                            <div className="flex justify-center">
                                <button onClick={() => imageInputRef.current?.click()} className={`w-24 h-24 rounded-xl border-2 border-dashed overflow-hidden ${isDark ? 'border-white/20' : 'border-gray-300'}`}>
                                    {imagePreview || editingProduct.image_url ? (
                                        <img src={imagePreview || editingProduct.image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl">📷</span>
                                    )}
                                </button>
                            </div>
                            <input
                                type="text"
                                value={editingProduct.name}
                                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="number"
                                    value={editingProduct.price}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                                    className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}
                                />
                                <input
                                    type="number"
                                    value={editingProduct.stock}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                                    className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setShowEditModal(false); setEditingProduct(null); setImagePreview(null) }} className={`flex-1 py-3 rounded-xl font-semibold border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                Cancel
                            </button>
                            <button onClick={handleEditProduct} disabled={saving} className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-emerald-400 to-emerald-600 text-white disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    )
}

export default ProductsRedesign
