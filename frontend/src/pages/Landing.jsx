import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'

// Moonlight Color Palette
const colors = {
  lavender: '#CCCCFF',
  violet: '#5C5C99',
  indigo: '#292966',
}

const Landing = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const { theme, toggleTheme } = useContext(ThemeContext)
  const isDark = theme === 'dark'

  // Redirect logged-in users to dashboard (for PWA homescreen)
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className={`min-h-screen font-['SF_Pro_Display',-apple-system,sans-serif] ${isDark ? 'bg-[#0a0a14]' : 'bg-[#fafaff]'}`}>

      {/* Ambient Gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[150px] ${isDark ? 'bg-[#5C5C99]/30' : 'bg-[#CCCCFF]/50'}`}></div>
        <div className={`absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-[120px] ${isDark ? 'bg-[#292966]/40' : 'bg-[#CCCCFF]/30'}`}></div>
        <div className={`absolute bottom-20 right-1/4 w-60 h-60 rounded-full blur-[100px] ${isDark ? 'bg-[#5C5C99]/20' : 'bg-[#CCCCFF]/40'}`}></div>
      </div>

      {/* Navigation */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b ${isDark ? 'bg-[#0a0a14]/80 border-white/5' : 'bg-white/80 border-black/5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}>
                <span className="text-white font-black text-lg">K</span>
              </div>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>KOFA</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className={`text-sm font-medium transition-colors ${isDark ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Features</a>
              <a href="#pricing" className={`text-sm font-medium transition-colors ${isDark ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Pricing</a>
              <button onClick={toggleTheme} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}>
                {isDark ? '☀️' : '🌙'}
              </button>
              <Link to="/login" className={`text-sm font-medium transition-colors ${isDark ? 'text-white/80 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}>Login</Link>
              <Link to="/signup" className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105 active:scale-95" style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}>
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className={`inline-flex items-center px-4 py-2 rounded-full mb-8 ${isDark ? 'bg-[#5C5C99]/20 border border-[#5C5C99]/30' : 'bg-[#CCCCFF]/30 border border-[#5C5C99]/20'}`}>
              <span className={`text-sm font-medium ${isDark ? 'text-[#CCCCFF]' : 'text-[#5C5C99]'}`}>
                🚀 AI-Powered Sales Automation
              </span>
            </div>

            <h1 className={`text-5xl md:text-7xl font-bold mb-6 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Turn Social Media
              <br />
              <span style={{ color: colors.violet }}>Into Sales</span>
            </h1>

            <p className={`text-xl max-w-2xl mx-auto mb-10 leading-relaxed ${isDark ? 'text-white/50' : 'text-gray-600'}`}>
              KOFA's AI handles customer inquiries 24/7 on WhatsApp, Instagram, and TikTok.
              Smart inventory prevents overselling while you focus on growth.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all hover:scale-105 active:scale-95 shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})`, boxShadow: `0 10px 40px ${colors.violet}40` }}>
                Start Free Trial
              </Link>
              <button className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all border-2 ${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                Watch Demo
              </button>
            </div>

            <p className={`text-sm mt-6 ${isDark ? 'text-white/30' : 'text-gray-500'}`}>
              ✓ Free setup • ✓ Cancel anytime • ✓ Nigerian payment support
            </p>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="relative max-w-5xl mx-auto px-4 mt-16">
          <div className={`rounded-3xl p-6 backdrop-blur-xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white/80 border border-black/[0.05] shadow-2xl'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat Preview */}
              <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: `linear-gradient(135deg, ${colors.indigo}, ${colors.violet})` }}>
                <div className={`rounded-xl p-4 h-72 ${isDark ? 'bg-[#0a0a14]' : 'bg-gray-800'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">💬</div>
                    <div>
                      <p className="text-white font-semibold">KOFA Assistant</p>
                      <p className="text-gray-400 text-xs">Online</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-[#5C5C99] text-white p-3 rounded-xl rounded-bl-none max-w-[70%] text-sm">
                      Hi! Do you have the black leather bag in stock?
                    </div>
                    <div className="bg-[#292966] text-white p-3 rounded-xl rounded-br-none max-w-[70%] ml-auto text-sm">
                      Yes! It's ₦45,000. Want me to send payment details? 💳
                    </div>
                    <div className="bg-[#5C5C99] text-white p-3 rounded-xl rounded-bl-none max-w-[70%] text-sm">
                      Perfect! Please send the link 🙏
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-4">
                <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <p className="text-emerald-100 text-xs font-medium">Today's Sales</p>
                  <p className="text-2xl font-bold">₦85,000</p>
                  <p className="text-emerald-100 text-xs mt-1">+23% from yesterday</p>
                </div>
                <div className="rounded-2xl p-5" style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}>
                  <p className="text-[#CCCCFF] text-xs font-medium">AI Messages</p>
                  <p className="text-2xl font-bold text-white">156</p>
                  <p className="text-[#CCCCFF] text-xs mt-1">Handled today</p>
                </div>
                <div className={`rounded-2xl p-5 ${isDark ? 'bg-white/[0.05]' : 'bg-gray-100'}`}>
                  <p className={`text-xs font-medium ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Products</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>47</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>In stock</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-24 ${isDark ? 'bg-white/[0.02]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Everything You Need to Scale
            </h2>
            <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-white/50' : 'text-gray-600'}`}>
              From inventory to AI sales, KOFA handles it all.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🤖', title: 'AI Chatbot', desc: '24/7 automated responses on WhatsApp, Instagram, TikTok' },
              { icon: '📦', title: 'Smart Inventory', desc: 'Real-time stock tracking prevents overselling' },
              { icon: '📊', title: 'Business Insights', desc: 'Track sales and customer behavior' },
              { icon: '💳', title: 'Easy Payments', desc: 'Integrated Paystack with instant links' },
              { icon: '📱', title: 'Multi-Platform', desc: 'Manage all channels from one dashboard' },
              { icon: '📈', title: 'Scale Easily', desc: 'Start free, handle hundreds of chats' },
            ].map((feature, i) => (
              <div key={i} className={`group rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-white/[0.03] border border-white/[0.06] hover:border-[#5C5C99]/50' : 'bg-gray-50 border border-gray-100 hover:border-[#5C5C99]/30'}`}>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${isDark ? 'bg-[#5C5C99]/20' : 'bg-[#CCCCFF]/30'}`}>
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                <p className={`${isDark ? 'text-white/50' : 'text-gray-600'}`}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24" style={{ background: `linear-gradient(135deg, ${colors.indigo}, ${colors.violet})` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-12">Trusted by Nigerian Businesses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '👗', name: "Sarah's Fashion Hub", quote: "Sales increased 300% in the first month." },
              { icon: '📱', name: 'TechHub Electronics', quote: "24/7 chatbot is like having a dedicated team." },
              { icon: '💄', name: 'Beauty by Grace', quote: "No more overselling. My margins improved." },
            ].map((t, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-4xl mb-4">{t.icon}</div>
                <p className="text-white font-semibold mb-2">{t.name}</p>
                <p className="text-white/70">"{t.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={`py-24 ${isDark ? 'bg-[#0a0a14]' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Simple Pricing</h2>
            <p className={`text-xl ${isDark ? 'text-white/50' : 'text-gray-600'}`}>Start free, upgrade as you grow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className={`rounded-2xl p-6 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-gray-200 shadow-lg'}`}>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Free</h3>
              <div className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>₦0</div>
              <ul className="space-y-3 mb-6">
                {['50 products', 'Basic AI chatbot', 'WhatsApp only', 'Basic analytics'].map((f, i) => (
                  <li key={i} className={`flex items-center text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    <span className="text-emerald-500 mr-2">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className={`block w-full py-3 rounded-xl font-semibold text-center transition-colors ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                Get Started
              </Link>
            </div>

            {/* Starter - Popular */}
            <div className="rounded-2xl p-6 relative transform md:scale-105 text-white" style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Popular
              </div>
              <h3 className="text-xl font-bold mb-2">Starter</h3>
              <div className="text-4xl font-bold mb-4">₦5,000<span className="text-lg font-normal text-white/70">/mo</span></div>
              <ul className="space-y-3 mb-6">
                {['200 products', 'Advanced AI', 'WhatsApp + Instagram', 'Full analytics', 'Priority support'].map((f, i) => (
                  <li key={i} className="flex items-center text-sm text-white/90">
                    <span className="mr-2">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block w-full py-3 rounded-xl font-semibold text-center bg-white text-[#5C5C99] hover:bg-gray-100 transition-colors">
                Start Free Trial
              </Link>
            </div>

            {/* Professional */}
            <div className={`rounded-2xl p-6 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-gray-200 shadow-lg'}`}>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Professional</h3>
              <div className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>₦15,000<span className="text-lg font-normal opacity-50">/mo</span></div>
              <ul className="space-y-3 mb-6">
                {['Unlimited products', 'Premium AI', 'All platforms', 'Advanced analytics', 'White-label'].map((f, i) => (
                  <li key={i} className={`flex items-center text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    <span className="text-emerald-500 mr-2">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block w-full py-3 rounded-xl font-semibold text-center text-white transition-all hover:scale-105" style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}>
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24" style={{ background: `linear-gradient(135deg, ${colors.indigo}, ${colors.violet})` }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Automate Your Sales?</h2>
          <p className="text-xl text-[#CCCCFF] mb-10">Join hundreds of Nigerian vendors already using KOFA.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="bg-white text-[#5C5C99] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all shadow-lg">
              Start Free Trial
            </Link>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-[#5C5C99] transition-all">
              Book a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 ${isDark ? 'bg-[#0a0a14]' : 'bg-gray-900'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}>
                <span className="text-white font-black text-lg">K</span>
              </div>
              <span className="text-white font-semibold">KOFA Commerce Engine</span>
            </div>
            <div className="flex gap-6 text-gray-400 text-sm">
              <a href="#" className="hover:text-white">Features</a>
              <a href="#" className="hover:text-white">Pricing</a>
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Terms</a>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-500 text-sm">
            © 2026 KOFA Commerce Engine. Made for Nigerian vendors.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing

