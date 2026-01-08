import { useState, useEffect, useContext } from 'react'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'

const ProductsRedesign = () => {
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [usage, setUsage] = useState({ products: 0, maxProducts: 50 })

    // New product form
    const [newProduct, setNewProduct] = useState({
        name: '',
        price: '',
        stock: '',
        category: '',
        description: ''
    })

    const categories = ['All', 'Textiles', 'Electronics', 'Beauty', 'Fashion']

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        try {
            const data = await apiCall(API_ENDPOINTS.PRODUCTS)
            setProducts(data)
            setUsage({ products: data.length, maxProducts: 50 })
        } catch (error) {
            console.log('Using demo products')
            setProducts([
                { id: 1, name: 'Ankara Fabric Pattern B', price: 5000, stock: 12, category: 'Textiles', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhn4BwPZaIGM9rjOLXuFwJGl7RxsWl1MOkERZM_Re8eBg5u0q3RyC7AzOL878oUET6DWxJ5nfWg1PQHkY3RPONKJuXqsV43fKEc2eGbDgM4wj5K2lTxVFOERzFt5ZrRTYcvcUUVc4NAuxCkU07NLzAbm0z-w3nQOGEVef5XZcVOwEGvUrKXPd3kqA2buQvkXA_HKMDBZQ7LDkv6hLCa-ftIvOmrWoQtFVIlZ6Kq0-sR0XMFnFWirw7c1meYp92Mj3ySf9oV2nSm0uP' },
                { id: 2, name: 'Eau de Parfum - Rose Gold', price: 25000, stock: 2, category: 'Beauty', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoLLdPUUNswhRa45aKmdT3pYSaaJg0dm3nD67e2pav1nkORdiKn8sGzIQ1a90lUgNGMy36H4_SfboqIce2qld2jDqRinqizUwi1seV6xyvmxQWMZ0ws1BnEnru9egCXZCOLjDFN_vnN7Hogkqkd6pmq2jISx71lKPj0XIzxqNO7-XyyyzYrrNoFkdqdUjUixmO5PCVQLOgvEf6daNZhPu2o4oPf0Pd3_O3Pe3DXQSLCe2lmuRki_nwmsIJkWsM9muSSyN-wZDlz2Je' },
                { id: 3, name: 'Wireless Headphones Pro', price: 45000, stock: 8, category: 'Electronics', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDl135crgeYPZApWPepWklpP2r8VpTj7uEavRG5x9nkUvFjnCJmtAV1oMsOXgVRqKfWpvd5GhxdOmTHBIlyN_5HnxKmJ9dsPcftXEhCrKFr6ujbg8mgMB2gl-L4QH8v5O0fUIzrkH3wKj9dVnXlglabi198pbzL4Ty06SuhI5f6xNv4K7oCdnFFrDH52Fn5uwnKssJ5-d5ainH7PMQHNFVA6Y0MiAmEFY9853jxNW2P0HIzmxZIp3U1960EDXkQ2HkhE6hnBg2MCqn' },
                { id: 4, name: 'Red Sport Sneaker', price: 32000, stock: 5, category: 'Fashion', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATyF3etdiScRY8Xfz5N3WuiFXTSGLGo4jog6AioroJyT2Z9UsgyNRP6cItpcJAJ1AJLzzDWd9eWjhd2Q6FrkfBG1TzqV2CFJWBq7tHmiTXBpIRduNLSnElvxcCu52uLp7koNkJPeecPh_UQbGoy6PxbFTp9NdT2RdpVZOpsoMFW198KyP7C4g-g4AOieNjz6am0tgHyaeMupNv1O7Gn6EKOlB0C223mbP_0vi6YW5jWjlKk0IDwyOB3dwk7COAhN_EP37fN0gnvoVZ' },
            ])
            setUsage({ products: 12, maxProducts: 50 })
        } finally {
            setLoading(false)
        }
    }

    const handleAddProduct = async () => {
        try {
            await apiCall(API_ENDPOINTS.CREATE_PRODUCT, {
                method: 'POST',
                body: JSON.stringify(newProduct)
            })
            loadProducts()
            setShowAddModal(false)
            setNewProduct({ name: '', price: '', stock: '', category: '', description: '' })
        } catch (error) {
            console.error('Failed to add product:', error)
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', { minimumFractionDigits: 0 }).format(amount)
    }

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const usagePercent = (usage.products / usage.maxProducts) * 100

    return (
        <div className={`min-h-screen font-['Manrope'] ${isDark ? 'bg-[#102217] text-white' : 'bg-[#f6f8f7] text-[#111814]'}`}>
            <div className="max-w-md mx-auto pb-24">

                {/* Header */}
                <div className={`sticky top-0 z-20 backdrop-blur-sm border-b ${isDark ? 'bg-[#102217]/95 border-gray-800' : 'bg-[#f6f8f7]/95 border-gray-100'
                    }`}>
                    <div className="flex flex-col gap-2 p-4 pb-2">
                        <div className="flex items-center h-8 justify-between">
                            <span className="text-2xl">☰</span>
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
                    <div className={`flex flex-col gap-3 rounded-xl border border-[#2bee79]/20 p-4 shadow-sm ${isDark ? 'bg-[#1c2e24]' : 'bg-white'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-bold">{usage.products}/{usage.maxProducts} Free Slots Used</p>
                                <div className={`w-full rounded-full h-1.5 mt-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                    <div className="bg-[#2bee79] h-1.5 rounded-full" style={{ width: `${usagePercent}%` }}></div>
                                </div>
                            </div>
                            <button className="text-xs font-bold text-[#2bee79] flex items-center gap-1 hover:underline">
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
                                className={`flex-1 bg-transparent border-none focus:outline-none focus:ring-0 px-3 ${isDark ? 'text-white placeholder-[#a0b3aa]' : 'text-[#111814] placeholder-[#618971]'
                                    }`}
                            />
                        </div>
                    </div>

                    {/* Category Pills */}
                    <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar pb-2">
                        <button className={`flex h-9 items-center gap-2 rounded-full px-4 shadow-sm border ${isDark ? 'bg-[#1c2e24] border-gray-700' : 'bg-white border-gray-200'
                            }`}>
                            <span className="text-sm font-bold">Sort</span>
                            <span>↕</span>
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
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-10 h-10 border-4 border-[#2bee79] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="p-4 grid grid-cols-2 gap-4">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="flex flex-col gap-2 group cursor-pointer">
                                <div className={`relative w-full aspect-square rounded-xl overflow-hidden shadow-sm ${isDark ? 'bg-gray-800' : 'bg-gray-100'
                                    }`}>
                                    {/* More options button */}
                                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md">
                                            <span className="text-gray-700">⋯</span>
                                        </button>
                                    </div>

                                    {/* Product Image */}
                                    <div
                                        className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                        style={{ backgroundImage: `url('${product.image_url || 'https://via.placeholder.com/200'}')` }}
                                    ></div>

                                    {/* Low Stock Badge */}
                                    {product.stock <= 3 && (
                                        <div className="absolute top-2 left-2 px-2 py-1 bg-orange-500 rounded text-white text-[10px] font-bold shadow-sm flex items-center gap-1">
                                            ⚠️ Low Stock
                                        </div>
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
                                        <p className={`text-xs font-medium ${product.stock <= 3
                                                ? 'text-orange-500 font-bold'
                                                : isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'
                                            }`}>
                                            {product.stock <= 3 ? `Only ${product.stock} left` : `${product.stock} in stock`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 px-4">
                        <span className="text-6xl mb-4">📦</span>
                        <p className="text-lg font-bold mb-2">No products found</p>
                        <p className={`text-sm text-center ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>
                            {searchQuery ? 'Try a different search term' : 'Add your first product to get started'}
                        </p>
                    </div>
                )}
            </div>

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)}></div>
                    <div className={`relative w-full max-w-md rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] overflow-hidden ${isDark ? 'bg-[#1c2e24]' : 'bg-white'
                        }`}>
                        {/* Modal Handle */}
                        <div className="w-full flex justify-center pt-3 pb-1">
                            <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                        </div>

                        {/* Modal Header */}
                        <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                            <button onClick={() => setShowAddModal(false)} className="text-red-500 font-medium">Cancel</button>
                            <h3 className="text-lg font-bold">Add Product</h3>
                            <button onClick={handleAddProduct} className="text-[#2bee79] font-bold">Save</button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 flex flex-col gap-5 max-h-[60vh] overflow-y-auto">
                            {/* Image Upload */}
                            <div className="flex justify-center">
                                <div className={`w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#2bee79] transition-colors ${isDark ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50'
                                    }`}>
                                    <span className="text-3xl">📷</span>
                                    <span className={`text-xs font-semibold ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>Add Photo</span>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-bold mb-1 ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>Product Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Ankara Fabric Pattern A"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        className={`w-full rounded-lg px-4 py-3 font-medium border-0 focus:ring-2 focus:ring-[#2bee79] ${isDark ? 'bg-[#102217] text-white placeholder-gray-500' : 'bg-[#f6f8f7] text-[#111814] placeholder-gray-400'
                                            }`}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-bold mb-1 ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>Price (₦)</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={newProduct.price}
                                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                            className={`w-full rounded-lg px-4 py-3 font-medium border-0 focus:ring-2 focus:ring-[#2bee79] ${isDark ? 'bg-[#102217] text-white placeholder-gray-500' : 'bg-[#f6f8f7] text-[#111814] placeholder-gray-400'
                                                }`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-bold mb-1 ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>Stock</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={newProduct.stock}
                                            onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                            className={`w-full rounded-lg px-4 py-3 font-medium border-0 focus:ring-2 focus:ring-[#2bee79] ${isDark ? 'bg-[#102217] text-white placeholder-gray-500' : 'bg-[#f6f8f7] text-[#111814] placeholder-gray-400'
                                                }`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-sm font-bold mb-1 ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>Category</label>
                                    <select
                                        value={newProduct.category}
                                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                        className={`w-full rounded-lg px-4 py-3 font-medium border-0 focus:ring-2 focus:ring-[#2bee79] ${isDark ? 'bg-[#102217] text-white' : 'bg-[#f6f8f7] text-[#111814]'
                                            }`}
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Textiles">Textiles</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Beauty">Beauty</option>
                                        <option value="Fashion">Fashion</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={`block text-sm font-bold mb-1 ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>Description</label>
                                    <textarea
                                        placeholder="Enter product description..."
                                        rows="3"
                                        value={newProduct.description}
                                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                        className={`w-full rounded-lg px-4 py-3 font-medium border-0 focus:ring-2 focus:ring-[#2bee79] resize-none ${isDark ? 'bg-[#102217] text-white placeholder-gray-500' : 'bg-[#f6f8f7] text-[#111814] placeholder-gray-400'
                                            }`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowImportModal(false)}></div>
                    <div className={`relative w-full max-w-md rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] overflow-hidden ${isDark ? 'bg-[#1c2e24]' : 'bg-white'
                        }`}>
                        {/* Modal Handle */}
                        <div className="w-full flex justify-center pt-3 pb-1">
                            <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                        </div>

                        {/* Modal Header */}
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
                                <button className={`flex-1 py-1.5 rounded-md text-sm font-bold shadow ${isDark ? 'bg-gray-700 text-white' : 'bg-white text-[#111814]'}`}>CSV</button>
                                <button className={`flex-1 py-1.5 rounded-md text-sm font-medium ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>Scan</button>
                                <button className={`flex-1 py-1.5 rounded-md text-sm font-medium ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>Sheets</button>
                                <button className={`flex-1 py-1.5 rounded-md text-sm font-medium ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>Paste</button>
                            </div>
                        </div>

                        {/* Upload Area */}
                        <div className="p-6 flex flex-col items-center justify-center gap-4 text-center">
                            <div className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 ${isDark ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50'
                                }`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-green-900/30' : 'bg-green-100'}`}>
                                    <span className="text-2xl text-[#2bee79]">📤</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Click to upload CSV</p>
                                    <p className={`text-xs ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>or drag and drop here</p>
                                </div>
                            </div>

                            <div className="w-full flex items-center gap-2 mt-2">
                                <div className={`h-px flex-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                <span className={`text-xs font-semibold uppercase ${isDark ? 'text-[#a0b3aa]' : 'text-[#618971]'}`}>Templates</span>
                                <div className={`h-px flex-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                            </div>

                            <button className="flex items-center gap-2 text-sm font-semibold text-[#2bee79] hover:underline">
                                ⬇ Download Template
                            </button>

                            <button className="w-full mt-4 py-3 bg-[#2bee79] text-[#102217] rounded-lg font-bold shadow-lg hover:opacity-90 transition-colors">
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
