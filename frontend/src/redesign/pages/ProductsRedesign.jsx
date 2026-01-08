import { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'

const ProductsRedesign = () => {
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'
    const fileInputRef = useRef(null)

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [importTab, setImportTab] = useState('csv')
    const [pasteData, setPasteData] = useState('')
    const [usage, setUsage] = useState({ products: 0, maxProducts: 50 })

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

    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.price) {
            alert('Please fill in product name and price')
            return
        }

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
                    image_url: newProduct.image_url
                })
            })
            alert('Product added successfully!')
            await loadProducts()
            setShowAddModal(false)
            setNewProduct({ name: '', price: '', stock: '', category: '', description: '', image_url: '' })
        } catch (error) {
            // Add locally if API fails
            const localProduct = {
                id: Date.now(),
                ...newProduct,
                price: parseFloat(newProduct.price),
                stock: parseInt(newProduct.stock) || 0
            }
            setProducts([...products, localProduct])
            alert('Product added (offline mode)')
            setShowAddModal(false)
            setNewProduct({ name: '', price: '', stock: '', category: '', description: '', image_url: '' })
        } finally {
            setSaving(false)
        }
    }

    const handleEditProduct = async () => {
        if (!editingProduct) return

        setSaving(true)
        try {
            await apiCall(API_ENDPOINTS.UPDATE_PRODUCT(editingProduct.id), {
                method: 'PUT',
                body: JSON.stringify(editingProduct)
            })
            alert('Product updated successfully!')
            await loadProducts()
            setShowEditModal(false)
            setEditingProduct(null)
        } catch (error) {
            setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p))
            alert('Product updated (offline mode)')
            setShowEditModal(false)
            setEditingProduct(null)
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteProduct = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) return

        try {
            await apiCall(API_ENDPOINTS.PRODUCT_BY_ID(productId), {
                method: 'DELETE'
            })
            alert('Product deleted!')
            await loadProducts()
        } catch (error) {
            setProducts(products.filter(p => p.id !== productId))
            alert('Product deleted (offline mode)')
        }
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
        reader.onload = (event) => {
            const csv = event.target.result
            parseAndImportCSV(csv)
        }
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

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#102217]' : 'bg-[#f6f8f7]'}`}>
                <div className="w-10 h-10 border-4 border-[#2bee79] border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen font-['Manrope'] ${isDark ? 'bg-[#102217] text-white' : 'bg-[#f6f8f7] text-[#111814]'}`}>
            <div className="max-w-md mx-auto pb-24">

                {/* Header */}
                <div className={`sticky top-0 z-20 backdrop-blur-sm border-b ${isDark ? 'bg-[#102217]/95 border-gray-800' : 'bg-[#f6f8f7]/95 border-gray-100'}`}>
                    <div className="flex flex-col gap-2 p-4 pb-2">
                        <div className="flex items-center h-8 justify-between">
                            <button onClick={() => navigate('/dashboard')} className="text-2xl">←</button>
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="flex items-center text-[#2bee79] font-bold hover:opacity-80"
                            >
                                Import ↓
                            </button>
                        </div>
                        <div className="flex justify-between items-end">
                            <h1 className="text-[32px] font-extrabold tracking-tight">Products</h1>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-[#2bee79] text-[#102217] rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition-all text-2xl font-bold"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* Slot Usage Banner */}
                <div className="px-4 py-2">
                    <div className={`flex flex-col gap-3 rounded-xl border border-[#2bee79]/20 p-4 shadow-sm ${isDark ? 'bg-[#1c2e24]' : 'bg-white'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-bold">{usage.products}/{usage.maxProducts} Free Slots Used</p>
                                <div className={`w-full rounded-full h-1.5 mt-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                    <div className="bg-[#2bee79] h-1.5 rounded-full transition-all" style={{ width: `${usagePercent}%` }}></div>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/settings')}
                                className="text-xs font-bold text-[#2bee79] flex items-center gap-1 hover:underline"
                            >
                                Upgrade →
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className={`sticky top-[105px] z-10 pb-2 pt-1 ${isDark ? 'bg-[#102217]' : 'bg-[#f6f8f7]'}`}>
                    <div className="px-4 py-2">
                        <div className={`flex items-center rounded-xl h-11 shadow-sm ${isDark ? 'bg-[#1c2e24]' : 'bg-white'}`}>
                            <div className={`pl-4 ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>🔍</div>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`flex-1 bg-transparent border-none focus:outline-none focus:ring-0 px-3 ${isDark ? 'text-white placeholder-[#a0b3aa]' : 'text-[#111814] placeholder-[#618971]'}`}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="pr-3 text-gray-400">✕</button>
                            )}
                        </div>
                    </div>

                    {/* Category Pills */}
                    <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar pb-2">
                        <button
                            onClick={loadProducts}
                            className={`flex h-9 items-center gap-2 rounded-full px-4 shadow-sm border ${isDark ? 'bg-[#1c2e24] border-gray-700' : 'bg-white border-gray-200'}`}
                        >
                            <span className="text-sm font-bold">🔄</span>
                        </button>
                        <div className={`w-px h-6 my-auto ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`flex h-9 items-center rounded-full px-4 shadow-sm transition-colors ${selectedCategory === cat
                                    ? 'bg-[#2bee79] text-[#102217] font-bold'
                                    : isDark
                                        ? 'bg-[#1c2e24] border border-gray-700 text-[#a0b3aa]'
                                        : 'bg-white border border-gray-200 text-[#618971]'
                                    }`}
                            >
                                <span className="text-sm font-medium">{cat}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4">
                        <span className="text-6xl mb-4">📦</span>
                        <p className="text-lg font-bold mb-2">No products found</p>
                        <p className={`text-sm text-center ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>
                            {searchQuery ? 'Try a different search term' : 'Add your first product to get started'}
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-4 bg-[#2bee79] text-[#102217] px-6 py-2 rounded-full font-bold"
                        >
                            + Add Product
                        </button>
                    </div>
                ) : (
                    <div className="p-4 grid grid-cols-2 gap-4">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="flex flex-col gap-2 group">
                                <div className={`relative w-full aspect-square rounded-xl overflow-hidden shadow-sm ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                    {/* Edit/Delete Menu */}
                                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <button
                                            onClick={() => { setEditingProduct({ ...product }); setShowEditModal(true) }}
                                            className="w-7 h-7 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md text-xs"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProduct(product.id)}
                                            className="w-7 h-7 rounded-full bg-red-500/90 backdrop-blur flex items-center justify-center shadow-md text-white text-xs"
                                        >
                                            🗑
                                        </button>
                                    </div>

                                    {/* Product Image */}
                                    <div
                                        className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105 flex items-center justify-center"
                                        style={product.image_url ? { backgroundImage: `url('${product.image_url}')` } : {}}
                                    >
                                        {!product.image_url && <span className="text-4xl">📦</span>}
                                    </div>

                                    {/* Low Stock Badge */}
                                    {product.stock <= 3 && (
                                        <button
                                            onClick={() => handleRestockProduct(product)}
                                            className="absolute top-2 left-2 px-2 py-1 bg-orange-500 rounded text-white text-[10px] font-bold shadow-sm flex items-center gap-1 hover:bg-orange-600"
                                        >
                                            ⚠️ Low Stock - Restock
                                        </button>
                                    )}

                                    {/* Category Badge */}
                                    {product.stock > 3 && (
                                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-white text-[10px] font-bold tracking-wide uppercase">
                                            {product.category}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm font-bold leading-snug line-clamp-2">{product.name}</p>
                                    <p className="text-[#2bee79] text-base font-extrabold mt-0.5">₦ {formatCurrency(product.price)}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className={`w-2 h-2 rounded-full ${product.stock <= 3 ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                                        <button
                                            onClick={() => handleRestockProduct(product)}
                                            className={`text-xs font-medium hover:underline ${product.stock <= 3
                                                ? 'text-orange-500 font-bold'
                                                : isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'
                                                }`}
                                        >
                                            {product.stock <= 3 ? `Only ${product.stock} left` : `${product.stock} in stock`}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)}></div>
                    <div className={`relative w-full max-w-md rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] overflow-hidden ${isDark ? 'bg-[#1c2e24]' : 'bg-white'}`}>
                        <div className="w-full flex justify-center pt-3 pb-1">
                            <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                        </div>

                        <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                            <button onClick={() => setShowAddModal(false)} className="text-red-500 font-medium">Cancel</button>
                            <h3 className="text-lg font-bold">Add Product</h3>
                            <button onClick={handleAddProduct} disabled={saving} className="text-[#2bee79] font-bold disabled:opacity-50">
                                {saving ? '...' : 'Save'}
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-5 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-bold mb-1 ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>Product Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Ankara Fabric Pattern A"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        className={`w-full rounded-lg px-4 py-3 font-medium border-0 focus:ring-2 focus:ring-[#2bee79] ${isDark ? 'bg-[#102217] text-white placeholder-gray-500' : 'bg-[#f6f8f7] text-[#111814] placeholder-gray-400'}`}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-bold mb-1 ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>Price (₦) *</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={newProduct.price}
                                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                            className={`w-full rounded-lg px-4 py-3 font-medium border-0 focus:ring-2 focus:ring-[#2bee79] ${isDark ? 'bg-[#102217] text-white placeholder-gray-500' : 'bg-[#f6f8f7] text-[#111814] placeholder-gray-400'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-bold mb-1 ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>Stock</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={newProduct.stock}
                                            onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                            className={`w-full rounded-lg px-4 py-3 font-medium border-0 focus:ring-2 focus:ring-[#2bee79] ${isDark ? 'bg-[#102217] text-white placeholder-gray-500' : 'bg-[#f6f8f7] text-[#111814] placeholder-gray-400'}`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-sm font-bold mb-1 ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>Category</label>
                                    <select
                                        value={newProduct.category}
                                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                        className={`w-full rounded-lg px-4 py-3 font-medium border-0 focus:ring-2 focus:ring-[#2bee79] ${isDark ? 'bg-[#102217] text-white' : 'bg-[#f6f8f7] text-[#111814]'}`}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.filter(c => c !== 'All').map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className={`block text-sm font-bold mb-1 ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>Description</label>
                                    <textarea
                                        placeholder="Enter product description..."
                                        rows="3"
                                        value={newProduct.description}
                                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                        className={`w-full rounded-lg px-4 py-3 font-medium border-0 focus:ring-2 focus:ring-[#2bee79] resize-none ${isDark ? 'bg-[#102217] text-white placeholder-gray-500' : 'bg-[#f6f8f7] text-[#111814] placeholder-gray-400'}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {showEditModal && editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className={`w-full max-w-sm rounded-2xl p-6 ${isDark ? 'bg-[#1c2e24]' : 'bg-white'}`}>
                        <h3 className="text-lg font-bold mb-4">Edit Product</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Product Name"
                                value={editingProduct.name}
                                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                className={`w-full p-3 rounded-lg ${isDark ? 'bg-[#102217]' : 'bg-gray-50'}`}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="number"
                                    placeholder="Price"
                                    value={editingProduct.price}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                                    className={`w-full p-3 rounded-lg ${isDark ? 'bg-[#102217]' : 'bg-gray-50'}`}
                                />
                                <input
                                    type="number"
                                    placeholder="Stock"
                                    value={editingProduct.stock}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                                    className={`w-full p-3 rounded-lg ${isDark ? 'bg-[#102217]' : 'bg-gray-50'}`}
                                />
                            </div>
                            <select
                                value={editingProduct.category}
                                onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                className={`w-full p-3 rounded-lg ${isDark ? 'bg-[#102217]' : 'bg-gray-50'}`}
                            >
                                {categories.filter(c => c !== 'All').map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowEditModal(false); setEditingProduct(null) }}
                                className={`flex-1 py-2 rounded-lg font-bold border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditProduct}
                                disabled={saving}
                                className="flex-1 py-2 rounded-lg font-bold bg-[#2bee79] text-[#052e16] disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowImportModal(false)}></div>
                    <div className={`relative w-full max-w-md rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] overflow-hidden ${isDark ? 'bg-[#1c2e24]' : 'bg-white'}`}>
                        <div className="w-full flex justify-center pt-3 pb-1">
                            <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                        </div>

                        <div className="px-6 py-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold">Import Products</h3>
                            <button
                                onClick={() => setShowImportModal(false)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="px-4 pb-2">
                            <div className={`flex p-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                {['csv', 'paste'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setImportTab(tab)}
                                        className={`flex-1 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${importTab === tab
                                            ? `shadow ${isDark ? 'bg-gray-700 text-white' : 'bg-white text-[#111814]'} font-bold`
                                            : isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 flex flex-col items-center justify-center gap-4 text-center">
                            {importTab === 'csv' && (
                                <>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        ref={fileInputRef}
                                        onChange={handleCSVUpload}
                                        className="hidden"
                                    />
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#2bee79] transition-colors ${isDark ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-green-900/30' : 'bg-green-100'}`}>
                                            <span className="text-2xl text-[#2bee79]">📤</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Click to upload CSV</p>
                                            <p className={`text-xs ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>or drag and drop here</p>
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
                                    className={`w-full rounded-xl p-4 text-sm font-mono ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}
                                />
                            )}

                            <div className="w-full flex items-center gap-2 mt-2">
                                <div className={`h-px flex-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                <span className={`text-xs font-semibold uppercase ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>Templates</span>
                                <div className={`h-px flex-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                            </div>

                            <button
                                onClick={downloadTemplate}
                                className="flex items-center gap-2 text-sm font-semibold text-[#2bee79] hover:underline"
                            >
                                ⬇ Download Template
                            </button>

                            <button
                                onClick={importTab === 'paste' ? handlePasteImport : () => fileInputRef.current?.click()}
                                className="w-full mt-4 py-3 bg-[#2bee79] text-[#102217] rounded-lg font-bold shadow-lg hover:opacity-90 transition-colors"
                            >
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
