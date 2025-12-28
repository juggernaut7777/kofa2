import { useState, useEffect } from 'react'
import { apiCall, API_ENDPOINTS } from '../config/api'

const Subscription = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await apiCall(API_ENDPOINTS.SUBSCRIPTION_PLANS)
      setPlans(response.plans || [])
    } catch (error) {
      console.error('Failed to load plans:', error)
      // Fallback mock data for KOFA vendor plans
      setPlans([
        {
          id: 'free',
          name: 'Free',
          price_ngn: 0,
          duration_months: 0,
          features: ['Up to 50 products', 'Basic chatbot', 'WhatsApp integration', 'Basic analytics'],
          max_products: 50,
          max_messages: 100
        },
        {
          id: 'starter',
          name: 'Starter',
          price_ngn: 5000,
          duration_months: 1,
          features: ['Up to 200 products', 'AI chatbot', 'WhatsApp + Instagram', 'Order management', 'Sales analytics'],
          max_products: 200,
          max_messages: 1000
        },
        {
          id: 'professional',
          name: 'Professional',
          price_ngn: 15000,
          duration_months: 1,
          features: ['Unlimited products', 'Advanced AI chatbot', 'All platforms (WhatsApp, IG, TikTok)', 'Full analytics', 'Customer insights', 'Priority support'],
          max_products: -1,
          max_messages: -1
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (planId) => {
    if (planId === 'free') {
      alert('Free plan activated successfully!')
      return
    }

    try {
      setPurchasing(planId)
      const response = await apiCall(API_ENDPOINTS.PURCHASE_SUBSCRIPTION, {
        method: 'POST',
        body: JSON.stringify({
          plan_id: planId,
          payment_method: 'paystack'
        })
      })

      if (response.payment_link) {
        window.open(response.payment_link, '_blank')
      } else {
        alert(response.message || 'Plan activated successfully!')
      }
    } catch (error) {
      console.error('Purchase failed:', error)
      alert('Purchase failed. Please try again.')
    } finally {
      setPurchasing(null)
    }
  }

  const formatPrice = (price) => {
    if (price === 0) return 'Free'
    return `₦${price.toLocaleString()}`
  }

  const getPlanStyle = (planId) => {
    switch (planId) {
      case 'professional':
        return 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50'
      case 'starter':
        return 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50'
      case 'free':
        return 'border-gray-300 bg-gray-50'
      default:
        return 'border-gray-300'
    }
  }

  const getButtonStyle = (planId) => {
    switch (planId) {
      case 'professional':
        return 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
      case 'starter':
        return 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
      case 'free':
        return 'bg-gray-600 hover:bg-gray-700'
      default:
        return 'bg-gray-600 hover:bg-gray-700'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
          KOFA Subscription Plans
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Scale your business with AI-powered chatbot automation and inventory management.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 ${getPlanStyle(plan.id)}`}
            >
              {plan.id === 'professional' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {formatPrice(plan.price_ngn)}
                </div>
                {plan.duration_months > 0 && (
                  <div className="text-sm text-gray-600">per {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</div>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePurchase(plan.id)}
                disabled={purchasing === plan.id}
                className={`w-full py-3 px-6 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyle(plan.id)}`}
              >
                {purchasing === plan.id ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Processing...
                  </div>
                ) : plan.id === 'free' ? (
                  'Get Started Free'
                ) : (
                  'Subscribe Now'
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* KOFA-Specific Features */}
      <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Why KOFA?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI Chatbot</h3>
            <p className="text-gray-600">Never miss a sale with 24/7 automated responses on WhatsApp, Instagram & TikTok</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Inventory</h3>
            <p className="text-gray-600">Real-time stock tracking prevents overselling and helps your chatbot know what's available</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Business Insights</h3>
            <p className="text-gray-600">Track sales, profits, and customer behavior across all your social media channels</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 bg-gray-50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">How does the chatbot work?</h3>
            <p className="text-gray-600">Connect your WhatsApp/Instagram/TikTok and our AI automatically responds to customer inquiries using your inventory data.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Can I manage multiple social media accounts?</h3>
            <p className="text-gray-600">Yes! Professional plan includes unlimited social media connections with unified analytics.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What happens if I run out of stock?</h3>
            <p className="text-gray-600">Our system automatically stops selling out-of-stock items and alerts you when inventory is low.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Do you support voice messages?</h3>
            <p className="text-gray-600">Yes! Our AI can transcribe voice notes and respond appropriately, with voice-to-text capabilities.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Subscription

