import { useState, useRef, useContext } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useImageUpload } from '../hooks/useImageUpload'
import { useAuth } from '../context/AuthContext'
import { ThemeContext } from '../context/ThemeContext'

const Products = () => {
  const { user } = useAuth()
  const { theme } = useContext(ThemeContext)
  const { products, loading, createProduct } = useProducts()
  const { uploadImage, uploading } = useImageUpload()
  const [showAddForm, setShowAddForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '',
    price_ngn: '',
    stock_level: '',
    description: '',
    category: ''
  })

  const FREE_TIER_LIMIT = 50
  const isAtLimit = user?.plan === 'free' && products.length >= FREE_TIER_LIMIT

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Please upload JPEG, PNG, or WebP')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB')
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setCreating(true)
      let imageUrl = ''

      if (imageFile) {
        const result = await uploadImage(imageFile)
        if (result?.url) imageUrl = result.url
      }

      await createProduct({
        name: formData.name,
        price_ngn: parseFloat(formData.price_ngn),
        stock_level: parseInt(formData.stock_level),
        description: formData.description || '',
        category: formData.category || '',
        image_url: imageUrl
      })

      setShowAddForm(false)
      setFormData({ name: '', price_ngn: '', stock_level: '', description: '', category: '' })
      removeImage()
    } catch (error) {
      console.error('Failed to create product:', error)
      alert('Failed to create product')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-bg' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className={`rounded-xl p-6 mb-8 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
                Products
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}`}>
                {products.length} products • {user?.plan === 'free' ? `${FREE_TIER_LIMIT - products.length} slots left` : 'Unlimited'}
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={isAtLimit && !showAddForm}
              className={`px-6 py-3 rounded-xl font-medium ${isAtLimit
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-kofa-cobalt text-white hover:bg-kofa-navy'
                }`}
            >
              {showAddForm ? '✕ Cancel' : '+ Add Product'}
            </button>
          </div>

          {isAtLimit && (
            <div className={`mt-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-warning/10 border border-warning/30' : 'bg-amber-50 border border-amber-200'}`}>
              <p className={`text-sm ${theme === 'dark' ? 'text-warning' : 'text-amber-800'}`}>
                ⚠️ You've reached the free tier limit of {FREE_TIER_LIMIT} products. Upgrade to add more.
              </p>
            </div>
          )}
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className={`rounded-xl p-6 mb-8 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
            <h2 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
              Add New Product
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-kofa-steel'}`}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Designer Handbag"
                    className={`w-full px-4 py-3 rounded-xl border ${theme === 'dark'
                        ? 'bg-dark-bg border-dark-border text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-kofa-navy'
                      }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-kofa-steel'}`}>
                    Price (₦) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price_ngn}
                    onChange={(e) => setFormData({ ...formData, price_ngn: e.target.value })}
                    placeholder="25000"
                    className={`w-full px-4 py-3 rounded-xl border ${theme === 'dark'
                        ? 'bg-dark-bg border-dark-border text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-kofa-navy'
                      }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-kofa-steel'}`}>
                    Stock Level *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock_level}
                    onChange={(e) => setFormData({ ...formData, stock_level: e.target.value })}
                    placeholder="10"
                    className={`w-full px-4 py-3 rounded-xl border ${theme === 'dark'
                        ? 'bg-dark-bg border-dark-border text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-kofa-navy'
                      }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-kofa-steel'}`}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Fashion, Electronics, etc."
                    className={`w-full px-4 py-3 rounded-xl border ${theme === 'dark'
                        ? 'bg-dark-bg border-dark-border text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-kofa-navy'
                      }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-kofa-steel'}`}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Product description for AI chatbot..."
                  className={`w-full px-4 py-3 rounded-xl border ${theme === 'dark'
                      ? 'bg-dark-bg border-dark-border text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-kofa-navy'
                    }`}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-kofa-steel'}`}>
                  Product Image
                </label>
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="h-32 rounded-lg" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-danger text-white w-6 h-6 rounded-full text-sm"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className={`flex items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer ${theme === 'dark' ? 'border-dark-border hover:border-kofa-cobalt/50' : 'border-gray-300 hover:border-kofa-cobalt/50'
                    }`}>
                    <div className="text-center">
                      <span className="text-3xl">📷</span>
                      <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}`}>
                        Click to upload
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={creating || uploading}
                className="w-full bg-kofa-cobalt text-white py-3 rounded-xl font-medium hover:bg-kofa-navy disabled:opacity-50"
              >
                {creating || uploading ? 'Adding...' : 'Add Product'}
              </button>
            </form>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-kofa-sky border-t-kofa-cobalt"></div>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <div key={product.id} className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'
                }`}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-40 object-cover" />
                ) : (
                  <div className={`w-full h-40 flex items-center justify-center ${theme === 'dark' ? 'bg-dark-border' : 'bg-gray-100'
                    }`}>
                    <span className="text-4xl">📦</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className={`font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
                    {product.name}
                  </h3>
                  <p className={`text-lg font-bold mt-1 ${theme === 'dark' ? 'text-kofa-sky' : 'text-kofa-cobalt'}`}>
                    ₦{product.price_ngn?.toLocaleString()}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-sm ${product.stock_level > 5
                        ? 'text-success'
                        : product.stock_level > 0
                          ? 'text-warning'
                          : 'text-danger'
                      }`}>
                      {product.stock_level > 0 ? `${product.stock_level} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`rounded-xl p-12 text-center ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'
            }`}>
            <span className="text-5xl">📦</span>
            <h3 className={`text-xl font-semibold mt-4 ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
              No products yet
            </h3>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}`}>
              Add your first product to start selling with AI
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-6 bg-kofa-cobalt text-white px-6 py-3 rounded-xl font-medium hover:bg-kofa-navy"
            >
              Add First Product
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Products
