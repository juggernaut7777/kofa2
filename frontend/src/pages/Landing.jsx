import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Package, Check, MessageSquare, BarChart3, CreditCard,
  ArrowRight, Play, Star, Bot, Layers, Globe, Shield, Clock, Users
} from 'lucide-react'

const Landing = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const [typedText, setTypedText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)

  const phrases = ['automate sales', 'manage inventory', 'close more deals']

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    const phrase = phrases[phraseIndex]
    let timeout
    if (isTyping) {
      if (typedText.length < phrase.length) {
        timeout = setTimeout(() => setTypedText(phrase.slice(0, typedText.length + 1)), 100)
      } else {
        timeout = setTimeout(() => setIsTyping(false), 2500)
      }
    } else {
      if (typedText.length > 0) {
        timeout = setTimeout(() => setTypedText(typedText.slice(0, -1)), 50)
      } else {
        setPhraseIndex((prev) => (prev + 1) % phrases.length)
        setIsTyping(true)
      }
    }
    return () => clearTimeout(timeout)
  }, [typedText, isTyping, phraseIndex])

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#0095FF] rounded-lg flex items-center justify-center">
              <Package size={18} className="text-white" />
            </div>
            <span className="font-semibold text-gray-900">KOFA</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-gray-500 hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-gray-500 hover:text-gray-900">Pricing</a>
            <Link to="/login" className="text-gray-500 hover:text-gray-900">Login</Link>
          </div>

          <Link to="/signup" className="bg-[#0095FF] hover:bg-[#0080DD] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-[#0077CC] text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-[#0095FF] rounded-full" />
            AI-powered commerce platform
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-gray-900 mb-5 leading-tight tracking-tight">
            The easiest way to{' '}
            <span className="text-[#0095FF]">{typedText}</span>
            <span className="inline-block w-0.5 h-8 bg-[#0095FF] ml-1 animate-pulse" />
          </h1>

          <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            KOFA handles customer chats 24/7, syncs your inventory in real-time, and processes payments instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link to="/signup" className="inline-flex items-center justify-center gap-2 bg-[#0095FF] hover:bg-[#0080DD] text-white font-medium px-6 py-3 rounded-lg transition-colors">
              Start for free
              <ArrowRight size={16} />
            </Link>
            <button className="inline-flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium px-6 py-3 rounded-lg transition-colors">
              <Play size={14} className="fill-current" />
              Watch demo
            </button>
          </div>

          <p className="text-xs text-gray-400">
            Free plan available · No credit card required
          </p>
        </div>

        {/* App Preview */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-gray-900 rounded-xl p-1.5 shadow-2xl">
            <div className="bg-[#111] rounded-lg overflow-hidden">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/50">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-700 rounded-md h-6 max-w-md mx-auto flex items-center px-3">
                    <span className="text-gray-400 text-xs">app.kofa.ng/dashboard</span>
                  </div>
                </div>
              </div>

              {/* Dashboard preview */}
              <div className="p-4 bg-gradient-to-br from-[#0a0a0c] to-[#111115]">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Revenue', value: '₦247,500', delta: '+12%' },
                    { label: 'Orders', value: '34', delta: '+8%' },
                    { label: 'Conversion', value: '78%', delta: '+5%' },
                    { label: 'AI Chats', value: '156', delta: '+23%' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
                      <p className="text-white font-semibold text-sm">{stat.value}</p>
                      <p className="text-emerald-400 text-xs">{stat.delta}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white/5 rounded-lg p-3">
                      <div className="w-full h-16 bg-white/5 rounded mb-2" />
                      <div className="h-2 bg-white/10 rounded w-3/4 mb-1.5" />
                      <div className="h-2 bg-[#0095FF]/30 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-10 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {[
              { num: '3,000+', label: 'vendors' },
              { num: '₦500M+', label: 'processed' },
              { num: '50,000+', label: 'products sold' },
              { num: '24/7', label: 'AI uptime' }
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-xl font-semibold text-gray-900">{s.num}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Built for Nigerian vendors</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Everything you need to run your business from one dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Bot, title: 'AI Sales Bot', desc: 'Handles customer inquiries on WhatsApp, Instagram & TikTok automatically.' },
              { icon: Layers, title: 'Inventory Sync', desc: 'Real-time stock tracking prevents overselling across all channels.' },
              { icon: BarChart3, title: 'Analytics', desc: 'Track revenue, top products, and customer behavior.' },
              { icon: CreditCard, title: 'Payments', desc: 'Integrated Paystack for instant payment links.' },
              { icon: Globe, title: 'Multi-Channel', desc: 'One dashboard for WhatsApp, Instagram, and TikTok.' },
              { icon: Shield, title: 'Secure', desc: 'Bank-grade encryption for all transactions.' }
            ].map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="p-5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                  <div className="w-9 h-9 bg-[#0095FF]/10 rounded-lg flex items-center justify-center mb-3">
                    <Icon size={18} className="text-[#0095FF]" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-6 bg-[#0095FF]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-white text-center mb-10">What vendors are saying</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: 'Sarah A.', biz: 'Fashion Hub', quote: 'Sales increased 300% in the first month. The AI handles most customer inquiries.' },
              { name: 'Emeka C.', biz: 'TechHub', quote: 'No more overselling. My reputation is saved thanks to the inventory sync.' },
              { name: 'Grace O.', biz: 'Beauty by Grace', quote: "I took my first vacation knowing KOFA is selling for me 24/7." }
            ].map((t, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-white/90 text-sm mb-4 leading-relaxed">"{t.quote}"</p>
                <div>
                  <p className="text-white font-medium text-sm">{t.name}</p>
                  <p className="text-white/60 text-xs">{t.biz}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Simple, transparent pricing</h2>
            <p className="text-gray-500">Start free, upgrade when you're ready.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Free */}
            <div className="border border-gray-200 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-900 mb-1">Free</p>
              <p className="text-2xl font-semibold text-gray-900 mb-4">₦0</p>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                {['50 products', 'Basic AI bot', 'WhatsApp only'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check size={14} className="text-gray-400" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2.5 rounded-lg transition-colors text-sm">
                Get started
              </Link>
            </div>

            {/* Starter */}
            <div className="border-2 border-[#0095FF] rounded-xl p-5 relative">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#0095FF] text-white text-xs font-medium px-2 py-0.5 rounded">
                Popular
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">Starter</p>
              <p className="text-2xl font-semibold text-gray-900 mb-1">₦5,000<span className="text-sm font-normal text-gray-400">/mo</span></p>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                {['200 products', 'Advanced AI', 'WhatsApp + Instagram', 'Full analytics'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check size={14} className="text-[#0095FF]" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block text-center bg-[#0095FF] hover:bg-[#0080DD] text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
                Start trial
              </Link>
            </div>

            {/* Pro */}
            <div className="border border-gray-200 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-900 mb-1">Professional</p>
              <p className="text-2xl font-semibold text-gray-900 mb-1">₦15,000<span className="text-sm font-normal text-gray-400">/mo</span></p>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                {['Unlimited products', 'Premium AI', 'All platforms', 'Priority support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check size={14} className="text-gray-400" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2.5 rounded-lg transition-colors text-sm">
                Start trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-gray-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">Ready to grow your business?</h2>
          <p className="text-gray-400 mb-6">Join thousands of Nigerian vendors using KOFA.</p>
          <Link to="/signup" className="inline-flex items-center gap-2 bg-[#0095FF] hover:bg-[#0080DD] text-white font-medium px-6 py-3 rounded-lg transition-colors">
            Get started for free
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 bg-gray-950">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0095FF] rounded-lg flex items-center justify-center">
              <Package size={16} className="text-white" />
            </div>
            <span className="text-white font-medium">KOFA</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white">Features</a>
            <a href="#" className="hover:text-white">Pricing</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-6 pt-6 border-t border-gray-800 text-center text-xs text-gray-600">
          © 2026 KOFA. Built for Nigerian vendors.
        </div>
      </footer>
    </div>
  )
}

export default Landing
