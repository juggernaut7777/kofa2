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
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444'
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
    const [showAddModal, setShowAddModal] = useState(false)
    const [showRestockModal, setShowRestockModal] = useState(null)
    const [editProduct, setEditProduct] = useState(null)
    const [selectedProducts, setSelectedProducts] = useState([])
    const [imagePreview, setImagePreview] = useState(null)
    const [selectedImage, setSelectedImage] = useState(null)
    const [sortBy, setSortBy] = useState('name') // name, stock, price

    const [newProduct, setNewProduct] = useState({
        name: '', price: '', stock: '', category: '', description: '', sku: ''
    })

    const [restockAmount, setRestockAmount] = useState('')

    const categories = ['All', 'General', 'Supplies', 'Equipment', 'Materials', 'Other']

    useEffect(() => { loadProducts() }, [])

    useEffect(() => {
        if (location.state?.action === 'add') {
            setShowAddModal(true)
            navigate(location.pathname, { replace: true, state: {} })
        }
    }, [location, navigate])

    const loadProducts = async () => {
        setLoading(true)
        try {
            const data = await apiCall(API_ENDPOINTS.PRODUCTS)
            const normalized = (Array.isArray(data) ? data : []).map(p => ({
                ...p,
                price: p.price_ngn || p.price || p.selling_price || p.unit_price || p.amount || 0,
                stock: p.stock_level ?? p.stock ?? p.quantity ?? p.inventory ?? 0,
                category: p.category || p.type || 'General',
                sku: p.sku || p.product_id || p.id
            }))
            setProducts(normalized)
        } catch (e) {
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (n) => {
        if (n == null || isNaN(n)) return '₦0'
        return `₦${n.toLocaleString()}`
    }

    const getStockStatus = (stock) => {
        if (stock === 0) return { label: 'Out of Stock', color: colors.danger, bg: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
        if (stock < 10) return { label: 'Low Stock', color: colors.warning, bg: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.1)' }
        return { label: 'In Stock', color: colors.success, bg: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)' }
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
                    sku: newProduct.sku || `SKU${Date.now()}`
                })
            })
            setShowAddModal(false)
            setNewProduct({ name: '', price: '', stock: '', category: '', description: '', sku: '' })
            setImagePreview(null)
            loadProducts()
        } catch (e) {
            alert('Failed to add product')
        } finally {
            setSaving(false)
        }
    }

    const handleRestock = async () => {
        if (!restockAmount || restockAmount <= 0) { alert('Enter valid amount'); return }
        setSaving(true)
        try {
            await apiCall(API_ENDPOINTS.RESTOCK_PRODUCT(showRestockModal.id), {
                method: 'POST',
                body: JSON.stringify({ quantity: parseInt(restockAmount) })
            })
            setShowRestockModal(null)
            setRestockAmount('')
            loadProducts()
        } catch (e) {
            alert('Failed to restock')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this product?')) return
        try {
            await apiCall(API_ENDPOINTS.DELETE_PRODUCT(id), { method: 'DELETE' })
            loadProducts()
        } catch (e) {
            alert('Failed to delete')
        }
    }

    const filteredProducts = products
        .filter(p => selectedCategory === 'All' || p.category === selectedCategory)
        .filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'stock') return a.stock - b.stock
            if (sortBy === 'price') return b.price - a.price
            return a.name?.localeCompare(b.name)
        })

    const lowStockCount = products.filter(p => p.stock > 0 && p.stock < 10).length
    const outOfStockCount = products.filter(p => p.stock === 0).length

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '700', color: isDark ? '#FFF' : '#1F2937', margin: 0 }}>
                            Inventory Management
                        </h1>
                        <p style={{ fontSize: '14px', color: colors.muted, margin: '4px 0 0 0' }}>
                            Manage your product stock levels and pricing
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})`,
                            color: '#FFF',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: `0 4px 12px ${colors.violet}33`,
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                    >
                        <span style={{ fontSize: '18px' }}>+</span> Add Product
                    </button>
                </div>

                {/* Stock Alerts */}
                {(lowStockCount > 0 || outOfStockCount > 0) && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        {lowStockCount > 0 && (
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: '12px',
                                background: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                border: `1px solid ${colors.warning}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ fontSize: '20px' }}>⚠️</span>
                                <span style={{ fontSize: '14px', color: colors.warning, fontWeight: '600' }}>
                                    {lowStockCount} item{lowStockCount > 1 ? 's' : ''} low on stock
                                </span>
                            </div>
                        )}
                        {outOfStockCount > 0 && (
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: '12px',
                                background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                border: `1px solid ${colors.danger}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ fontSize: '20px' }}>🚫</span>
                                <span style={{ fontSize: '14px', color: colors.danger, fontWeight: '600' }}>
                                    {outOfStockCount} item{outOfStockCount > 1 ? 's' : ''} out of stock
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Filters & Search */}
            <div style={{
                background: isDark ? '#1F2937' : '#FFF',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px',
                boxShadow: isDark ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            flex: '1',
                            minWidth: '200px',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: isDark ? `1px solid ${colors.violet}33` : '1px solid #E5E7EB',
                            background: isDark ? '#111827' : '#F9FAFB',
                            color: isDark ? '#FFF' : '#1F2937',
                            fontSize: '14px'
                        }}
                    />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: isDark ? `1px solid ${colors.violet}33` : '1px solid #E5E7EB',
                            background: isDark ? '#111827' : '#F9FAFB',
                            color: isDark ? '#FFF' : '#1F2937',
                            fontSize: '14px'
                        }}
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: isDark ? `1px solid ${colors.violet}33` : '1px solid #E5E7EB',
                            background: isDark ? '#111827' : '#F9FAFB',
                            color: isDark ? '#FFF' : '#1F2937',
                            fontSize: '14px'
                        }}
                    >
                        <option value="name">Sort by Name</option>
                        <option value="stock">Sort by Stock</option>
                        <option value="price">Sort by Price</option>
                    </select>
                </div>
            </div>

            {/* Inventory Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: colors.muted }}>
                    <div style={{ fontSize: '16px' }}>Loading inventory...</div>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: colors.muted }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                    <div style={{ fontSize: '16px' }}>No products found</div>
                </div>
            ) : (
                <div style={{
                    background: isDark ? '#1F2937' : '#FFF',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: isDark ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.05)'
                }}>
                    {/* Table Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 2fr 120px 100px 120px 120px 140px 120px',
                        gap: '16px',
                        padding: '16px 20px',
                        background: isDark ? '#111827' : '#F9FAFB',
                        borderBottom: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: colors.muted,
                        textTransform: 'uppercase'
                    }}>
                        <div></div>
                        <div>Product Name</div>
                        <div>SKU</div>
                        <div>Stock</div>
                        <div>Price</div>
                        <div>Category</div>
                        <div>Status</div>
                        <div style={{ textAlign: 'center' }}>Actions</div>
                    </div>

                    {/* Table Rows */}
                    {filteredProducts.map((product, idx) => {
                        const status = getStockStatus(product.stock)
                        return (
                            <div
                                key={product.id}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '40px 2fr 120px 100px 120px 120px 140px 120px',
                                    gap: '16px',
                                    padding: '16px 20px',
                                    borderBottom: idx < filteredProducts.length - 1 ? (isDark ? '1px solid #374151' : '1px solid #E5E7EB') : 'none',
                                    alignItems: 'center',
                                    transition: 'background 0.2s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = isDark ? '#374151' : '#F3F4F6'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{ color: colors.muted, fontSize: '12px' }}>{idx + 1}</div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: isDark ? '#FFF' : '#1F2937'
                                }}>
                                    {product.name}
                                </div>
                                <div style={{ fontSize: '12px', color: colors.muted, fontFamily: 'monospace' }}>
                                    {product.sku}
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: status.color
                                }}>
                                    {product.stock} units
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: isDark ? '#FFF' : '#1F2937' }}>
                                    {formatCurrency(product.price)}
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: isDark ? colors.violet + '22' : colors.violet + '11',
                                    color: colors.violet,
                                    width: 'fit-content'
                                }}>
                                    {product.category}
                                </div>
                                <div>
                                    <span style={{
                                        fontSize: '12px',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        background: status.bg,
                                        color: status.color,
                                        fontWeight: '600',
                                        display: 'inline-block'
                                    }}>
                                        {status.label}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => setShowRestockModal(product)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: isDark ? colors.success + '22' : colors.success + '11',
                                            color: colors.success,
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={e => e.target.style.background = colors.success + '33'}
                                        onMouseLeave={e => e.target.style.background = isDark ? colors.success + '22' : colors.success + '11'}
                                    >
                                        Restock
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: isDark ? colors.danger + '22' : colors.danger + '11',
                                            color: colors.danger,
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={e => e.target.style.background = colors.danger + '33'}
                                        onMouseLeave={e => e.target.style.background = isDark ? colors.danger + '22' : colors.danger + '11'}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Add Product Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}
                    onClick={() => setShowAddModal(false)}
                >
                    <div
                        style={{
                            background: isDark ? '#1F2937' : '#FFF',
                            borderRadius: '20px',
                            padding: '32px',
                            maxWidth: '500px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 style={{ fontSize: '24px', fontWeight: '700', color: isDark ? '#FFF' : '#1F2937', marginBottom: '24px' }}>
                            Add New Product
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <input
                                type="text"
                                placeholder="Product Name *"
                                value={newProduct.name}
                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: isDark ? `1px solid ${colors.violet}33` : '1px solid #E5E7EB',
                                    background: isDark ? '#111827' : '#F9FAFB',
                                    color: isDark ? '#FFF' : '#1F2937',
                                    fontSize: '14px'
                                }}
                            />
                            <input
                                type="text"
                                placeholder="SKU (auto-generated if empty)"
                                value={newProduct.sku}
                                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: isDark ? `1px solid ${colors.violet}33` : '1px solid #E5E7EB',
                                    background: isDark ? '#111827' : '#F9FAFB',
                                    color: isDark ? '#FFF' : '#1F2937',
                                    fontSize: '14px'
                                }}
                            />
                            <input
                                type="number"
                                placeholder="Price (₦) *"
                                value={newProduct.price}
                                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: isDark ? `1px solid ${colors.violet}33` : '1px solid #E5E7EB',
                                    background: isDark ? '#111827' : '#F9FAFB',
                                    color: isDark ? '#FFF' : '#1F2937',
                                    fontSize: '14px'
                                }}
                            />
                            <input
                                type="number"
                                placeholder="Initial Stock"
                                value={newProduct.stock}
                                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: isDark ? `1px solid ${colors.violet}33` : '1px solid #E5E7EB',
                                    background: isDark ? '#111827' : '#F9FAFB',
                                    color: isDark ? '#FFF' : '#1F2937',
                                    fontSize: '14px'
                                }}
                            />
                            <select
                                value={newProduct.category}
                                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: isDark ? `1px solid ${colors.violet}33` : '1px solid #E5E7EB',
                                    background: isDark ? '#111827' : '#F9FAFB',
                                    color: isDark ? '#FFF' : '#1F2937',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="">Select Category</option>
                                {categories.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            <textarea
                                placeholder="Description (optional)"
                                value={newProduct.description}
                                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                rows={3}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: isDark ? `1px solid ${colors.violet}33` : '1px solid #E5E7EB',
                                    background: isDark ? '#111827' : '#F9FAFB',
                                    color: isDark ? '#FFF' : '#1F2937',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button
                                    onClick={handleAddProduct}
                                    disabled={saving}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})`,
                                        color: '#FFF',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        opacity: saving ? 0.6 : 1
                                    }}
                                >
                                    {saving ? 'Adding...' : 'Add Product'}
                                </button>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        borderRadius: '12px',
                                        border: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
                                        background: 'transparent',
                                        color: isDark ? '#FFF' : '#1F2937',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Restock Modal */}
            {showRestockModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}
                    onClick={() => setShowRestockModal(null)}
                >
                    <div
                        style={{
                            background: isDark ? '#1F2937' : '#FFF',
                            borderRadius: '20px',
                            padding: '32px',
                            maxWidth: '400px',
                            width: '100%',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: isDark ? '#FFF' : '#1F2937', marginBottom: '8px' }}>
                            Restock Product
                        </h2>
                        <p style={{ fontSize: '14px', color: colors.muted, marginBottom: '24px' }}>
                            {showRestockModal.name}
                        </p>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '12px', color: colors.muted, marginBottom: '4px' }}>
                                Current Stock: <span style={{ fontWeight: '600', color: isDark ? '#FFF' : '#1F2937' }}>{showRestockModal.stock} units</span>
                            </div>
                        </div>
                        <input
                            type="number"
                            placeholder="Add quantity"
                            value={restockAmount}
                            onChange={(e) => setRestockAmount(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: isDark ? `1px solid ${colors.violet}33` : '1px solid #E5E7EB',
                                background: isDark ? '#111827' : '#F9FAFB',
                                color: isDark ? '#FFF' : '#1F2937',
                                fontSize: '14px',
                                marginBottom: '20px'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={handleRestock}
                                disabled={saving}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: colors.success,
                                    color: '#FFF',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: saving ? 0.6 : 1
                                }}
                            >
                                {saving ? 'Updating...' : 'Confirm Restock'}
                            </button>
                            <button
                                onClick={() => setShowRestockModal(null)}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
                                    background: 'transparent',
                                    color: isDark ? '#FFF' : '#1F2937',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProductsRedesign
