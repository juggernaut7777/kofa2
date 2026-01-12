import { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { apiCall, cachedApiCall, API_ENDPOINTS, CACHE_KEYS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'
import {
    Plus,
    Search,
    Filter,
    Trash2,
    RefreshCw,
    AlertTriangle,
    Package,
    MoreHorizontal,
    X,
    Check
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'

const ProductsRedesign = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showRestockModal, setShowRestockModal] = useState(null)
    const [sortBy, setSortBy] = useState('name')

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

    // Helper to normalize product data
    const normalizeProducts = (data) => {
        return (Array.isArray(data) ? data : []).map(p => ({
            ...p,
            price: p.price_ngn || p.price || p.selling_price || p.unit_price || p.amount || 0,
            stock: p.stock_level ?? p.stock ?? p.quantity ?? p.inventory ?? 0,
            category: p.category || p.type || 'General',
            sku: p.sku || p.product_id || p.id
        }))
    }

    const loadProducts = async () => {
        setLoading(true)
        try {
            const data = await cachedApiCall(API_ENDPOINTS.PRODUCTS, CACHE_KEYS.PRODUCTS, (freshData) => {
                const normalized = normalizeProducts(freshData)
                setProducts(normalized)
            })
            const normalized = normalizeProducts(data)
            setProducts(normalized)
        } catch (e) {
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (n) => {
        if (n == null || isNaN(n)) return '₦0'
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)
    }

    const getStockStatus = (stock) => {
        if (stock === 0) return { label: 'Out of Stock', variant: 'danger' }
        if (stock < 10) return { label: 'Low Stock', variant: 'warning' }
        return { label: 'In Stock', variant: 'success' }
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
        .filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'stock') return a.stock - b.stock
            if (sortBy === 'price') return b.price - a.price
            return a.name?.localeCompare(b.name)
        })

    const lowStockCount = products.filter(p => p.stock > 0 && p.stock < 10).length
    const outOfStockCount = products.filter(p => p.stock === 0).length

    return (
        <div className="space-y-6 pb-20 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-main">Inventory</h1>
                    <p className="text-muted mt-1">Manage stock levels and pricing</p>
                </div>
                <Button icon={<Plus size={18} />} onClick={() => setShowAddModal(true)} className="shadow-lg shadow-brand-glow">
                    Add Product
                </Button>
            </div>

            {/* Alerts */}
            {(lowStockCount > 0 || outOfStockCount > 0) && (
                <div className="flex flex-wrap gap-3">
                    {lowStockCount > 0 && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                            <AlertTriangle size={18} />
                            <span className="font-medium">{lowStockCount} items low on stock</span>
                        </div>
                    )}
                    {outOfStockCount > 0 && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
                            <AlertTriangle size={18} />
                            <span className="font-medium">{outOfStockCount} items out of stock</span>
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <Card glass className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="premium-input pl-10 w-full"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="premium-input pl-10 appearance-none pr-8 cursor-pointer"
                            >
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="premium-input cursor-pointer"
                        >
                            <option value="name">Name</option>
                            <option value="stock">Stock</option>
                            <option value="price">Price</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Products Table */}
            <Card glass className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-subtle bg-surface-2/50 text-xs uppercase text-muted font-semibold tracking-wider">
                                <th className="p-4">Product</th>
                                <th className="p-4">SKU</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Stock</th>
                                <th className="p-4">Price</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-muted">
                                        Loading inventory...
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-muted">
                                        No products found
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => {
                                    const status = getStockStatus(product.stock)
                                    return (
                                        <tr key={product.id} className="group hover:bg-surface-2/50 transition-colors">
                                            <td className="p-4 font-medium text-main">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                                        <Package size={16} />
                                                    </div>
                                                    {product.name}
                                                </div>
                                            </td>
                                            <td className="p-4 text-muted font-mono text-xs">{product.sku}</td>
                                            <td className="p-4">
                                                <Badge variant="neutral" size="sm">{product.category}</Badge>
                                            </td>
                                            <td className="p-4 font-medium">{product.stock}</td>
                                            <td className="p-4 font-bold">{formatCurrency(product.price)}</td>
                                            <td className="p-4">
                                                <Badge variant={status.variant} size="sm" dot>
                                                    {status.label}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setShowRestockModal(product)}
                                                        title="Restock"
                                                    >
                                                        <RefreshCw size={16} className="text-blue-500" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(product.id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} className="text-red-500" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* --- Modals --- */}

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <Card glass className="w-full max-w-lg shadow-2xl">
                        <CardHeader>
                            <CardTitle>Add New Product</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                                <X size={20} />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                label="Product Name"
                                placeholder="e.g., Slim Cut Jeans"
                                value={newProduct.name}
                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Price (₦)"
                                    type="number"
                                    placeholder="0.00"
                                    value={newProduct.price}
                                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                />
                                <Input
                                    label="Initial Stock"
                                    type="number"
                                    placeholder="0"
                                    value={newProduct.stock}
                                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-main">Category</label>
                                    <select
                                        value={newProduct.category}
                                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                        className="premium-input"
                                    >
                                        <option value="">Select...</option>
                                        {categories.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <Input
                                    label="SKU (Optional)"
                                    placeholder="Auto-generated"
                                    value={newProduct.sku}
                                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-main">Description</label>
                                <textarea
                                    className="premium-input min-h-[80px] resize-y"
                                    placeholder="Product details..."
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                                <Button onClick={handleAddProduct} isLoading={saving}>Add Product</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {showRestockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <Card glass className="w-full max-w-sm shadow-2xl">
                        <CardHeader>
                            <CardTitle>Restock Product</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 rounded-lg bg-surface-2">
                                <p className="font-medium">{showRestockModal.name}</p>
                                <p className="text-sm text-muted">Current Stock: {showRestockModal.stock}</p>
                            </div>
                            <Input
                                label="Quantity to Add"
                                type="number"
                                autoFocus
                                placeholder="0"
                                value={restockAmount}
                                onChange={(e) => setRestockAmount(e.target.value)}
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <Button variant="secondary" onClick={() => setShowRestockModal(null)}>Cancel</Button>
                                <Button onClick={handleRestock} isLoading={saving}>Confirm</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

export default ProductsRedesign
