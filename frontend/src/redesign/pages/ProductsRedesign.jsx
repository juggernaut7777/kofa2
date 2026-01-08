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
    const [showImportModal, setShowImportModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showProductDetail, setShowProductDetail] = useState(null)
    const [editingProduct, setEditingProduct] = useState(null)
    const [importTab, setImportTab] = useState('csv')
    const [pasteData, setPasteData] = useState('')
    const [usage, setUsage] = useState({ products: 0, maxProducts: 50 })
    const [imagePreview, setImagePreview] = useState(null)
    const [selectedImage, setSelectedImage] = useState(null)

    const [newProduct, setNewProduct] = useState({
        name: '',
        price: '',
        stock: '',
        category: '',
        description: '',
        image_url: ''
    })

    const categories = ['All', 'Textiles', 'Electronics', 'Beauty', 'Fashion', 'Food', 'Services']

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        setLoading(true)
        try {
            const data = await apiCall(API_ENDPOINTS.PRODUCTS)
            const productsList = Array.isArray(data) ? data : []
            setProducts(productsList)
            setUsage({ products: productsList.length, maxProducts: 50 })
        } catch (error) {
            console.log('Using demo products')
            setProducts([
                { id: 1, name: 'Ankara Fabric Pattern B', price: 5000, stock: 12, category: 'Textiles', image_url: null },
                { id: 2, name: 'Eau de Parfum - Rose Gold', price: 25000, stock: 2, category: 'Beauty', image_url: null },
                { id: 3, name: 'Wireless Headphones Pro', price: 45000, stock: 8, category: 'Electronics', image_url: null },
                { id: 4, name: 'Red Sport Sneaker', price: 32000, stock: 5, category: 'Fashion', image_url: null },
            ])
            setUsage({ products: 12, maxProducts: 50 })
        } finally {
            setLoading(false)
        }
    }

    const handleImageSelect = (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB')
            return
        }

        setSelectedImage(file)
        const reader = new FileReader()
        reader.onload = (e) => setImagePreview(e.target.result)
        reader.readAsDataURL(file)
    }

    const uploadImage = async (productId) => {
        if (!selectedImage) return null

        try {
            const formData = new FormData()
            formData.append('file', selectedImage)

            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPLOAD_PRODUCT_IMAGE(productId)}`, {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const data = await response.json()
                return data.image_url
            }
        } catch (error) {
            console.log('Image upload failed, using base64')
            return imagePreview
        }
        return imagePreview
    }

    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.price) {
            alert('Please fill in product name and price')
            return
        }

        setSaving(true)
        try {
            const result = await apiCall(API_ENDPOINTS.CREATE_PRODUCT, {
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

            if (selectedImage && result.id) {
                await uploadImage(result.id)
            }

            alert('Product added successfully!')
            await loadProducts()
            resetForm()
        } catch (error) {
            const localProduct = {
                id: Date.now(),
                ...newProduct,
                price: parseFloat(newProduct.price),
                stock: parseInt(newProduct.stock) || 0,
                image_url: imagePreview
            }
            setProducts([...products, localProduct])
            alert('Product added (offline mode)')
            resetForm()
        } finally {
            setSaving(false)
        }
    }

    const resetForm = () => {
        setShowAddModal(false)
        setNewProduct({ name: '', price: '', stock: '', category: '', description: '', image_url: '' })
        setImagePreview(null)
        setSelectedImage(null)
    }

    const handleEditProduct = async () => {
        if (!editingProduct) return

        setSaving(true)
        try {
            await apiCall(API_ENDPOINTS.UPDATE_PRODUCT(editingProduct.id), {
                method: 'PUT',
                body: JSON.stringify({
                    ...editingProduct,
                    image_url: imagePreview || editingProduct.image_url
                })
            })

            if (selectedImage) {
                await uploadImage(editingProduct.id)
            }

            alert('Product updated successfully!')
            await loadProducts()
            setShowEditModal(false)
            setEditingProduct(null)
            setImagePreview(null)
            setSelectedImage(null)
        } catch (error) {
            setProducts(products.map(p => p.id === editingProduct.id ? { ...editingProduct, image_url: imagePreview || editingProduct.image_url } : p))
            alert('Product updated (offline mode)')
            setShowEditModal(false)
            setEditingProduct(null)
            setImagePreview(null)
            setSelectedImage(null)
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteProduct = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) return

        try {
            await apiCall(API_ENDPOINTS.DELETE_PRODUCT(productId), { method: 'DELETE' })
            alert('Product deleted!')
            await loadProducts()
        } catch (error) {
            setProducts(products.filter(p => p.id !== productId))
            alert('Product deleted (offline mode)')
        }
        setShowProductDetail(null)
    }

    const handleRestockProduct = async (product) => {
        const quantity = prompt(`Add stock for ${product.name}. Current: ${product.stock}`, '10')
        if (!quantity) return

        const addQty = parseInt(quantity)
        if (isNaN(addQty) || addQty <= 0) {
            alert('Please enter a valid quantity')
            return
        }

        try {
            await apiCall(API_ENDPOINTS.RESTOCK_PRODUCT(product.id), {
                method: 'POST',
                body: JSON.stringify({ quantity: addQty })
            })
            await loadProducts()
            alert(`Added ${addQty} units to ${product.name}`)
        } catch (error) {
            setProducts(products.map(p =>
                p.id === product.id ? { ...p, stock: p.stock + addQty } : p
            ))
            alert(`Stock updated (offline mode)`)
        }
    }

    const handleCSVUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => parseAndImportCSV(event.target.result)
        reader.readAsText(file)
    }

    const parseAndImportCSV = (csv) => {
        const lines = csv.split('\n').filter(line => line.trim())
        if (lines.length < 2) {
            alert('CSV must have a header row and at least one product')
            return
        }

        const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
        const nameIdx = headers.findIndex(h => h.includes('name'))
        const priceIdx = headers.findIndex(h => h.includes('price'))
        const stockIdx = headers.findIndex(h => h.includes('stock') || h.includes('quantity'))
        const categoryIdx = headers.findIndex(h => h.includes('category'))

        if (nameIdx === -1 || priceIdx === -1) {
            alert('CSV must have "name" and "price" columns')
            return
        }

        const newProducts = []
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim())
            if (cols[nameIdx]) {
                newProducts.push({
                    id: Date.now() + i,
                    name: cols[nameIdx],
                    price: parseFloat(cols[priceIdx]) || 0,
                    stock: parseInt(cols[stockIdx]) || 0,
                    category: cols[categoryIdx] || 'General',
                    image_url: null
                })
            }
        }

        if (newProducts.length > 0) {
            setProducts([...products, ...newProducts])
            setShowImportModal(false)
            alert(`Imported ${newProducts.length} products!`)
        }
    }

    const handlePasteImport = () => {
        if (!pasteData.trim()) {
            alert('Please paste product data')
            return
        }
        parseAndImportCSV(pasteData)
        setPasteData('')
    }

    const downloadTemplate = () => {
        const template = 'name,price,stock,category\nSample Product 1,5000,10,Textiles\nSample Product 2,15000,5,Electronics'
        const blob = new Blob([template], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'products_template.csv'
        a.click()
        URL.revokeObjectURL(url)
    }

    const formatCurrency = (amount) => {
        if (!amount) return '0'
        return new Intl.NumberFormat('en-NG', { minimumFractionDigits: 0 }).format(amount)
    }

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const usagePercent = (usage.products / usage.maxProducts) * 100

    const getCategoryIcon = (cat) => {
        const icons = { Textiles: '🧵', Electronics: '📱', Beauty: '💄', Fashion: '👟', Food: '🍔', Services: '🛠️' }
        return icons[cat] || '📦'
    }

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a1a10]' : 'bg-gradient-to-br from-gray-50 to-green-50'}`}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-[#2bee79] border-t-transparent rounded-full animate-spin"></div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading products...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen font-['Manrope'] ${isDark ? 'bg-[#0a1a10] text-white' : 'bg-gradient-to-br from-gray-50 to-green-50 text-[#111814]'}`}>
            <div className="max-w-md mx-auto pb-24">

                {/* Premium Header */}
                <div className={`sticky top-0 z-20 backdrop-blur-xl border-b ${isDark ? 'bg-[#0a1a10]/90 border-white/10' : 'bg-white/80 border-gray-100'}`}>
                    <div className="flex flex-col gap-3 p-4 pb-3">
                        <div className="flex items-center justify-between">
                            <button onClick={() => navigate('/dashboard')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                <span className="text-lg">←</span>
                            </button>
                            <div className="flex items-center gap-2">
                                <button onClick={loadProducts} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                    <span className="text-lg">🔄</span>
                                </button>
                                <button onClick={() => setShowImportModal(true)} className={`px-4 h-10 rounded-xl flex items-center gap-2 font-bold transition-all hover:scale-105 ${isDark ? 'bg-[#2bee79]/20 text-[#2bee79]' : 'bg-green-100 text-green-700'}`}>
                                    <span>↓</span>
                                    <span className="text-sm">Import</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#2bee79] to-emerald-400 bg-clip-text text-transparent">Products</h1>
                                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{products.length} items in catalog</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-gradient-to-r from-[#2bee79] to-emerald-400 text-[#052e16] rounded-2xl w-14 h-14 flex items-center justify-center shadow-lg shadow-[#2bee79]/30 hover:shadow-[#2bee79]/50 hover:scale-105 active:scale-95 transition-all text-2xl font-bold"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* Slot Usage Banner - Premium */}
                <div className="px-4 py-3">
                    <div className={`flex items-center gap-4 rounded-2xl p-4 border ${isDark ? 'bg-gradient-to-r from-[#1a2c22] to-[#0f1f14] border-[#2bee79]/20' : 'bg-gradient-to-r from-white to-green-50 border-green-100 shadow-sm'}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${isDark ? 'bg-[#2bee79]/10' : 'bg-green-100'}`}>
                            📦
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-bold">{usage.products} / {usage.maxProducts} slots</p>
                                <span className={`text-xs font-bold ${usagePercent > 80 ? 'text-orange-500' : 'text-[#2bee79]'}`}>{Math.round(usagePercent)}%</span>
                            </div>
                            <div className={`w-full rounded-full h-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                                <div className={`h-2 rounded-full transition-all ${usagePercent > 80 ? 'bg-orange-500' : 'bg-gradient-to-r from-[#2bee79] to-emerald-400'}`} style={{ width: `${usagePercent}%` }}></div>
                            </div>
                        </div>
                        <button onClick={() => navigate('/settings')} className="text-[#2bee79] text-xs font-bold hover:underline">
                            Upgrade
                        </button>
                    </div>
                </div>

                {/* Search & Filter - Premium */}
                <div className={`sticky top-[120px] z-10 ${isDark ? 'bg-[#0a1a10]/95' : 'bg-white/95'} backdrop-blur-xl pb-2`}>
                    <div className="px-4 py-2">
                        <div className={`flex items-center rounded-2xl h-12 shadow-sm border transition-all focus-within:ring-2 focus-within:ring-[#2bee79]/50 ${isDark ? 'bg-[#1a2c22] border-white/10' : 'bg-white border-gray-100'}`}>
                            <div className="pl-4 text-lg">🔍</div>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`flex-1 bg-transparent border-none focus:outline-none focus:ring-0 px-3 text-sm ${isDark ? 'text-white placeholder-gray-500' : 'text-[#111814] placeholder-gray-400'}`}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="pr-4 text-gray-400 hover:text-gray-600">✕</button>
                            )}
                        </div>
                    </div>

                    {/* Category Pills - Premium */}
                    <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar py-1">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`flex h-10 items-center gap-2 rounded-xl px-4 shadow-sm transition-all whitespace-nowrap ${selectedCategory === cat
                                    ? 'bg-gradient-to-r from-[#2bee79] to-emerald-400 text-[#052e16] font-bold shadow-md'
                                    : isDark
                                        ? 'bg-[#1a2c22] border border-white/10 text-gray-400 hover:border-[#2bee79]/50'
                                        : 'bg-white border border-gray-200 text-gray-500 hover:border-green-300'
                                    }`}
                            >
                                {cat !== 'All' && <span>{getCategoryIcon(cat)}</span>}
                                <span className="text-sm font-medium">{cat}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid - Premium Cards */}
                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4">
                        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-4 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <span className="text-5xl">📦</span>
                        </div>
                        <p className="text-xl font-bold mb-2">No products found</p>
                        <p className={`text-sm text-center mb-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {searchQuery ? 'Try a different search term' : 'Add your first product to get started'}
                        </p>
                        <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-[#2bee79] to-emerald-400 text-[#052e16] px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">
                            + Add Product
                        </button>
                    </div>
                ) : (
                    <div className="p-4 grid grid-cols-2 gap-4">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => setShowProductDetail(product)}
                                className={`flex flex-col rounded-2xl overflow-hidden shadow-sm border cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${isDark ? 'bg-[#1a2c22] border-white/10' : 'bg-white border-gray-100'}`}
                            >
                                {/* Product Image */}
                                <div className={`relative w-full aspect-square overflow-hidden ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-100 to-gray-50'}`}>
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-5xl opacity-30">{getCategoryIcon(product.category)}</span>
                                        </div>
                                    )}

                                    {/* Stock Badge */}
                                    {product.stock <= 3 && (
                                        <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-white text-[10px] font-bold shadow-sm">
                                            ⚠️ Low Stock
                                        </div>
                                    )}

                                    {/* Category Badge */}
                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-white text-[10px] font-bold uppercase">
                                        {product.category}
                                    </div>
                                </div>

                                {/* Product Info */}
                                <div className="p-3">
                                    <p className="text-sm font-bold leading-tight line-clamp-2 mb-1">{product.name}</p>
                                    <p className="text-lg font-black text-[#2bee79]">₦{formatCurrency(product.price)}</p>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <span className={`w-2 h-2 rounded-full ${product.stock <= 3 ? 'bg-orange-500 animate-pulse' : 'bg-[#2bee79]'}`}></span>
                                        <p className={`text-xs font-medium ${product.stock <= 3 ? 'text-orange-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {product.stock <= 3 ? `Only ${product.stock} left` : `${product.stock} in stock`}
                                        </p>
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
                    <div className={`relative w-full max-w-md rounded-t-3xl overflow-hidden ${isDark ? 'bg-[#0a1a10]' : 'bg-white'}`}>
                        {/* Product Image */}
                        <div className={`relative h-56 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            {showProductDetail.image_url ? (
                                <img src={showProductDetail.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-6xl opacity-30">{getCategoryIcon(showProductDetail.category)}</span>
                                </div>
                            )}
                            <button onClick={() => setShowProductDetail(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white">
                                ✕
                            </button>
                        </div>

                        {/* Product Info */}
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>{showProductDetail.category}</span>
                                    <h2 className="text-xl font-bold mt-2">{showProductDetail.name}</h2>
                                </div>
                                <p className="text-2xl font-black text-[#2bee79]">₦{formatCurrency(showProductDetail.price)}</p>
                            </div>

                            <div className="flex items-center gap-2 mb-6">
                                <span className={`w-3 h-3 rounded-full ${showProductDetail.stock <= 3 ? 'bg-orange-500' : 'bg-[#2bee79]'}`}></span>
                                <p className={`font-medium ${showProductDetail.stock <= 3 ? 'text-orange-500' : ''}`}>
                                    {showProductDetail.stock} in stock
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => { setEditingProduct({ ...showProductDetail }); setImagePreview(showProductDetail.image_url); setShowEditModal(true); setShowProductDetail(null) }}
                                    className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}
                                >
                                    <span className="text-xl">✏️</span>
                                    <span className="text-xs font-bold">Edit</span>
                                </button>
                                <button
                                    onClick={() => handleRestockProduct(showProductDetail)}
                                    className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${isDark ? 'bg-[#2bee79]/10 hover:bg-[#2bee79]/20' : 'bg-green-100 hover:bg-green-200'}`}
                                >
                                    <span className="text-xl">📦</span>
                                    <span className="text-xs font-bold text-[#2bee79]">Restock</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteProduct(showProductDetail.id)}
                                    className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${isDark ? 'bg-red-500/10 hover:bg-red-500/20' : 'bg-red-100 hover:bg-red-200'}`}
                                >
                                    <span className="text-xl">🗑️</span>
                                    <span className="text-xs font-bold text-red-500">Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Product Modal - Premium */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { resetForm() }}></div>
                    <div className={`relative w-full max-w-md rounded-t-3xl shadow-2xl overflow-hidden ${isDark ? 'bg-[#0a1a10]' : 'bg-white'}`}>
                        <div className="w-full flex justify-center pt-3 pb-1">
                            <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-white/20' : 'bg-gray-300'}`}></div>
                        </div>

                        <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                            <button onClick={() => resetForm()} className="text-red-500 font-medium">Cancel</button>
                            <h3 className="text-lg font-bold">New Product</h3>
                            <button onClick={handleAddProduct} disabled={saving} className="text-[#2bee79] font-bold disabled:opacity-50">
                                {saving ? '...' : 'Save'}
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-5 max-h-[60vh] overflow-y-auto">
                            {/* Image Upload - Premium */}
                            <div className="flex justify-center">
                                <input type="file" ref={imageInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                                <button
                                    onClick={() => imageInputRef.current?.click()}
                                    className={`w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all hover:border-[#2bee79] hover:scale-105 overflow-hidden ${isDark ? 'border-white/20 bg-white/5' : 'border-gray-300 bg-gray-50'}`}
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

                            {/* Form Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Product Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Ankara Fabric Pattern A"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        className={`w-full rounded-xl px-4 py-3.5 font-medium border focus:ring-2 focus:ring-[#2bee79] focus:border-transparent transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-[#111814] placeholder-gray-400'}`}
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
                                            className={`w-full rounded-xl px-4 py-3.5 font-medium border focus:ring-2 focus:ring-[#2bee79] focus:border-transparent transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-[#111814]'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Stock</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={newProduct.stock}
                                            onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                            className={`w-full rounded-xl px-4 py-3.5 font-medium border focus:ring-2 focus:ring-[#2bee79] focus:border-transparent transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-[#111814]'}`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Category</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {categories.filter(c => c !== 'All').map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setNewProduct({ ...newProduct, category: cat })}
                                                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${newProduct.category === cat
                                                    ? 'bg-[#2bee79] text-[#052e16]'
                                                    : isDark ? 'bg-white/5' : 'bg-gray-100'
                                                    }`}
                                            >
                                                <span className="text-lg">{getCategoryIcon(cat)}</span>
                                                <span className="text-[10px] font-bold">{cat}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Description</label>
                                    <textarea
                                        placeholder="Product description..."
                                        rows="3"
                                        value={newProduct.description}
                                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                        className={`w-full rounded-xl px-4 py-3.5 font-medium border focus:ring-2 focus:ring-[#2bee79] focus:border-transparent resize-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-[#111814] placeholder-gray-400'}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {showEditModal && editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className={`w-full max-w-sm rounded-2xl p-6 ${isDark ? 'bg-[#0a1a10]' : 'bg-white'}`}>
                        <h3 className="text-lg font-bold mb-4">Edit Product</h3>

                        {/* Image Upload */}
                        <div className="flex justify-center mb-4">
                            <input type="file" ref={imageInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                            <button onClick={() => imageInputRef.current?.click()} className={`w-24 h-24 rounded-xl border-2 border-dashed overflow-hidden ${isDark ? 'border-white/20' : 'border-gray-300'}`}>
                                {imagePreview || editingProduct.image_url ? (
                                    <img src={imagePreview || editingProduct.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl">📷</span>
                                )}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Product Name"
                                value={editingProduct.name}
                                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="number"
                                    placeholder="Price"
                                    value={editingProduct.price}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                                    className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}
                                />
                                <input
                                    type="number"
                                    placeholder="Stock"
                                    value={editingProduct.stock}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                                    className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}
                                />
                            </div>
                            <select
                                value={editingProduct.category}
                                onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}
                            >
                                {categories.filter(c => c !== 'All').map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setShowEditModal(false); setEditingProduct(null); setImagePreview(null); setSelectedImage(null) }} className={`flex-1 py-3 rounded-xl font-bold border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                Cancel
                            </button>
                            <button onClick={handleEditProduct} disabled={saving} className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-[#2bee79] to-emerald-400 text-[#052e16] disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal - Premium */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowImportModal(false)}></div>
                    <div className={`relative w-full max-w-md rounded-t-3xl shadow-2xl overflow-hidden ${isDark ? 'bg-[#0a1a10]' : 'bg-white'}`}>
                        <div className="w-full flex justify-center pt-3 pb-1">
                            <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-white/20' : 'bg-gray-300'}`}></div>
                        </div>

                        <div className="px-6 py-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold">Import Products</h3>
                            <button onClick={() => setShowImportModal(false)} className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                ✕
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="px-4 pb-2">
                            <div className={`flex p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                {['csv', 'paste'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setImportTab(tab)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${importTab === tab
                                            ? `shadow ${isDark ? 'bg-[#1a2c22] text-white' : 'bg-white text-[#111814]'} font-bold`
                                            : isDark ? 'text-gray-500' : 'text-gray-400'
                                            }`}
                                    >
                                        {tab === 'csv' ? '📄 CSV File' : '📋 Paste Data'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 flex flex-col items-center justify-center gap-4 text-center">
                            {importTab === 'csv' && (
                                <>
                                    <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCSVUpload} className="hidden" />
                                    <div onClick={() => fileInputRef.current?.click()} className={`w-full h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:border-[#2bee79] ${isDark ? 'border-white/20 bg-white/5' : 'border-gray-300 bg-gray-50'}`}>
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#2bee79]/10' : 'bg-green-100'}`}>
                                            <span className="text-2xl text-[#2bee79]">📤</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Click to upload CSV</p>
                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>or drag and drop here</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {importTab === 'paste' && (
                                <textarea
                                    placeholder="Paste CSV data here...&#10;name,price,stock,category&#10;Product 1,5000,10,Textiles"
                                    rows="8"
                                    value={pasteData}
                                    onChange={(e) => setPasteData(e.target.value)}
                                    className={`w-full rounded-2xl p-4 text-sm font-mono border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}
                                />
                            )}

                            <button onClick={downloadTemplate} className="flex items-center gap-2 text-sm font-semibold text-[#2bee79] hover:underline">
                                ⬇ Download Template
                            </button>

                            <button onClick={importTab === 'paste' ? handlePasteImport : () => fileInputRef.current?.click()} className="w-full py-3.5 bg-gradient-to-r from-[#2bee79] to-emerald-400 text-[#052e16] rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">
                                Import Products
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
