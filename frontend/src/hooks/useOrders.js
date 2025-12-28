import { useState, useEffect } from 'react'
import { apiCall, API_ENDPOINTS } from '../config/api'

export const useOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiCall(API_ENDPOINTS.ORDERS)
      setOrders(data)
    } catch (err) {
      setError(err.message)
      console.error('Failed to load orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      const updatedOrder = await apiCall(API_ENDPOINTS.UPDATE_ORDER_STATUS(orderId), {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      setOrders(orders.map(order =>
        order.id === orderId ? updatedOrder : order
      ))
      return updatedOrder
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const createOrder = async (orderData) => {
    try {
      const newOrder = await apiCall(API_ENDPOINTS.CREATE_ORDER, {
        method: 'POST',
        body: JSON.stringify(orderData),
      })
      // Reload orders to include the new one
      await loadOrders()
      return newOrder
    } catch (err) {
      console.error('Failed to create order:', err)
      throw err
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  return { orders, loading, error, loadOrders, updateOrderStatus }
}

