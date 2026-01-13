import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Package, Check, MessageSquare, BarChart3, CreditCard, Smartphone, TrendingUp } from 'lucide-react'

const Landing = () => {
  const { isAuthenticated, isLoading } = useAuth()

  // Redirect logged-in users to dashboard
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const features = [
    { icon: MessageSquare, title: 'AI Chatbot', desc: '24/7 automated responses on WhatsApp, Instagram, TikTok' },
    { icon: Package, title: 'Smart Inventory', desc: 'Real-time stock tracking prevents overselling' },
    { icon: BarChart3, title: 'Business Insights', desc: 'Track sales and customer behavior' },
    { icon: CreditCard, title: 'Easy Payments', desc: 'Integrated Paystack with instant links' },
    { icon: Smartphone, title: 'Multi-Platform', desc: 'Manage all channels from one dashboard' },
    { icon: TrendingUp, title: 'Scale Easily', desc: 'Start free, handle hundreds of chats' }
  ]

  const testimonials = [
    { icon: '👗', name: "Sarah's Fashion Hub", quote: "Sales increased 300% in the first month." },
    { icon: '📱', name: 'TechHub Electronics', quote: "24/7 chatbot is like having a dedicated team." },
    { icon: '💄', name: 'Beauty by Grace', quote: "No more overselling. My margins improved." }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0095FF] rounded-xl flex items-center justify-center">
                <Package size={20} className="text-white" />
              </div>
              <span className="font-bold text-gray-900">KOFA</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <Link to="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
              <Link to="/signup" className="btn-primary text-sm py-2">Start Free</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center bg-blue-50 text-[#0095FF] px-4 py-2 rounded-full text-sm font-medium mb-6">
            🚀 AI-Powered Sales Automation
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Turn Social Media<br />
            <span className="text-[#0095FF]">Into Sales</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            KOFA's AI handles customer inquiries 24/7 on WhatsApp, Instagram, and TikTok.
            Smart inventory prevents overselling while you focus on growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="btn-primary text-lg px-8 py-4">
              Start Free Trial
            </Link>
            <button className="btn-outline text-lg px-8 py-4">
              Watch Demo
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-6">
            ✓ Free setup • ✓ Cancel anytime • ✓ Nigerian payment support
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[#F5F7FA] px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need to Scale</h2>
            <p className="text-gray-500 text-lg">From inventory to AI sales, KOFA handles it all.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="stitch-card p-6 hover:shadow-lg transition-shadow">
                  <div className="icon-circle blue mb-4">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-[#0095FF] px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-12">Trusted by Nigerian Businesses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-6 text-left">
                <div className="text-3xl mb-4">{t.icon}</div>
                <p className="text-white font-medium mb-2">{t.name}</p>
                <p className="text-white/70">"{t.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple Pricing</h2>
            <p className="text-gray-500 text-lg">Start free, upgrade as you grow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="stitch-card p-6">
              <h3 className="font-bold text-gray-900 mb-2">Free</h3>
              <p className="text-3xl font-bold text-gray-900 mb-4">₦0</p>
              <ul className="space-y-3 mb-6">
                {['50 products', 'Basic AI chatbot', 'WhatsApp only', 'Basic analytics'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                    <Check size={16} className="text-green-500" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="btn-outline w-full">Get Started</Link>
            </div>

            {/* Starter */}
            <div className="stitch-card p-6 border-2 border-[#0095FF] relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0095FF] text-white text-xs font-bold px-3 py-1 rounded-full">
                Popular
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Starter</h3>
              <p className="text-3xl font-bold text-gray-900 mb-4">₦5,000<span className="text-sm font-normal text-gray-400">/mo</span></p>
              <ul className="space-y-3 mb-6">
                {['200 products', 'Advanced AI', 'WhatsApp + Instagram', 'Full analytics', 'Priority support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                    <Check size={16} className="text-green-500" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="btn-primary w-full">Start Free Trial</Link>
            </div>

            {/* Professional */}
            <div className="stitch-card p-6">
              <h3 className="font-bold text-gray-900 mb-2">Professional</h3>
              <p className="text-3xl font-bold text-gray-900 mb-4">₦15,000<span className="text-sm font-normal text-gray-400">/mo</span></p>
              <ul className="space-y-3 mb-6">
                {['Unlimited products', 'Premium AI', 'All platforms', 'Advanced analytics', 'White-label'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                    <Check size={16} className="text-green-500" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="btn-primary w-full">Start Free Trial</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#0095FF] px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Automate Your Sales?</h2>
          <p className="text-white/70 text-lg mb-10">Join hundreds of Nigerian vendors already using KOFA.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="bg-white text-[#0095FF] px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition">
              Start Free Trial
            </Link>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-[#0095FF] transition">
              Book a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0095FF] rounded-xl flex items-center justify-center">
              <Package size={20} className="text-white" />
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
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-500 text-sm max-w-6xl mx-auto">
          © 2026 KOFA Commerce Engine. Made for Nigerian vendors.
        </div>
      </footer>
    </div>
  )
}

export default Landing
