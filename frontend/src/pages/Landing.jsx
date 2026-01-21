import { useState, useEffect, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Package, Check, MessageSquare, BarChart3, CreditCard, Smartphone,
  TrendingUp, Zap, Shield, ArrowRight, Play, Star, ChevronRight,
  Bot, Bell, Layers, Globe, Clock, Users
} from 'lucide-react'

const Landing = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const [typedText, setTypedText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)

  const phrases = ['Automate Sales', 'Track Inventory', 'Close More Deals', 'Grow Revenue']

  // Redirect logged-in users
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  // Smooth typing animation
  useEffect(() => {
    const phrase = phrases[phraseIndex]
    let timeout

    if (isTyping) {
      if (typedText.length < phrase.length) {
        timeout = setTimeout(() => {
          setTypedText(phrase.slice(0, typedText.length + 1))
        }, 80)
      } else {
        timeout = setTimeout(() => setIsTyping(false), 2000)
      }
    } else {
      if (typedText.length > 0) {
        timeout = setTimeout(() => {
          setTypedText(typedText.slice(0, -1))
        }, 40)
      } else {
        setPhraseIndex((prev) => (prev + 1) % phrases.length)
        setIsTyping(true)
      }
    }

    return () => clearTimeout(timeout)
  }, [typedText, isTyping, phraseIndex])

  const features = [
    {
      icon: Bot,
      title: 'AI Sales Assistant',
      desc: 'Your tireless sales bot handles customer inquiries 24/7 on WhatsApp, Instagram & TikTok.',
      gradient: 'from-blue-500 to-cyan-400'
    },
    {
      icon: Layers,
      title: 'Smart Inventory',
      desc: 'Real-time stock sync prevents overselling. Never disappoint a customer again.',
      gradient: 'from-emerald-500 to-teal-400'
    },
    {
      icon: BarChart3,
      title: 'Actionable Insights',
      desc: 'See exactly what sells, when, and to whom. Make smarter business decisions.',
      gradient: 'from-violet-500 to-purple-400'
    },
    {
      icon: CreditCard,
      title: 'Instant Payments',
      desc: 'Integrated Paystack. Generate payment links and get paid in seconds.',
      gradient: 'from-orange-500 to-amber-400'
    },
    {
      icon: Globe,
      title: 'Multi-Platform',
      desc: 'WhatsApp, Instagram, TikTok - manage all your channels from one beautiful dashboard.',
      gradient: 'from-pink-500 to-rose-400'
    },
    {
      icon: Shield,
      title: 'Bank-Grade Security',
      desc: 'Enterprise-level encryption protects your data and every transaction.',
      gradient: 'from-slate-600 to-slate-500'
    }
  ]

  const testimonials = [
    {
      name: "Sarah Adeyemi",
      role: "Fashion Hub Lagos",
      image: "👗",
      quote: "KOFA's AI handles 80% of my inquiries. Sales increased 300% in the first month. I can't imagine running my business without it.",
      rating: 5
    },
    {
      name: 'Emeka Chukwu',
      role: "TechHub Electronics",
      image: "📱",
      quote: "The inventory sync is a game-changer. No more overselling or angry customers. My reputation is saved!",
      rating: 5
    },
    {
      name: 'Grace Okonkwo',
      role: "Beauty by Grace",
      image: "💄",
      quote: "I finally took my first vacation in 3 years knowing KOFA is selling for me 24/7. Worth every kobo.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-[#FAFBFC] overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 mt-4">
          <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-2xl rounded-2xl border border-gray-200/50 shadow-lg shadow-gray-900/5">
            <div className="flex justify-between items-center h-16 px-6">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0095FF] to-[#0066CC] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all group-hover:scale-105">
                  <Package size={20} className="text-white" />
                </div>
                <span className="font-bold text-xl text-gray-900">KOFA</span>
              </Link>

              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">Features</a>
                <a href="#testimonials" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">Reviews</a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">Pricing</a>
              </div>

              <div className="flex items-center gap-3">
                <Link to="/login" className="hidden sm:inline-flex text-gray-600 hover:text-gray-900 font-semibold text-sm px-4 py-2 rounded-xl transition-colors">
                  Sign In
                </Link>
                <Link to="/signup" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0095FF] to-[#0077CC] text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5">
                  Start Free
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-4 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 via-white to-white" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#0095FF]/20 via-[#00D4FF]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-violet-500/10 to-transparent rounded-full blur-3xl" />

        {/* Floating Elements */}
        <div className="absolute top-32 left-[15%] w-16 h-16 bg-white rounded-2xl shadow-xl shadow-gray-900/10 flex items-center justify-center animate-bounce" style={{ animationDuration: '3s' }}>
          <MessageSquare className="text-[#0095FF]" size={28} />
        </div>
        <div className="absolute top-48 right-[20%] w-14 h-14 bg-white rounded-2xl shadow-xl shadow-gray-900/10 flex items-center justify-center animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <TrendingUp className="text-emerald-500" size={24} />
        </div>
        <div className="absolute bottom-32 left-[10%] w-12 h-12 bg-white rounded-xl shadow-xl shadow-gray-900/10 flex items-center justify-center animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
          <Bell className="text-orange-500" size={20} />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0095FF]/10 to-[#00D4FF]/10 text-[#0066CC] px-5 py-2 rounded-full text-sm font-semibold mb-8 border border-[#0095FF]/20">
              <Zap size={16} className="text-[#0095FF]" />
              AI-Powered Commerce for Nigerian Vendors
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight">
              The Smartest Way<br />
              to{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#0095FF] via-[#0088EE] to-[#00D4FF] bg-clip-text text-transparent">
                  {typedText}
                </span>
                <span className="absolute -right-1 top-0 w-[3px] h-full bg-[#0095FF] animate-pulse rounded-full" />
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              KOFA's AI assistant handles customer chats, tracks inventory, and processes payments — so your business runs <span className="text-gray-700 font-semibold">even when you sleep</span>.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Link to="/signup" className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#0095FF] to-[#0077CC] text-white font-bold text-lg px-10 py-5 rounded-2xl shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:-translate-y-1">
                Start Free — No Card Required
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="group inline-flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 hover:border-[#0095FF] hover:text-[#0095FF] font-bold text-lg px-10 py-5 rounded-2xl transition-all hover:shadow-lg">
                <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#0095FF]/10 rounded-full flex items-center justify-center transition-colors">
                  <Play size={18} className="fill-current ml-0.5" />
                </div>
                Watch Demo
              </button>
            </div>

            {/* Trust */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              {['Free forever plan', 'Setup in 5 minutes', 'No credit card needed'].map((item, i) => (
                <span key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Check size={12} className="text-emerald-600" />
                  </div>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="relative max-w-5xl mx-auto">
            {/* Glow behind phone */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0095FF]/20 to-transparent blur-3xl rounded-full scale-75" />

            {/* Phone Frame */}
            <div className="relative mx-auto" style={{ maxWidth: '380px' }}>
              {/* iPhone Frame */}
              <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl shadow-gray-900/40">
                {/* Dynamic Island */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20" />

                {/* Screen */}
                <div className="bg-[#0F0F12] rounded-[2.5rem] overflow-hidden">
                  {/* Status Bar */}
                  <div className="h-12 bg-gradient-to-r from-[#0095FF] to-[#0077CC] flex items-end justify-between px-8 pb-2">
                    <span className="text-white/80 text-xs font-semibold">9:41</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-2 bg-white/80 rounded-sm" />
                    </div>
                  </div>

                  {/* App Header */}
                  <div className="bg-gradient-to-r from-[#0095FF] to-[#0077CC] px-6 pt-4 pb-8">
                    <p className="text-white/70 text-sm mb-1">Today's Revenue</p>
                    <p className="text-white text-4xl font-bold">₦247,500</p>
                    <div className="flex gap-6 mt-4">
                      <div>
                        <p className="text-white/70 text-xs">Orders</p>
                        <p className="text-white text-lg font-bold">34</p>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs">Conversion</p>
                        <p className="text-white text-lg font-bold">78%</p>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs">AI Chats</p>
                        <p className="text-white text-lg font-bold">156</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="px-4 -mt-4">
                    <div className="bg-white rounded-2xl p-4 shadow-lg mb-4">
                      <p className="text-gray-500 text-xs font-semibold mb-3">QUICK ACTIONS</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { icon: Package, label: 'Products', color: 'bg-blue-100 text-blue-600' },
                          { icon: MessageSquare, label: 'AI Bot', color: 'bg-emerald-100 text-emerald-600' },
                          { icon: CreditCard, label: 'Sales', color: 'bg-orange-100 text-orange-600' },
                          { icon: BarChart3, label: 'Analytics', color: 'bg-violet-100 text-violet-600' }
                        ].map((item, i) => (
                          <div key={i} className="flex flex-col items-center gap-1">
                            <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center`}>
                              <item.icon size={20} />
                            </div>
                            <span className="text-[10px] text-gray-600">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="bg-white rounded-2xl p-4 shadow-lg">
                      <p className="text-gray-500 text-xs font-semibold mb-3">RECENT ORDERS</p>
                      {[
                        { name: 'Nike Air Max', price: '₦45,000', status: 'Paid', color: 'bg-emerald-100 text-emerald-600' },
                        { name: 'iPhone Case', price: '₦5,500', status: 'Pending', color: 'bg-amber-100 text-amber-600' }
                      ].map((order, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{order.name}</p>
                            <p className="text-xs text-gray-500">{order.price}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${order.color}`}>{order.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom padding */}
                  <div className="h-8" />
                </div>
              </div>

              {/* Floating notification */}
              <div className="absolute -right-4 top-1/3 bg-white rounded-2xl p-4 shadow-2xl shadow-gray-900/20 animate-pulse" style={{ animationDuration: '3s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Check className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">New Sale!</p>
                    <p className="text-xs text-gray-500">₦45,000 from WhatsApp</p>
                  </div>
                </div>
              </div>

              {/* Floating AI chat */}
              <div className="absolute -left-4 bottom-1/3 bg-white rounded-2xl p-4 shadow-2xl shadow-gray-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0095FF]/10 rounded-full flex items-center justify-center">
                    <Bot className="text-[#0095FF]" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">AI Responded</p>
                    <p className="text-xs text-gray-500">156 chats handled today</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '50K+', label: 'Products Sold', icon: Package },
              { number: '3,000+', label: 'Active Vendors', icon: Users },
              { number: '₦500M+', label: 'Processed', icon: CreditCard },
              { number: '24/7', label: 'AI Uptime', icon: Clock }
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#0095FF]/20 transition-colors">
                  <stat.icon className="text-white" size={24} />
                </div>
                <p className="text-4xl md:text-5xl font-black text-white mb-2">{stat.number}</p>
                <p className="text-gray-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="inline-block bg-[#0095FF]/10 text-[#0066CC] font-bold text-sm px-5 py-2 rounded-full mb-6">
              POWERFUL FEATURES
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              Everything You Need to <span className="bg-gradient-to-r from-[#0095FF] to-[#00D4FF] bg-clip-text text-transparent">Dominate</span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              From AI-powered sales to real-time analytics, KOFA gives you the edge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="group bg-white rounded-3xl p-8 border border-gray-100 hover:border-transparent hover:shadow-2xl hover:shadow-gray-900/10 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
                  <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="relative text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="relative text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4 bg-gradient-to-br from-[#0095FF] via-[#0077CC] to-[#005599] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block bg-white/10 text-white font-bold text-sm px-5 py-2 rounded-full mb-6 backdrop-blur">
              TRUSTED BY THOUSANDS
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Vendors Love KOFA
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:bg-white/15 transition-all group">
                <div className="flex gap-1 mb-6">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={20} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white/90 text-lg mb-8 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    {t.image}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{t.name}</p>
                    <p className="text-white/60">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block bg-[#0095FF]/10 text-[#0066CC] font-bold text-sm px-5 py-2 rounded-full mb-6">
              SIMPLE PRICING
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              Start Free, Scale <span className="bg-gradient-to-r from-[#0095FF] to-[#00D4FF] bg-clip-text text-transparent">Unlimited</span>
            </h2>
            <p className="text-xl text-gray-500">No hidden fees. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-gray-200 transition-all hover:shadow-xl">
              <p className="text-[#0095FF] font-bold text-sm mb-2">FREE</p>
              <p className="text-5xl font-black text-gray-900 mb-2">₦0</p>
              <p className="text-gray-500 mb-8">Perfect to get started</p>
              <ul className="space-y-4 mb-8">
                {['50 products', 'Basic AI chatbot', 'WhatsApp only', 'Basic analytics'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600">
                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-gray-600" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-4 rounded-2xl transition-colors">
                Get Started Free
              </Link>
            </div>

            {/* Starter */}
            <div className="relative bg-gradient-to-br from-[#0095FF] to-[#0066CC] rounded-3xl p-8 shadow-2xl shadow-blue-500/30 scale-105 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 text-xs font-black px-4 py-1.5 rounded-full shadow-lg">
                MOST POPULAR
              </div>
              <p className="text-white/80 font-bold text-sm mb-2">STARTER</p>
              <p className="text-5xl font-black text-white mb-1">₦5,000</p>
              <p className="text-white/60 mb-8">/month</p>
              <ul className="space-y-4 mb-8">
                {['200 products', 'Advanced AI', 'WhatsApp + Instagram', 'Full analytics', 'Priority support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-white">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-white" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block w-full text-center bg-white hover:bg-gray-100 text-[#0095FF] font-bold py-4 rounded-2xl transition-colors shadow-lg">
                Start 14-Day Trial
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-gray-200 transition-all hover:shadow-xl">
              <p className="text-violet-600 font-bold text-sm mb-2">PROFESSIONAL</p>
              <p className="text-5xl font-black text-gray-900 mb-1">₦15,000</p>
              <p className="text-gray-500 mb-8">/month</p>
              <ul className="space-y-4 mb-8">
                {['Unlimited products', 'Premium AI', 'All platforms', 'Custom analytics', 'Dedicated support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600">
                    <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-violet-600" />
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
      <section className="py-24 px-4 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0095FF]/10 via-transparent to-[#0095FF]/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0095FF]/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
            Ready to Transform<br />Your Business?
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Join thousands of Nigerian vendors who trust KOFA to automate their sales and grow revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#0095FF] to-[#00D4FF] text-white font-bold text-lg px-12 py-6 rounded-2xl shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:-translate-y-1">
              Start Your Free Trial
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-gray-950 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pb-12 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0095FF] to-[#0066CC] rounded-2xl flex items-center justify-center">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-xl block">KOFA</span>
                <span className="text-gray-500 text-sm">Commerce Engine</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-gray-400 text-sm">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
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
