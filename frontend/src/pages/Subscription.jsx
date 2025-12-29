import { useState, useEffect, useContext } from 'react'
import { apiCall, API_ENDPOINTS } from '../config/api'
import { ThemeContext } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const Subscription = () => {
  const { theme } = useContext(ThemeContext)
  const { user } = useAuth()
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
      setPlans([
        {
          id: 'free',
          name: 'Free',
          price_ngn: 0,
          features: ['50 products', 'Basic AI chatbot', 'WhatsApp only', 'Basic analytics']
        },
        {
          id: 'starter',
          name: 'Starter',
          price_ngn: 5000,
          features: ['200 products', 'Advanced AI chatbot', 'WhatsApp + Instagram', 'Full analytics', 'Priority support'],
          popular: true
        },
        {
          id: 'professional',
          name: 'Professional',
          price_ngn: 15000,
          features: ['Unlimited products', 'Premium AI chatbot', 'All platforms', 'Advanced analytics', 'Customer insights', 'Dedicated support']
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (planId) => {
    if (planId === 'free') {
      alert('Free plan is already active!')
      return
    }

    try {
      setPurchasing(planId)
      const response = await apiCall(API_ENDPOINTS.PURCHASE_SUBSCRIPTION, {
        method: 'POST',
        body: JSON.stringify({ plan_id: planId, payment_method: 'paystack' })
      })

      if (response.payment_link) {
        window.open(response.payment_link, '_blank')
      } else {
        alert(response.message || 'Plan activated!')
      }
    } catch (error) {
      console.error('Purchase failed:', error)
      alert('Coming soon! Paystack integration in progress.')
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex justify-center items-center ${theme === 'dark' ? 'bg-dark-bg' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-kofa-sky border-t-kofa-cobalt"></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-bg' : 'bg-slate-50'}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
            Upgrade Your Plan
          </h1>
          <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}`}>
            Scale your business with more products and advanced features
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl p-6 relative ${plan.popular
                  ? 'bg-kofa-cobalt text-white'
                  : theme === 'dark'
                    ? 'bg-dark-card border border-dark-border'
                    : 'bg-white shadow-sm'
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-success text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className={`text-xl font-bold ${plan.popular ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
                  {plan.name}
                </h3>
                <div className={`text-3xl font-bold mt-2 ${plan.popular ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
                  {plan.price_ngn === 0 ? 'Free' : `₦${plan.price_ngn.toLocaleString()}`}
                </div>
                {plan.price_ngn > 0 && (
                  <span className={plan.popular ? 'text-blue-100' : theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}>
                    /month
                  </span>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <span className={`mr-2 ${plan.popular ? 'text-white' : 'text-success'}`}>✓</span>
                    <span className={plan.popular ? 'text-blue-100' : theme === 'dark' ? 'text-gray-300' : 'text-kofa-steel'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePurchase(plan.id)}
                disabled={purchasing === plan.id || (plan.id === 'free' && user?.plan === 'free')}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors ${plan.popular
                    ? 'bg-white text-kofa-cobalt hover:bg-gray-100'
                    : plan.id === 'free' && user?.plan === 'free'
                      ? theme === 'dark' ? 'bg-dark-border text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-kofa-cobalt text-white hover:bg-kofa-navy'
                  }`}
              >
                {purchasing === plan.id
                  ? 'Processing...'
                  : plan.id === 'free' && user?.plan === 'free'
                    ? 'Current Plan'
                    : plan.id === 'free'
                      ? 'Downgrade'
                      : 'Upgrade Now'
                }
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className={`mt-12 rounded-xl p-6 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
          <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
                Can I change my plan later?
              </h3>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}>
                Yes, you can upgrade or downgrade anytime. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
                What payment methods are accepted?
              </h3>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}>
                We accept all Nigerian bank cards and bank transfers via Paystack.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Subscription
