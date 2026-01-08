import { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'

// Moonlight Color Palette
const colors = {
    lavender: '#CCCCFF',
    muted: '#A3A3CC',
    violet: '#5C5C99',
    indigo: '#292966',
}

const ProductsRedesign = () => {
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'
    const imageInputRef = useRef(null)

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showProductDetail, setShowProductDetail] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [selectedImage, setSelectedImage] = useState(null)

    const [newProduct, setNewProduct] = useState({
        name: '', price: '', stock: '', category: '', description: ''
    })

    const categories = ['All', 'Textiles', 'Electronics', 'Beauty', 'Fashion', 'Food', 'Other']

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
                    image_url: imagePreview
                })
            })
            await loadProducts()
        } catch (e) {
            setProducts([...products, { id: Date.now(), ...newProduct, price: parseFloat(newProduct.price), stock: parseInt(newProduct.stock) || 0, image_url: imagePreview }])
        }
        resetForm()
        setSaving(false)
    }

    const resetForm = () => {
        setShowAddModal(false)
        setNewProduct({ name: '', price: '', stock: '', category: '', description: '' })
        setImagePreview(null)
        setSelectedImage(null)
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

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0a14]' : 'bg-[#fafaff]'}`}>
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-white/10"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: colors.violet }}></div>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen font-['SF_Pro_Display',-apple-system,sans-serif] ${isDark ? 'bg-[#0a0a14]' : 'bg-[#fafaff]'}`}>

            {/* Ambient Gradient */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[120px]" style={{ background: isDark ? `${colors.indigo}40` : `${colors.lavender}30` }}></div>
                <div className="absolute bottom-40 -left-40 w-80 h-80 rounded-full blur-[100px]" style={{ background: isDark ? `${colors.violet}20` : `${colors.muted}20` }}></div>
            </div>

            <div className="relative max-w-md mx-auto pb-28">

                {/* Header */}
                <header className={`sticky top-0 z-30 px-6 pt-5 pb-4 ${isDark ? 'bg-[#0a0a14]/70' : 'bg-[#fafaff]/70'} backdrop-blur-2xl`}>
                    <div className="flex items-center justify-between mb-5">
                        <button onClick={() => navigate('/dashboard')} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-105 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                            <svg className={`w-5 h-5 ${isDark ? 'text-white/70' : 'text-black/70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button onClick={loadProducts} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-105 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                            <svg className={`w-5 h-5 ${isDark ? 'text-white/70' : 'text-black/70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Products</h1>
                            <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>{products.length} items in catalog</p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all hover:scale-105 active:scale-95"
                            style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})`, boxShadow: `0 8px 24px ${colors.indigo}60` }}
                        >
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Search */}
                <div className="px-6 pt-2">
                    <div className={`flex items-center rounded-2xl h-12 border backdrop-blur-xl transition-all ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white border-black/[0.04]'}`}>
                        <svg className={`ml-4 w-5 h-5 ${isDark ? 'text-white/30' : 'text-black/30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`flex-1 bg-transparent border-none focus:outline-none px-3 text-sm ${isDark ? 'text-white placeholder-white/30' : 'text-black placeholder-black/30'}`}
                        />
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 px-6 pt-4 overflow-x-auto no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 h-9 rounded-xl whitespace-nowrap text-sm font-medium transition-all hover:scale-105 ${selectedCategory === cat
                                    ? 'text-white shadow-lg'
                                    : isDark ? 'bg-white/[0.03] text-white/50 border border-white/[0.06]' : 'bg-white text-black/50 border border-black/[0.04]'
                                }`}
                            style={selectedCategory === cat ? { background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})`, boxShadow: `0 4px 12px ${colors.indigo}40` } : {}}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-4 ${isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
                            <svg className="w-12 h-12" style={{ color: colors.muted }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>No products found</p>
                        <p className={`text-sm text-center mb-6 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                            {searchQuery ? 'Try a different search' : 'Add your first product'}
                        </p>
                        <button onClick={() => setShowAddModal(true)} className="px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-all hover:scale-105" style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}>
                            + Add Product
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 p-6">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => setShowProductDetail(product)}
                                className={`group rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}
                                style={{ boxShadow: isDark ? 'none' : '0 4px 12px rgba(0,0,0,0.04)' }}
                            >
                                {/* Image */}
                                <div className="relative aspect-square overflow-hidden">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}>
                                            <svg className="w-12 h-12" style={{ color: colors.muted, opacity: 0.3 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Low Stock Badge */}
                                    {product.stock <= 3 && (
                                        <div className="absolute top-2 left-2 px-2 py-1 rounded-lg text-white text-[10px] font-semibold" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                                            Low Stock
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                    <p className={`text-sm font-medium leading-tight line-clamp-2 ${isDark ? 'text-white' : 'text-black'}`}>{product.name}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-base font-bold" style={{ color: colors.violet }}>{formatCurrency(product.price)}</p>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${product.stock <= 3 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                                            <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>{product.stock}</span>
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
                    <div className={`relative w-full max-w-md rounded-t-3xl overflow-hidden ${isDark ? 'bg-[#0a0a14]' : 'bg-white'}`}>
                        {/* Hero Image */}
                        <div className="relative h-64">
                            {showProductDetail.image_url ? (
                                <img src={showProductDetail.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}>
                                    <svg className="w-20 h-20" style={{ color: colors.muted, opacity: 0.2 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            <button onClick={() => setShowProductDetail(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="absolute bottom-4 left-4 right-4">
                                <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg text-white text-xs font-medium">{showProductDetail.category}</span>
                                <h2 className="text-xl font-bold text-white mt-2">{showProductDetail.name}</h2>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-3xl font-bold" style={{ color: colors.violet }}>{formatCurrency(showProductDetail.price)}</p>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${showProductDetail.stock <= 3 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{showProductDetail.stock} in stock</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleRestock(showProductDetail)}
                                    className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium transition-all hover:scale-[1.02] ${isDark ? 'bg-white/[0.05]' : 'bg-black/[0.03]'}`}
                                    style={{ color: colors.violet }}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Restock
                                </button>
                                <button
                                    onClick={() => handleDeleteProduct(showProductDetail.id)}
                                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium bg-red-500/10 text-red-500 transition-all hover:scale-[1.02]"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
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
                    <div className={`relative w-full max-w-md rounded-t-3xl overflow-hidden ${isDark ? 'bg-[#0a0a14]' : 'bg-white'}`}>
                        <div className="w-full flex justify-center pt-3">
                            <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-white/20' : 'bg-black/20'}`}></div>
                        </div>

                        <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? 'border-white/[0.06]' : 'border-black/[0.04]'}`}>
                            <button onClick={resetForm} className="text-red-500 font-medium">Cancel</button>
                            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>New Product</h3>
                            <button onClick={handleAddProduct} disabled={saving} className="font-medium disabled:opacity-50" style={{ color: colors.violet }}>
                                {saving ? '...' : 'Save'}
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5">
                            {/* Image Upload */}
                            <div className="flex justify-center">
                                <input type="file" ref={imageInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                                <button
                                    onClick={() => imageInputRef.current?.click()}
                                    className={`w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 overflow-hidden transition-all hover:scale-105 ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-black/10 bg-black/[0.02]'}`}
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <svg className="w-8 h-8" style={{ color: colors.muted }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className={`text-xs font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>Add Photo</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Form */}
                            <div>
                                <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Product Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Premium Wireless Headphones"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    className={`w-full rounded-xl px-4 py-3.5 border transition-all focus:outline-none ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white placeholder-white/30 focus:border-white/20' : 'bg-black/[0.02] border-black/[0.04] text-black placeholder-black/30 focus:border-black/10'}`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Price (₦) *</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={newProduct.price}
                                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                        className={`w-full rounded-xl px-4 py-3.5 border transition-all focus:outline-none ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white' : 'bg-black/[0.02] border-black/[0.04] text-black'}`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Stock</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={newProduct.stock}
                                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                        className={`w-full rounded-xl px-4 py-3.5 border transition-all focus:outline-none ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white' : 'bg-black/[0.02] border-black/[0.04] text-black'}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Category</label>
                                <select
                                    value={newProduct.category}
                                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                    className={`w-full rounded-xl px-4 py-3.5 border transition-all focus:outline-none ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white' : 'bg-black/[0.02] border-black/[0.04] text-black'}`}
                                >
                                    <option value="">Select category...</option>
                                    {categories.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
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
