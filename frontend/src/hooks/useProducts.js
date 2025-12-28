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
      // Fallback to mock data for development when API is not available
      setProducts([
        {
          id: '1',
          name: 'Nike Air Max Red',
          price_ngn: 45000,
          stock_level: 12,
          category: 'Footwear',
          description: 'Premium Nike Air Max running shoes in red',
          voice_tags: ['red canvas', 'red sneakers', 'canvas', 'kicks']
        },
        {
          id: '2',
          name: 'Adidas White Sneakers',
          price_ngn: 38000,
          stock_level: 10,
          category: 'Footwear',
          description: 'Classic white Adidas sneakers',
          voice_tags: ['white canvas', 'canvas', 'white sneakers']
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const createProduct = async (productData) => {
    try {
      const newProduct = await apiCall(API_ENDPOINTS.PRODUCTS, {
        method: 'POST',
        body: JSON.stringify(productData),
      })
      setProducts([...products, newProduct])
      return newProduct
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  return { products, loading, error, loadProducts, createProduct }
}

