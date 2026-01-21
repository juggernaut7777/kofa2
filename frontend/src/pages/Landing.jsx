import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Package, Check, MessageSquare, BarChart3, CreditCard, Smartphone,
  TrendingUp, Zap, Shield, Globe, ChevronRight, ArrowRight, Play,
  Star, Users, ShoppingBag
} from 'lucide-react'

const Landing = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const [typedText, setTypedText] = useState('')
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)

  // Typing animation phrases
  const phrases = [
    'Automate Sales',
    'Manage Inventory',
    'Close Deals Faster',
    'Scale Your Business'
  ]

  // Redirect logged-in users to dashboard
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  // Typing animation effect
  useEffect(() => {
    const phrase = phrases[currentPhraseIndex]
    let charIndex = 0
    let isDeleting = false

    const typeInterval = setInterval(() => {
      if (!isDeleting) {
        setTypedText(phrase.slice(0, charIndex + 1))
        charIndex++
        if (charIndex === phrase.length) {
          isDeleting = true
          setTimeout(() => { }, 2000)
        }
      } else {
        setTypedText(phrase.slice(0, charIndex - 1))
        charIndex--
        if (charIndex === 0) {
          isDeleting = false
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length)
          clearInterval(typeInterval)
        }
      }
    }, isDeleting ? 50 : 100)

    return () => clearInterval(typeInterval)
  }, [currentPhraseIndex])

  const features = [
    { icon: MessageSquare, title: 'AI Sales Bot', desc: 'Responds instantly on WhatsApp, Instagram & TikTok - even while you sleep', color: '#0095FF' },
    { icon: Package, title: 'Smart Inventory', desc: 'Real-time stock sync prevents overselling. Never disappoint a customer again', color: '#22C55E' },
    { icon: BarChart3, title: 'Business Insights', desc: 'See exactly what sells, when, and to whom. Make data-driven decisions', color: '#8B5CF6' },
    { icon: CreditCard, title: 'Instant Payments', desc: 'Integrated Paystack payments. Send links, get paid. Simple as that', color: '#F59E0B' },
    { icon: Smartphone, title: 'One Dashboard', desc: 'WhatsApp, Instagram, TikTok - manage all channels from one place', color: '#0EA5E9' },
    { icon: Shield, title: 'Bank-Level Security', desc: 'Your data and transactions are protected with enterprise encryption', color: '#EF4444' }
  ]

  const stats = [
    { number: '50,000+', label: 'Products Sold' },
    { number: '3,000+', label: 'Vendors Trust Us' },
    { number: '₦500M+', label: 'Transactions Processed' },
    { number: '24/7', label: 'AI Availability' }
  ]

  const testimonials = [
    {
      avatar: '👗',
      name: "Sarah Adeyemi",
      business: "Fashion Hub Lagos",
      quote: "KOFA's AI chatbot handles 80% of my customer inquiries. My sales increased 300% in the first month.",
      rating: 5
    },
    {
      avatar: '📱',
      name: 'Emeka Chukwu',
      business: "TechHub Electronics",
      quote: "The inventory sync is a game-changer. I no longer oversell items - my reputation is saved!",
      rating: 5
    },
    {
      avatar: '💄',
      name: 'Grace Okonkwo',
      business: "Beauty by Grace",
      quote: "I can finally take time off knowing KOFA is selling for me. Worth every kobo.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation - Glassmorphism */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-[#0095FF] to-[#0077CC] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0095FF]/20">
                <Package size={22} className="text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">KOFA</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Reviews</a>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link to="/login" className="hidden sm:inline-flex text-gray-700 hover:text-gray-900 font-medium px-4 py-2 rounded-xl transition-colors">
                Sign In
              </Link>
              <Link to="/signup" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0095FF] to-[#0077CC] hover:from-[#0077CC] hover:to-[#005599] text-white font-semibold px-6 py-3 rounded-full shadow-lg shadow-[#0095FF]/25 transition-all hover:shadow-xl hover:shadow-[#0095FF]/30 hover:-translate-y-0.5">
                Get Started Free
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Premium Gradient */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0095FF]/5 via-white to-[#E6F4FF]/30" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#0095FF]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#00D4FF]/10 to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#0095FF]/10 text-[#0095FF] px-5 py-2.5 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm border border-[#0095FF]/20">
              <Zap size={16} className="animate-pulse" />
              AI-Powered Commerce for Nigerian Vendors
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight">
              The Easiest Way to{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-[#0095FF] to-[#00D4FF] bg-clip-text text-transparent">
                  {typedText}
                </span>
                <span className="inline-block w-1 h-12 md:h-16 bg-[#0095FF] ml-1 animate-pulse rounded-full" />
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-500 mb-10 max-w-3xl mx-auto leading-relaxed font-medium">
              KOFA's AI handles customer inquiries 24/7, tracks inventory in real-time,
              and processes payments instantly. Your business runs even when you don't.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/signup" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#0095FF] to-[#0077CC] hover:from-[#0077CC] hover:to-[#005599] text-white font-bold text-lg px-10 py-5 rounded-full shadow-xl shadow-[#0095FF]/30 transition-all hover:shadow-2xl hover:shadow-[#0095FF]/40 hover:-translate-y-1">
                Start Free Trial
                <ArrowRight size={20} />
              </Link>
              <button className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 hover:border-[#0095FF] hover:text-[#0095FF] font-bold text-lg px-10 py-5 rounded-full transition-all">
                <Play size={20} className="fill-current" />
                Watch Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Check size={18} className="text-green-500" />
                Free forever plan
              </span>
              <span className="flex items-center gap-2">
                <Check size={18} className="text-green-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <Check size={18} className="text-green-500" />
                Setup in 5 minutes
              </span>
            </div>
          </div>

          {/* App Mockup */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none h-40 bottom-0 top-auto" />
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-2 shadow-2xl shadow-gray-900/20 max-w-4xl mx-auto">
              <div className="bg-[#0F0F12] rounded-2xl overflow-hidden">
                {/* Mock Dashboard Header */}
                <div className="bg-gradient-to-r from-[#0095FF] to-[#0077CC] p-6">
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <p className="text-sm opacity-80">Today's Revenue</p>
                      <p className="text-3xl font-bold">₦247,500</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-80">Orders</p>
                      <p className="text-3xl font-bold">34</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-80">Conversion</p>
                      <p className="text-3xl font-bold">78%</p>
                    </div>
                  </div>
                </div>
                {/* Mock Product Grid */}
                <div className="p-6 grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white/10 rounded-xl p-4">
                      <div className="w-full h-20 bg-white/5 rounded-lg mb-3" />
                      <div className="h-3 bg-white/20 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-[#0095FF]/50 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-extrabold text-white mb-2">{stat.number}</p>
                <p className="text-gray-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Soft Background */}
      <section id="features" className="py-24 px-6 bg-gradient-to-b from-[#F5F7FA] to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block bg-[#0095FF]/10 text-[#0095FF] font-semibold px-4 py-2 rounded-full text-sm mb-4">
              POWERFUL FEATURES
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
              Everything You Need to <span className="text-[#0095FF]">Dominate</span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              From AI-powered sales to real-time inventory, KOFA has every tool you need to scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="group bg-white rounded-3xl p-8 border border-gray-100 hover:border-[#0095FF]/30 hover:shadow-2xl hover:shadow-[#0095FF]/10 transition-all duration-300 hover:-translate-y-2">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <Icon size={28} style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 bg-gradient-to-br from-[#0095FF] via-[#0077CC] to-[#005599] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block bg-white/10 text-white font-semibold px-4 py-2 rounded-full text-sm mb-4 backdrop-blur-sm">
              LOVED BY VENDORS
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
              Join 3,000+ Happy Vendors
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:bg-white/15 transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={18} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white/90 text-lg mb-6 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white font-bold">{t.name}</p>
                    <p className="text-white/60 text-sm">{t.business}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block bg-[#0095FF]/10 text-[#0095FF] font-semibold px-4 py-2 rounded-full text-sm mb-4">
              SIMPLE PRICING
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
              Start Free, Scale <span className="text-[#0095FF]">Unlimited</span>
            </h2>
            <p className="text-xl text-gray-500">No hidden fees. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-gray-200 transition-all">
              <h3 className="font-bold text-gray-900 text-xl mb-2">Free</h3>
              <p className="text-gray-500 mb-6">Perfect to get started</p>
              <p className="text-5xl font-extrabold text-gray-900 mb-8">₦0</p>
              <ul className="space-y-4 mb-8">
                {['50 products', 'Basic AI chatbot', 'WhatsApp only', 'Basic analytics'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check size={12} className="text-green-600" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-4 rounded-2xl transition-colors">
                Get Started Free
              </Link>
            </div>

            {/* Starter - Popular */}
            <div className="relative bg-gradient-to-br from-[#0095FF] to-[#0077CC] rounded-3xl p-8 shadow-2xl shadow-[#0095FF]/30 scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full">
                MOST POPULAR
              </div>
              <h3 className="font-bold text-white text-xl mb-2">Starter</h3>
              <p className="text-white/70 mb-6">For growing businesses</p>
              <p className="text-5xl font-extrabold text-white mb-1">₦5,000</p>
              <p className="text-white/60 text-sm mb-8">/month</p>
              <ul className="space-y-4 mb-8">
                {['200 products', 'Advanced AI', 'WhatsApp + Instagram', 'Full analytics', 'Priority support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-white">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block w-full text-center bg-white hover:bg-gray-100 text-[#0095FF] font-bold py-4 rounded-2xl transition-colors">
                Start 14-Day Trial
              </Link>
            </div>

            {/* Professional */}
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-gray-200 transition-all">
              <h3 className="font-bold text-gray-900 text-xl mb-2">Professional</h3>
              <p className="text-gray-500 mb-6">For large operations</p>
              <p className="text-5xl font-extrabold text-gray-900 mb-1">₦15,000</p>
              <p className="text-gray-400 text-sm mb-8">/month</p>
              <ul className="space-y-4 mb-8">
                {['Unlimited products', 'Premium AI model', 'All platforms', 'Custom analytics', 'Dedicated support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check size={12} className="text-green-600" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-4 rounded-2xl transition-colors">
                Start 14-Day Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0095FF]/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            Ready to Transform<br />Your Business?
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of Nigerian vendors who trust KOFA to automate their sales and grow their revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#0095FF] to-[#00D4FF] hover:from-[#0077CC] hover:to-[#0095FF] text-white font-bold text-lg px-10 py-5 rounded-full shadow-xl shadow-[#0095FF]/30 transition-all hover:shadow-2xl hover:-translate-y-1">
              Start Your Free Trial
              <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 border-2 border-white/20 text-white hover:bg-white/10 font-bold text-lg px-10 py-5 rounded-full transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-gray-950 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pb-12 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0095FF] to-[#0077CC] rounded-2xl flex items-center justify-center">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-xl block">KOFA</span>
                <span className="text-gray-500 text-sm">Commerce Engine</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-gray-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="pt-8 text-center text-gray-500 text-sm">
            © 2026 KOFA Commerce Engine. Built with ❤️ for Nigerian Vendors.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
