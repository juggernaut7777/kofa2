import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'

const Landing = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const { theme, toggleTheme } = useContext(ThemeContext)

  // Redirect logged-in users to dashboard (for PWA homescreen)
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark'
        ? 'bg-dark-bg'
        : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
      }`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 transition-colors duration-300 ${theme === 'dark'
          ? 'bg-dark-card/90 backdrop-blur-xl border-b border-dark-border'
          : 'bg-white/80 backdrop-blur-md border-b border-gray-100'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-kofa-gradient p-2 rounded-lg shadow-kofa">
                <span className="text-white font-bold text-xl">KOFA</span>
              </div>
              <span className={`ml-3 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Commerce Engine
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`hover:text-kofa-cobalt transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Features
              </a>
              <a href="#pricing" className={`hover:text-kofa-cobalt transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Pricing
              </a>
              <a href="#about" className={`hover:text-kofa-cobalt transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                About
              </a>
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                    ? 'bg-dark-border hover:bg-kofa-navy/30 text-yellow-400'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <Link to="/login" className={`font-medium hover:text-kofa-cobalt transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Login
              </Link>
              <Link to="/signup" className="kofa-button px-6 py-2 rounded-lg font-medium">
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
            <div className={`inline-flex items-center px-4 py-2 rounded-full mb-8 ${theme === 'dark' ? 'bg-kofa-cobalt/20' : 'bg-blue-100'
              }`}>
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-kofa-sky' : 'text-kofa-cobalt'}`}>
                🚀 AI-Powered Sales Automation
              </span>
            </div>
            <h1 className={`text-5xl md:text-7xl font-bold mb-6 ${theme === 'dark'
                ? 'kofa-gradient-text'
                : 'bg-gradient-to-r from-kofa-navy via-kofa-cobalt to-kofa-sky bg-clip-text text-transparent'
              }`}>
              Turn Your Social Media
              <br />
              Into a Sales Machine
            </h1>
            <p className={`text-xl max-w-3xl mx-auto mb-10 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
              KOFA's AI chatbot handles customer inquiries 24/7 across WhatsApp, Instagram, and TikTok.
              Smart inventory tracking prevents overselling while you focus on growing your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="kofa-button px-8 py-4 rounded-xl font-semibold text-lg">
                Start Free Trial - No Card Required
              </Link>
              <button className={`border-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${theme === 'dark'
                  ? 'border-kofa-steel text-gray-300 hover:border-kofa-sky hover:bg-kofa-sky/10'
                  : 'border-gray-300 text-gray-700 hover:border-kofa-cobalt hover:bg-blue-50'
                }`}>
                Watch Demo Video
              </button>
            </div>
            <p className={`text-sm mt-6 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
              ✓ Free setup in under 5 minutes • ✓ Cancel anytime • ✓ Nigerian payment support
            </p>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className={`rounded-2xl shadow-2xl p-8 ${theme === 'dark'
              ? 'bg-dark-card border border-dark-border'
              : 'bg-white border border-gray-200'
            }`}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Phone Mockup */}
              <div className="lg:col-span-2">
                <div className="bg-kofa-navy rounded-3xl p-4 shadow-kofa-lg">
                  <div className={`rounded-2xl p-6 h-96 flex flex-col ${theme === 'dark' ? 'bg-dark-bg' : 'bg-gray-800'
                    }`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">💬</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">KOFA Assistant</p>
                          <p className="text-gray-400 text-sm">Online</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="bg-kofa-cobalt text-white p-3 rounded-lg max-w-xs">
                        Hi! I'm interested in your designer handbags. Do you have the black leather one in stock?
                      </div>
                      <div className="bg-kofa-steel text-white p-3 rounded-lg max-w-xs ml-auto">
                        Yes! We have the black leather handbag in stock. It's ₦45,000. Would you like me to send payment details?
                      </div>
                      <div className="bg-kofa-cobalt text-white p-3 rounded-lg max-w-xs">
                        Perfect! Please send the payment link.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Panel */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-success to-emerald-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Today's Sales</p>
                      <p className="text-2xl font-bold">₦85,000</p>
                    </div>
                    <span className="text-3xl">💰</span>
                  </div>
                </div>

                <div className="bg-kofa-gradient rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">AI Messages</p>
                      <p className="text-2xl font-bold">156</p>
                    </div>
                    <span className="text-3xl">🤖</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-kofa-steel to-kofa-navy rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm">Products</p>
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
      <section id="features" className={`py-24 ${theme === 'dark' ? 'bg-dark-card' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Everything You Need to Scale Your Business
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              From inventory management to AI-powered sales, KOFA handles the heavy lifting so you can focus on growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🤖', title: 'AI Chatbot', desc: 'Never miss a sale with 24/7 automated responses on WhatsApp, Instagram, and TikTok.', color: 'blue' },
              { icon: '📦', title: 'Smart Inventory', desc: 'Real-time stock tracking prevents overselling. Get alerts when products run low.', color: 'green' },
              { icon: '📊', title: 'Business Insights', desc: 'Track sales, revenue, and customer behavior across all platforms.', color: 'purple' },
              { icon: '💳', title: 'Easy Payments', desc: 'Integrated Paystack payments with instant payment links.', color: 'orange' },
              { icon: '📱', title: 'Multi-Platform', desc: 'Manage all your social media sales channels from one dashboard.', color: 'pink' },
              { icon: '📈', title: 'Scale Effortlessly', desc: 'Start with 50 products free. Handle hundreds of conversations without extra staff.', color: 'cyan' },
            ].map((feature, index) => (
              <div key={index} className={`rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${theme === 'dark'
                  ? 'bg-dark-bg border border-dark-border hover:border-kofa-cobalt/50'
                  : 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100'
                }`}>
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 ${theme === 'dark' ? 'bg-kofa-cobalt/20' : 'bg-blue-100'
                  }`}>
                  <span className="text-3xl">{feature.icon}</span>
                </div>
                <h3 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-kofa-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-12">Trusted by Nigerian Businesses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '👗', name: "Sarah's Fashion Hub", quote: "KOFA increased my sales by 300% in the first month." },
              { icon: '📱', name: 'TechHub Electronics', quote: "No more missed sales at night. 24/7 chatbot is like having a dedicated team." },
              { icon: '💄', name: 'Beauty by Grace', quote: "Inventory tracking saved me from overselling. My margins improved significantly." },
            ].map((testimonial, index) => (
              <div key={index} className="glass-dark rounded-2xl p-8">
                <div className="text-4xl mb-4">{testimonial.icon}</div>
                <p className="text-white text-lg font-semibold mb-2">{testimonial.name}</p>
                <p className="text-gray-300">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={`py-24 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Simple, Transparent Pricing
            </h2>
            <p className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Start free, upgrade as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className={`rounded-2xl shadow-xl border-2 p-8 ${theme === 'dark'
                ? 'bg-dark-card border-dark-border'
                : 'bg-white border-gray-200'
              }`}>
              <div className="text-center mb-8">
                <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Free</h3>
                <div className={`text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>₦0</div>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Perfect for getting started</p>
              </div>
              <ul className="space-y-4 mb-8">
                {['Up to 50 products', 'Basic AI chatbot', 'WhatsApp integration', 'Basic analytics'].map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <span className="text-success mr-3">✓</span>
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup" className={`w-full py-3 px-6 rounded-xl font-semibold block text-center transition-colors ${theme === 'dark'
                  ? 'bg-kofa-steel text-white hover:bg-kofa-navy'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}>
                Get Started Free
              </Link>
            </div>

            {/* Starter Plan */}
            <div className="bg-kofa-gradient rounded-2xl shadow-xl text-white p-8 relative transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-success text-white px-4 py-2 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Starter</h3>
                <div className="text-4xl font-bold mb-2">₦5,000</div>
                <p className="text-kofa-sky">per month</p>
              </div>
              <ul className="space-y-4 mb-8">
                {['Up to 200 products', 'Advanced AI chatbot', 'WhatsApp + Instagram', 'Full analytics', 'Priority support'].map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <span className="text-white mr-3">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="w-full bg-white text-kofa-cobalt py-3 px-6 rounded-xl hover:bg-gray-100 transition-colors font-semibold block text-center">
                Start Free Trial
              </Link>
            </div>

            {/* Professional Plan */}
            <div className={`rounded-2xl shadow-xl border-2 p-8 ${theme === 'dark'
                ? 'bg-dark-card border-dark-border'
                : 'bg-white border-gray-200'
              }`}>
              <div className="text-center mb-8">
                <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Professional</h3>
                <div className={`text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>₦15,000</div>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>per month</p>
              </div>
              <ul className="space-y-4 mb-8">
                {['Unlimited products', 'Premium AI chatbot', 'All platforms', 'Advanced analytics', 'White-label option'].map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <span className="text-success mr-3">✓</span>
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="kofa-button w-full py-3 px-6 rounded-xl font-semibold block text-center">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-kofa-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Turn Your Social Media Into Sales?
          </h2>
          <p className="text-xl text-kofa-sky mb-10">
            Join hundreds of Nigerian vendors already using KOFA to automate their sales and grow their businesses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="bg-white text-kofa-cobalt px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-200 font-semibold text-lg shadow-lg">
              Start Your Free Trial Now
            </Link>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl hover:bg-white hover:text-kofa-cobalt transition-all duration-200 font-semibold text-lg">
              Schedule a Demo Call
            </button>
          </div>
          <p className="text-kofa-sky mt-6 text-sm">
            ✓ 5-minute setup • ✓ No credit card required • ✓ Cancel anytime • ✓ Nigerian support
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 ${theme === 'dark' ? 'bg-dark-card' : 'bg-kofa-navy'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="bg-kofa-gradient p-2 rounded-lg">
                  <span className="text-white font-bold text-xl">KOFA</span>
                </div>
                <span className="ml-3 text-gray-400">Commerce Engine</span>
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
              <h4 className="font-semibold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API Docs</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 KOFA Commerce Engine. All rights reserved. Made for Nigerian vendors.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
