import { Link } from 'react-router-dom'

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <span className="text-white font-bold text-xl">KOFA</span>
              </div>
              <span className="ml-3 text-gray-600 font-medium">Commerce Engine</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
              <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">About</a>
              <Link to="/login" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Login
              </Link>
              <Link to="/signup" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center bg-blue-100 px-4 py-2 rounded-full mb-8">
              <span className="text-blue-800 text-sm font-medium">🚀 AI-Powered Sales Automation</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-6">
              Turn Your Social Media
              <br />
              Into a Sales Machine
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              KOFA's AI chatbot handles customer inquiries 24/7 across WhatsApp, Instagram, and TikTok.
              Smart inventory tracking prevents overselling while you focus on growing your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold text-lg shadow-lg">
                Start Free Trial - No Card Required
              </Link>
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 font-semibold text-lg">
                Watch Demo Video
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-6">✓ Free setup in under 5 minutes • ✓ Cancel anytime • ✓ Nigerian payment support</p>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Phone Mockup */}
              <div className="lg:col-span-2">
                <div className="bg-gray-900 rounded-3xl p-4 shadow-2xl">
                  <div className="bg-gray-800 rounded-2xl p-6 h-96 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">💬</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">KOFA Assistant</p>
                          <p className="text-gray-400 text-sm">Online</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="bg-blue-600 text-white p-3 rounded-lg max-w-xs">
                        Hi! I'm interested in your designer handbags. Do you have the black leather one in stock?
                      </div>
                      <div className="bg-gray-700 text-white p-3 rounded-lg max-w-xs ml-auto">
                        Yes! We have the black leather handbag in stock. It's ₦45,000. Would you like me to send payment details?
                      </div>
                      <div className="bg-blue-600 text-white p-3 rounded-lg max-w-xs">
                        Perfect! Please send the payment link.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Panel */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Today's Sales</p>
                      <p className="text-2xl font-bold">₦85,000</p>
                    </div>
                    <span className="text-3xl">💰</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">AI Messages</p>
                      <p className="text-2xl font-bold">156</p>
                    </div>
                    <span className="text-3xl">🤖</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Products</p>
                      <p className="text-2xl font-bold">47</p>
                    </div>
                    <span className="text-3xl">📦</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Scale Your Business
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From inventory management to AI-powered sales, KOFA handles the heavy lifting so you can focus on growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
              <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Chatbot</h3>
              <p className="text-gray-600 leading-relaxed">
                Never miss a sale with 24/7 automated responses on WhatsApp, Instagram, and TikTok.
                Your AI assistant knows your inventory and handles customer inquiries intelligently.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
              <div className="bg-green-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">📦</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Inventory</h3>
              <p className="text-gray-600 leading-relaxed">
                Real-time stock tracking prevents overselling. Get alerts when products run low,
                and your chatbot automatically stops selling out-of-stock items.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 border border-purple-100">
              <div className="bg-purple-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Business Insights</h3>
              <p className="text-gray-600 leading-relaxed">
                Track sales, revenue, and customer behavior across all platforms.
                Make data-driven decisions to grow your business.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border border-orange-100">
              <div className="bg-orange-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">💳</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Easy Payments</h3>
              <p className="text-gray-600 leading-relaxed">
                Integrated Paystack payments with instant payment links.
                Your chatbot sends payment details automatically after confirming orders.
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-8 border border-pink-100">
              <div className="bg-pink-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Multi-Platform</h3>
              <p className="text-gray-600 leading-relaxed">
                Manage all your social media sales channels from one dashboard.
                WhatsApp, Instagram, TikTok - all working together.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-8 border border-cyan-100">
              <div className="bg-cyan-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">📈</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Scale Effortlessly</h3>
              <p className="text-gray-600 leading-relaxed">
                Start with 50 products for free. Upgrade as you grow.
                Handle hundreds of customer conversations without hiring extra staff.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-12">Trusted by Nigerian Businesses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <div className="text-4xl mb-4">👗</div>
              <p className="text-white text-lg font-semibold mb-2">Sarah's Fashion Hub</p>
              <p className="text-gray-300">"KOFA increased my sales by 300% in the first month. The AI chatbot handles all my customer inquiries!"</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <div className="text-4xl mb-4">📱</div>
              <p className="text-white text-lg font-semibold mb-2">TechHub Electronics</p>
              <p className="text-gray-300">"No more missed sales at night. KOFA's 24/7 chatbot is like having a dedicated sales team."</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <div className="text-4xl mb-4">💄</div>
              <p className="text-white text-lg font-semibold mb-2">Beauty by Grace</p>
              <p className="text-gray-300">"The inventory tracking saved me from overselling products. My profit margins improved significantly."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Start free, upgrade as you grow. No hidden fees.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">₦0</div>
                <p className="text-gray-600">Perfect for getting started</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>Up to 50 products</span>
                </li>
                <li classNameName="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>Basic AI chatbot</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>WhatsApp integration</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>Basic analytics</span>
                </li>
              </ul>
              <Link to="/signup" className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl hover:bg-gray-800 transition-colors font-semibold block text-center">
                Get Started Free
              </Link>
            </div>

            {/* Starter Plan */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl text-white p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Starter</h3>
                <div className="text-4xl font-bold mb-2">₦5,000</div>
                <p className="text-blue-100">per month</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="text-white mr-3">✓</span>
                  <span>Up to 200 products</span>
                </li>
                <li className="flex items-center">
                  <span className="text-white mr-3">✓</span>
                  <span>Advanced AI chatbot</span>
                </li>
                <li className="flex items-center">
                  <span className="text-white mr-3">✓</span>
                  <span>WhatsApp + Instagram</span>
                </li>
                <li className="flex items-center">
                  <span className="text-white mr-3">✓</span>
                  <span>Full analytics</span>
                </li>
                <li className="flex items-center">
                  <span className="text-white mr-3">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
              <Link to="/signup" className="w-full bg-white text-blue-600 py-3 px-6 rounded-xl hover:bg-gray-100 transition-colors font-semibold block text-center">
                Start Free Trial
              </Link>
            </div>

            {/* Professional Plan */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">₦15,000</div>
                <p className="text-gray-600">per month</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>Unlimited products</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>Premium AI chatbot</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>All platforms (WhatsApp, IG, TikTok)</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>White-label option</span>
                </li>
              </ul>
              <Link to="/signup" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors font-semibold block text-center">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Turn Your Social Media Into Sales?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join hundreds of Nigerian vendors already using KOFA to automate their sales and grow their businesses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-200 font-semibold text-lg shadow-lg">
              Start Your Free Trial Now
            </Link>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-200 font-semibold text-lg">
              Schedule a Demo Call
            </button>
          </div>
          <p className="text-blue-200 mt-6 text-sm">
            ✓ 5-minute setup • ✓ No credit card required • ✓ Cancel anytime • ✓ Nigerian support
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <span className="text-white font-bold text-xl">KOFA</span>
                </div>
                <span className="ml-3 text-gray-300">Commerce Engine</span>
              </div>
              <p className="text-gray-400 mb-4">
                AI-powered commerce platform helping Nigerian vendors automate sales and scale their businesses.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">WhatsApp</a>
                <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
                <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API Docs</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 KOFA Commerce Engine. All rights reserved. Made for Nigerian vendors.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
