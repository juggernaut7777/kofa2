import { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
    const location = useLocation()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'
    const imageInputRef = useRef(null)

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
    const [showAddModal, setShowAddModal] = useState(false)
    const [showProductDetail, setShowProductDetail] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [selectedImage, setSelectedImage] = useState(null)

    const [newProduct, setNewProduct] = useState({
        name: '', price: '', stock: '', category: '', description: ''
    })

    const categories = ['All', 'Textiles', 'Electronics', 'Beauty', 'Fashion', 'Food', 'Other']

    useEffect(() => { loadProducts() }, [])

    // Handle Deep Link Action
    useEffect(() => {
        if (location.state?.action === 'add') {
            setShowAddModal(true)
            // Clear state
            navigate(location.pathname, { replace: true, state: {} })
        }
    }, [location, navigate])

    const loadProducts = async () => {
        setLoading(true)
        try {
            const data = await apiCall(API_ENDPOINTS.PRODUCTS)
            // Normalize product data - backend uses price_ngn and stock_level
            const normalized = (Array.isArray(data) ? data : []).map(p => ({
                ...p,
                price: p.price_ngn || p.price || p.selling_price || p.unit_price || p.amount || 0,
                stock: p.stock_level ?? p.stock ?? p.quantity ?? p.inventory ?? 0,
                category: p.category || p.type || 'General'
            }))
            setProducts(normalized)
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
        if (n == null || isNaN(n)) return '₦0'
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
                    image_url: imagePreview // In real app, upload first then send URL
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

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0a14]' : 'bg-[#fafaff]'}`}>
                <div className="relative w-16 h-16">
                    <div className={`absolute inset-0 rounded-full border-2 border-[${colors.lavender}]/30`}></div>
                    <div className={`absolute inset-0 rounded-full border-2 border-transparent border-t-[${colors.violet}] animate-spin`}></div>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen font-['SF_Pro_Display',-apple-system,sans-serif] ${isDark ? 'bg-[#0a0a14]' : 'bg-[#fafaff]'}`}>

            {/* Ambient Gradient */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-20 -left-20 w-60 h-60 rounded-full blur-[100px] ${isDark ? `bg-[${colors.violet}]/20` : `bg-[${colors.lavender}]/20`}`}></div>
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

                        {/* View Toggle */}
                        <div className={`flex items-center p-1 rounded-xl ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow text-black' : 'text-gray-400'}`}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            </button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-black' : 'text-gray-400'}`}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <h1 className={`text-3xl font-bold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Products</h1>
                            <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>{filteredProducts.length} items in stock</p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-transform hover:scale-105"
                            style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}
                        >
                            + New
                        </button>
                    </div>

                    {/* Search & Categories */}
                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search inventory..."
                                className={`w-full h-12 pl-12 pr-4 rounded-xl transition-all focus:outline-none ${isDark ? 'bg-white/5 text-white placeholder-white/30 focus:bg-white/10' : 'bg-black/5 text-black placeholder-black/30 focus:bg-black/10'}`}
                            />
                            <svg className={`absolute left-4 top-3.5 w-5 h-5 ${isDark ? 'text-white/30' : 'text-black/30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat ? 'text-white' : isDark ? 'bg-white/5 text-white/50' : 'bg-black/5 text-black/50'}`}
                                    style={selectedCategory === cat ? { background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` } : {}}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="px-6 pb-6">
                    {filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <span className="text-4xl mb-3">🔍</span>
                            <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>No products found</p>
                        </div>
                    ) : (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 gap-4">
                                {filteredProducts.map(product => (
                                    <div key={product.id} className={`group relative rounded-2xl overflow-hidden aspect-[4/5] ${isDark ? 'bg-white/[0.03]' : 'bg-black/[0.03]'}`}>
                                        <div className="absolute inset-0 bg-gray-200">
                                            {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />}
                                        </div>
                                        <div className={`absolute inset-x-0 bottom-0 p-3 backdrop-blur-md transition-all ${isDark ? 'bg-black/60' : 'bg-white/80'}`}>
                                            <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-black'}`}>{product.name}</p>
                                            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>{formatCurrency(product.price)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredProducts.map(product => (
                                    <div key={product.id} className={`flex items-center gap-4 p-3 rounded-2xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                                        <div className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                                            {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-black'}`}>{product.name}</p>
                                            <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>{product.category} • {product.stock} left</p>
                                        </div>
                                        <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{formatCurrency(product.price)}</span>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>

            </div>

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetForm}></div>
                    <div className={`relative w-full max-w-md h-[85vh] rounded-t-3xl overflow-hidden flex flex-col ${isDark ? 'bg-[#151520]' : 'bg-white'}`}>
                        <div className="w-full flex justify-center pt-3 pb-2 flex-shrink-0">
                            <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-white/20' : 'bg-black/20'}`}></div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 pb-6">
                            <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>New Product</h3>

                            <div className="space-y-6">
                                {/* Image Upload */}
                                <div
                                    onClick={() => imageInputRef.current?.click()}
                                    className={`relative aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${imagePreview
                                        ? 'border-transparent'
                                        : isDark ? 'border-white/20 hover:border-white/40 bg-white/5' : 'border-black/20 hover:border-black/40 bg-black/5'
                                        }`}
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <svg className={`w-8 h-8 mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            <span className={`text-xs font-semibold ${isDark ? 'text-white/40' : 'text-black/40'}`}>Tap to upload image</span>
                                        </>
                                    )}
                                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Name</label>
                                        <input type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className={`w-full rounded-xl px-4 py-3 border transition-all focus:outline-none ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white' : 'bg-black/[0.02] border-black/[0.04] text-black'}`} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Price (₦)</label>
                                            <input type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className={`w-full rounded-xl px-4 py-3 border transition-all focus:outline-none ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white' : 'bg-black/[0.02] border-black/[0.04] text-black'}`} />
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Stock</label>
                                            <input type="number" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} className={`w-full rounded-xl px-4 py-3 border transition-all focus:outline-none ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white' : 'bg-black/[0.02] border-black/[0.04] text-black'}`} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Category</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {categories.filter(c => c !== 'All').map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setNewProduct({ ...newProduct, category: cat })}
                                                    className={`py-2 rounded-lg text-xs font-medium transition-all ${newProduct.category === cat ? 'bg-indigo-500 text-white' : isDark ? 'bg-white/5 text-white/60' : 'bg-black/5 text-black/60'}`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Description</label>
                                        <textarea rows="3" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className={`w-full rounded-xl px-4 py-3 border transition-all focus:outline-none resize-none ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white' : 'bg-black/[0.02] border-black/[0.04] text-black'}`}></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`p-6 border-t ${isDark ? 'border-white/10' : 'border-black/5'} bg-inherit`}>
                            <button
                                onClick={handleAddProduct}
                                disabled={saving}
                                className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50"
                                style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}
                            >
                                {saving ? 'Creating Product...' : 'Create Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    )
}

export default ProductsRedesign
