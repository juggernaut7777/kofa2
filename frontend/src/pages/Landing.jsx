import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Package, Check, MessageSquare, ChevronRight,
  ScanLine, Store, Zap, TrendingUp, Smartphone,
  ShoppingBag, ArrowRight, Menu, Star, X
} from 'lucide-react'

const Landing = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const MockupImage = ({ src, alt, className }) => (
    <div className={`relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
      <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-gray-50 font-sans text-gray-900">

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#0095FF] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Package size={20} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">KOFA</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-[#0095FF] transition-colors">Features</a>
            <a href="#pricing" className="hover:text-[#0095FF] transition-colors">Pricing</a>
            <Link to="/login" className="hover:text-[#0095FF] transition-colors">Login</Link>
          </div>
          <Link to="/signup" className="hidden md:block">
            <button className="bg-[#0095FF] hover:bg-[#0077CC] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-lg shadow-blue-500/25">
              Get Started
            </button>
          </Link>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
            <a href="#features" className="block text-gray-600 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" className="block text-gray-600 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <Link to="/login" className="block text-gray-600 font-medium py-2">Login</Link>
            <Link to="/signup" className="block">
              <button className="w-full bg-[#0095FF] text-white py-3 rounded-xl font-semibold">Get Started</button>
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <header className="px-6 py-20 lg:py-32 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-[#0095FF] px-4 py-1.5 rounded-full text-sm font-semibold mb-8 border border-blue-200/50 shadow-sm">
          <Zap size={14} fill="currentColor" /> The OS for African Commerce
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-gray-900 mb-6 leading-tight">
          Run your business on <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0095FF] to-[#00C2FF]">Autopilot.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          KOFA replaces your messy Excel sheets with AI. Manage orders, track inventory, and find profit—automatically.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/signup">
            <button className="bg-[#0095FF] hover:bg-[#0077CC] text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40">
              Start Free Trial
            </button>
          </Link>
          <a href="#features">
            <button className="bg-white hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-full text-lg font-semibold border border-gray-200 transition-colors">
              View Demo
            </button>
          </a>
        </div>
      </header>

      {/* Phone Mockup after Hero */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <div className="relative mx-auto max-w-sm">
          <div className="absolute -inset-4 bg-gradient-to-r from-[#0095FF]/20 to-[#00C2FF]/20 rounded-[2.5rem] blur-2xl" />
          <MockupImage
            src="/images/analytics-mockup.png"
            alt="KOFA Dashboard"
            className="relative max-w-full rounded-[2rem] ring-4 ring-white"
          />
        </div>
      </section>

      {/* --- FEATURES --- */}
      <div id="features">

        {/* FEATURE 1: WHATSAPP AI */}
        <section className="py-20 md:py-28 px-6 bg-white border-y border-gray-100">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="order-2 md:order-1 flex justify-center">
              <MockupImage
                src="/images/whatsapp-mockup.png"
                alt="WhatsApp AI Assistant"
                className="max-w-xs sm:max-w-sm w-full transform -rotate-2 hover:rotate-0 transition-transform duration-500"
              />
            </div>
            <div className="order-1 md:order-2 flex flex-col justify-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare size={24} />
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">WhatsApp AI Assistant.</h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                Most of your sales happen on WhatsApp. Why are you still replying manually? KOFA's AI reads your chats, checks your stock, and collects payments automatically.
              </p>
              <ul className="space-y-4 mb-8">
                {['Replies instantly 24/7', 'Knows your inventory', 'Collects delivery details'].map(f => (
                  <li key={f} className="flex gap-3 text-gray-800 font-semibold items-center">
                    <Check className="text-green-500 flex-shrink-0" size={20} strokeWidth={3} /> {f}
                  </li>
                ))}
              </ul>
              <div>
                <Link to="/signup">
                  <button className="border-2 border-gray-200 hover:border-[#0095FF] text-gray-700 hover:text-[#0095FF] px-6 py-3 rounded-full font-bold text-sm transition-colors inline-flex items-center gap-2">
                    See it in action <ArrowRight size={16} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE 2: STOREFRONT */}
        <section className="py-20 md:py-28 px-6 bg-gray-50 border-y border-gray-100">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div>
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                <Store size={24} />
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">Your Own Online Store.</h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                Get a beautiful link to share on Instagram and TikTok. Customers can browse your latest catalog, place orders, and pay without DMing you.
              </p>
              <ul className="space-y-4 mb-8">
                {['Takes orders whilst you sleep', 'Automatic inventory sync', 'Professional checkout flow'].map(f => (
                  <li key={f} className="flex gap-3 text-gray-800 font-semibold items-center">
                    <Check className="text-orange-500 flex-shrink-0" size={20} strokeWidth={3} /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <MockupImage
                src="/images/storefront-mockup.png"
                alt="Online Storefront"
                className="max-w-xs sm:max-w-sm w-full ring-4 ring-white"
              />
            </div>
          </div>
        </section>

        {/* FEATURE 3: BUSINESS AI */}
        <section className="py-20 md:py-28 px-6 bg-white">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="order-2 md:order-1 flex justify-center transform -rotate-2 hover:rotate-0 transition-transform duration-500">
              <MockupImage
                src="/images/analytics-mockup.png"
                alt="Business Analytics AI"
                className="max-w-md w-full rounded-2xl shadow-2xl"
              />
            </div>
            <div className="order-1 md:order-2 flex flex-col justify-center">
              <div className="w-12 h-12 bg-blue-100 text-[#0095FF] rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp size={24} />
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">"How much did I make?"</h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                Stop guessing. Just ask KOFA. Our Business AI analyzes your sales and expenses to tell you your true profit margins and best-selling items instantly.
              </p>
              <ul className="space-y-4">
                {['Instant profit calculations', 'Best and worst selling products', 'Expense tracking'].map(f => (
                  <li key={f} className="flex gap-3 text-gray-800 font-semibold items-center">
                    <Check className="text-[#0095FF] flex-shrink-0" size={20} strokeWidth={3} /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* --- PRICING --- */}
      <section id="pricing" className="py-20 md:py-28 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Simple, Honest Pricing</h2>
          <p className="text-lg text-gray-500">Start free. Upgrade when you're ready.</p>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Free</h3>
            <p className="text-gray-400 text-sm mb-6">Get started</p>
            <div className="mb-6">
              <span className="text-4xl font-black text-gray-900">₦0</span>
              <span className="text-gray-400 text-sm"> /month</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-gray-600">
              {['5 products', '15 AI queries/month', 'Basic analytics', 'Online storefront'].map(f => (
                <li key={f} className="flex gap-2 items-center"><Check size={16} className="text-green-500 flex-shrink-0" /> {f}</li>
              ))}
            </ul>
            <Link to="/signup">
              <button className="w-full py-3 rounded-xl font-semibold text-sm border-2 border-gray-200 text-gray-700 hover:border-[#0095FF] hover:text-[#0095FF] transition-colors">
                Start Free
              </button>
            </Link>
          </div>

          {/* Grow - Popular */}
          <div className="bg-white rounded-2xl p-8 border-2 border-[#0095FF] shadow-lg shadow-blue-500/10 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-[#0095FF] text-white text-xs font-bold px-4 py-1 rounded-full">POPULAR</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Grow</h3>
            <p className="text-gray-400 text-sm mb-6">For growing businesses</p>
            <div className="mb-6">
              <span className="text-4xl font-black text-gray-900">₦4,500</span>
              <span className="text-gray-400 text-sm"> /month</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-gray-600">
              {['Unlimited products', '150 AI queries/month', 'Full analytics & insights', 'CSV import/export', 'Priority support'].map(f => (
                <li key={f} className="flex gap-2 items-center"><Check size={16} className="text-[#0095FF] flex-shrink-0" /> {f}</li>
              ))}
            </ul>
            <Link to="/signup">
              <button className="w-full py-3 rounded-xl font-semibold text-sm bg-[#0095FF] hover:bg-[#0077CC] text-white transition-colors shadow-lg shadow-blue-500/25">
                Start Growing
              </button>
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Pro</h3>
            <p className="text-gray-400 text-sm mb-6">For power sellers</p>
            <div className="mb-6">
              <span className="text-4xl font-black text-gray-900">₦10,000</span>
              <span className="text-gray-400 text-sm"> /month</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-gray-600">
              {['Everything in Grow', '1,000 AI queries/month', '3 team members', 'WhatsApp AI bot', 'Advanced reports'].map(f => (
                <li key={f} className="flex gap-2 items-center"><Check size={16} className="text-green-500 flex-shrink-0" /> {f}</li>
              ))}
            </ul>
            <Link to="/signup">
              <button className="w-full py-3 rounded-xl font-semibold text-sm border-2 border-gray-200 text-gray-700 hover:border-[#0095FF] hover:text-[#0095FF] transition-colors">
                Go Pro
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-6 bg-gradient-to-b from-white to-blue-50/50">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">Ready to professionalize your hustle?</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Join thousands of Nigerian vendors already using KOFA to grow their business.</p>
        <Link to="/signup">
          <button className="bg-[#0095FF] hover:bg-[#0077CC] text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40">
            Get Started for Free
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 text-center text-sm text-gray-400 space-y-3 bg-white">
        <div className="flex items-center justify-center gap-4">
          <Link to="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          <span className="text-gray-300">•</span>
          <Link to="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
        </div>
        <p>© 2026 KOFA Commerce Engine. Built in Lagos.</p>
      </footer>
    </div>
  )
}

export default Landing
