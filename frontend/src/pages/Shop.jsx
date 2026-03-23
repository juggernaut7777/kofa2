import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingBag, Plus, Minus, X, Send, Loader, Store, ArrowLeft, ChevronLeft } from 'lucide-react'
import { API_BASE_URL } from '../config/api'

/**
 * Public Storefront Page
 * Displays vendor's products for customers to browse and order via WhatsApp.
 * Route: /shop/{businessName}
 */
const Shop = () => {
    const { shopName } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [shopData, setShopData] = useState(null)
    const [cart, setCart] = useState([])
    const [showCart, setShowCart] = useState(false)

    // Fetch shop data
    useEffect(() => {
        const fetchShop = async () => {
            try {
                setLoading(true)
                setError(null)

                const response = await fetch(`${API_BASE_URL}/shop/${encodeURIComponent(shopName)}`)

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Shop not found')
                    }
                    throw new Error('Failed to load shop')
                }

                const data = await response.json()
                setShopData(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        if (shopName) {
            fetchShop()
        }
    }, [shopName])

    // Format currency
    const formatPrice = (price) => {
        return `₦${price.toLocaleString()}`
    }

    // Add to cart
    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { ...product, quantity: 1 }]
        })
    }

    // Update cart quantity
    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            setCart(prev => prev.filter(item => item.id !== productId))
        } else {
            setCart(prev => prev.map(item =>
                item.id === productId
                    ? { ...item, quantity: newQuantity }
                    : item
            ))
        }
    }

    // Calculate cart total
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

    // Generate WhatsApp checkout link
    const handleCheckout = () => {
        if (cart.length === 0 || !shopData) return

        // Build message
        let message = "Hello! I want to buy:\n"
        cart.forEach(item => {
            message += `- ${item.name} (x${item.quantity}) - ${formatPrice(item.price * item.quantity)}\n`
        })
        message += `\nTotal: ${formatPrice(cartTotal)}`

        // Format phone number (remove + and spaces)
        const phone = shopData.phone.replace(/[^0-9]/g, '')

        // Create WhatsApp link
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

        // Open in new tab
        window.open(whatsappUrl, '_blank')
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-gray-500">Loading shop...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <Store className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Shop Not Found</h1>
                    <p className="text-gray-500 mb-4">{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-blue-500 font-medium hover:underline"
                    >
                        ← Go Back
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-lg mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        {/* Back Button */}
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Go back"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {shopData?.display_name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="font-bold text-gray-900 truncate">{shopData?.business_name}</h1>
                            <p className="text-xs text-gray-500">{shopData?.products?.length || 0} products</p>
                        </div>
                        {/* Cart Button */}
                        <button
                            onClick={() => setShowCart(true)}
                            className="relative p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            <ShoppingBag className="w-5 h-5 text-gray-700" />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-bounce">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Product Grid */}
            <main className="max-w-lg mx-auto px-4 py-6">
                {shopData?.products?.length === 0 ? (
                    <div className="text-center py-12">
                        <Store className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No products available</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {shopData?.products?.map(product => (
                            <div
                                key={product.id}
                                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                            >
                                {/* Product Image */}
                                <div className="aspect-square bg-gray-100 relative">
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ShoppingBag className="w-12 h-12 text-gray-300" />
                                        </div>
                                    )}
                                    {/* Add to Cart Button — bigger for mobile */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); addToCart(product) }}
                                        className="absolute bottom-2 right-2 w-10 h-10 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                {/* Product Info */}
                                <div className="p-3">
                                    <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                                    <p className="text-blue-600 font-bold">{formatPrice(product.price)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Floating Cart Bar */}
            {cart.length > 0 && !showCart && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
                    <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-900">{cartItemCount} Item{cartItemCount !== 1 ? 's' : ''}</p>
                            <p className="text-blue-600 font-bold">{formatPrice(cartTotal)}</p>
                        </div>
                        <button
                            onClick={() => setShowCart(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors active:scale-95"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            View Cart
                        </button>
                    </div>
                </div>
            )}

            {/* Cart Overlay */}
            {showCart && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
                    onClick={() => setShowCart(false)}
                >
                    <div
                        className="bg-white w-full max-w-lg rounded-t-2xl max-h-[80vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Cart Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-bold">Your Cart</h2>
                            <button
                                onClick={() => setShowCart(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {cart.length === 0 ? (
                                <div className="text-center py-8">
                                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="text-gray-500 mb-4">Your cart is empty</p>
                                    <button
                                        onClick={() => setShowCart(false)}
                                        className="text-blue-500 font-medium hover:underline"
                                    >
                                        Continue Shopping →
                                    </button>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                                        {/* Item Image */}
                                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ShoppingBag className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        {/* Item Details */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                                            <p className="text-blue-600 font-bold">{formatPrice(item.price)}</p>
                                        </div>
                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Cart Footer */}
                        {cart.length > 0 && (
                            <div className="border-t p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Total</span>
                                    <span className="text-xl font-bold text-gray-900">{formatPrice(cartTotal)}</span>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                                >
                                    <Send className="w-5 h-5" />
                                    Order via WhatsApp
                                </button>
                                <button
                                    onClick={() => setShowCart(false)}
                                    className="w-full py-3 text-blue-500 font-medium text-sm hover:bg-blue-50 rounded-xl transition-colors"
                                >
                                    ← Continue Shopping
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Shop
