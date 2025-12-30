import { useState, useEffect } from 'react'
import { apiCall, API_ENDPOINTS } from '../config/api'

export const useProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiCall(API_ENDPOINTS.PRODUCTS)
      setProducts(data)
    } catch (err) {
      setError(err.message)
      console.error('Failed to load products:', err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const createProduct = async (productData) => {
    try {
      const response = await apiCall(API_ENDPOINTS.PRODUCTS, {
        method: 'POST',
        body: JSON.stringify(productData),
      })
      const newProduct = response.product || response
      await loadProducts()
      return newProduct
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateProduct = async (productId, productData) => {
    try {
      const response = await apiCall(API_ENDPOINTS.UPDATE_PRODUCT(productId), {
        method: 'PUT',
        body: JSON.stringify(productData),
      })
      const updatedProduct = response.product || response
      await loadProducts()
      return updatedProduct
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteProduct = async (productId) => {
    try {
      await apiCall(API_ENDPOINTS.PRODUCT_BY_ID(productId), {
        method: 'DELETE',
      })
      await loadProducts()
      return true
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const restockProduct = async (productId, quantity) => {
    try {
      await apiCall(API_ENDPOINTS.RESTOCK_PRODUCT(productId), {
        method: 'POST',
        body: JSON.stringify({ quantity }),
      })
      await loadProducts()
      return true
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  return {
    products,
    loading,
    error,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    restockProduct
  }
}
