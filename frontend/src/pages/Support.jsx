import { useState, useEffect } from 'react'
import { apiCall, API_ENDPOINTS } from '../config/api'

const Support = () => {
  const [activeTab, setActiveTab] = useState('troubleshooting')
  const [guides, setGuides] = useState([])
  const [faq, setFaq] = useState([])
  const [loading, setLoading] = useState(false)
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    message: '',
    priority: 'normal',
    category: 'general'
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (activeTab === 'troubleshooting') {
      loadTroubleshooting()
    } else if (activeTab === 'faq') {
      loadFAQ()
    }
  }, [activeTab])

  const loadTroubleshooting = async () => {
    try {
      setLoading(true)
      const response = await apiCall(API_ENDPOINTS.TROUBLESHOOTING_GUIDES)
      setGuides(response.guides || [])
    } catch (error) {
      console.error('Failed to load guides:', error)
      // Fallback mock data
      setGuides([
        {
          issue: 'Chatbot not responding',
          solution: 'Check if bot is paused in settings. Ensure internet connection. Try restarting the conversation.',
          category: 'chatbot',
          tags: ['bot', 'response', 'connection']
        },
        {
          issue: 'Payment link not working',
          solution: 'Verify Paystack keys are configured. Check payment account settings. Ensure amount is valid.',
          category: 'payments',
          tags: ['payment', 'paystack', 'link']
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadFAQ = async () => {
    try {
      setLoading(true)
      const response = await apiCall(API_ENDPOINTS.FAQ)
      setFaq(response.faq || [])
    } catch (error) {
      console.error('Failed to load FAQ:', error)
      // Fallback mock data
      setFaq([
        {
          question: 'How do I add products to my inventory?',
          answer: 'Go to the Products tab and click "Add Product". Fill in the name, price, stock level, and optional description.'
        },
        {
          question: 'How does the AI chatbot work?',
          answer: 'The chatbot automatically responds to customer inquiries and can create payment links for orders.'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitTicket = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await apiCall(API_ENDPOINTS.SUBMIT_SUPPORT_TICKET, {
        method: 'POST',
        body: JSON.stringify(ticketForm)
      })

      alert('Support ticket submitted successfully! We\'ll respond within 24 hours.')
      setTicketForm({
        subject: '',
        message: '',
        priority: 'normal',
        category: 'general'
      })
    } catch (error) {
      console.error('Failed to submit ticket:', error)
      alert('Failed to submit ticket. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const tabs = [
    { id: 'troubleshooting', label: 'Troubleshooting', icon: '🔧' },
    { id: 'faq', label: 'FAQ', icon: '❓' },
    { id: 'contact', label: 'Contact Support', icon: '📧' }
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
          Support Center
        </h1>
        <p className="text-gray-600">
          Find answers to common questions or get help from our support team.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'troubleshooting' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Troubleshooting Guides</h2>
            <p className="text-gray-600">Find solutions to common issues.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {guides.map((guide, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{guide.issue}</h3>
                  <p className="text-gray-600 mb-3">{guide.solution}</p>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {guide.category}
                    </span>
                    {guide.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'faq' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Frequently Asked Questions</h2>
            <p className="text-gray-600">Quick answers to common questions.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {faq.map((item, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.question}</h3>
                  <p className="text-gray-600">{item.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'contact' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Contact Support</h2>
            <p className="text-gray-600">Can't find what you're looking for? Submit a support ticket.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <form onSubmit={handleSubmitTicket}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of your issue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({...ticketForm, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({...ticketForm, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing</option>
                  <option value="feature_request">Feature Request</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  required
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your issue in detail..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Support Ticket'
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Response Time</h3>
            <p className="text-blue-800">
              We typically respond to support tickets within 24 hours. For urgent technical issues, please call our support line.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Support


