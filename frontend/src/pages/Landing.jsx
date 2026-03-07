import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Package, Check, MessageSquare, ChevronRight,
  ScanLine, Store, Zap, TrendingUp, Smartphone,
  ShoppingBag, ArrowRight, Menu, Star
} from 'lucide-react'

// Import App Components for Fidelity
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

const Landing = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  // --- NEW HIGH FIDELITY MOCKUPS ---
  const MockupImage = ({ src, alt, className }) => (
    <div className={`relative rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-main selection:bg-brand-primary selection:text-white pb-20">

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-glow">
              <Package size={20} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl tracking-tight text-main">KOFA</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-muted">
            {['Features', 'Pricing', 'Login'].map(l => (
              <a key={l} href="#" className="hover:text-brand-primary transition-colors">{l}</a>
            ))}
          </div>
          <Button variant="primary" className="rounded-full">Get Started</Button>
        </div>
      </nav>

      {/* Hero */}
      <header className="px-6 py-24 lg:py-36 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-brand-light text-brand-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-8 border border-brand-primary/20 shadow-sm transition-transform hover:scale-105">
          <Zap size={14} fill="currentColor" /> The OS for African Commerce
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-main mb-6 leading-tight">
          Run your business on <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text text-gradient-brand">Autopilot.</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto mb-10">
          KOFA replaces your messy Excel sheets with AI. Manage orders, track inventory, and find profit—automatically.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/signup">
            <Button variant="primary" size="lg" className="rounded-full shadow-xl shadow-brand-glow px-8">Start Free Trial</Button>
          </Link>
          <Button variant="outline" size="lg" className="rounded-full bg-white px-8">View Demo</Button>
        </div>
      </header>

      {/* --- FEATURE 1: WHATSAPP AI --- */}
      <section className="py-24 px-6 bg-white border-y border-border-subtle">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 flex justify-center">
            <MockupImage src="/images/whatsapp-mockup.png" alt="WhatsApp AI Assistant Mockup" className="max-w-sm w-full transform -rotate-2 hover:rotate-0 transition-transform duration-500" />
          </div>
          <div className="order-1 md:order-2 flex flex-col justify-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <MessageSquare size={24} />
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">WhatsApp AI Assistant.</h2>
            <p className="text-lg text-muted mb-8 leading-relaxed">
              Most of your sales happen on WhatsApp. Why are you still replying manually? KOFA's AI reads your chats, checks your stock, and collects payments automatically.
            </p>
            <ul className="space-y-4 mb-8">
              {['Replies instantly 24/7', 'Knows your inventory', 'Collects delivery details'].map(f => (
                <li key={f} className="flex gap-3 text-main font-semibold items-center"><Check className="text-green-500" strokeWidth={3} /> {f}</li>
              ))}
            </ul>
            <div>
              <Button variant="outline" className="rounded-full font-bold">See it in action <ArrowRight size={16} className="ml-2" /></Button>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURE 2: STOREFRONT --- */}
      <section className="py-32 px-6 bg-surface-2 border-y border-border-subtle">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <Store size={24} />
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Your Own Online Store.</h2>
            <p className="text-lg text-muted mb-8 leading-relaxed">
              Get a beautiful link to share on Instagram and TikTok. Customers can browse your latest catalog, place orders, and pay without DMing you.
            </p>
            <ul className="space-y-4 mb-8">
              {['Takes orders whilst you sleep', 'Automatic inventory sync', 'Professional checkout flow'].map(f => (
                <li key={f} className="flex gap-3 text-main font-semibold items-center"><Check className="text-orange-500" strokeWidth={3} /> {f}</li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center transform rotate-2 hover:rotate-0 transition-transform duration-500">
            <MockupImage src="/images/storefront-mockup.png" alt="Clean Online Storefront Mockup" className="max-w-sm w-full ring-4 ring-white" />
          </div>
        </div>
      </section>

      {/* --- FEATURE 3: BUSINESS AI --- */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 flex justify-center transform -rotate-2 hover:rotate-0 transition-transform duration-500">
            <MockupImage src="/images/analytics-mockup.png" alt="Business Analytics AI Mockup" className="max-w-lg w-full rounded-2xl shadow-2xl" />
          </div>
          <div className="order-1 md:order-2 flex flex-col justify-center">
            <div className="w-12 h-12 bg-brand-light text-brand-primary rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <TrendingUp size={24} />
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">"How much did I make?"</h2>
            <p className="text-lg text-muted mb-8 leading-relaxed">
              Stop guessing. Just ask KOFA. Our Business AI analyzes your sales and expenses to tell you your true profit margins and best-selling items instantly.
            </p>
            <ul className="space-y-4">
              {['Instant profit calculations', 'Best and worst selling products', 'Expense tracking'].map(f => (
                <li key={f} className="flex gap-3 text-main font-semibold items-center"><Check className="text-brand-primary" strokeWidth={3} /> {f}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-24 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to professionalize your hustle?</h2>
        <Link to="/signup">
          <Button variant="primary" size="lg" className="rounded-full px-8 shadow-xl shadow-brand-glow">Get Started for Free</Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 text-center text-sm text-muted space-y-3">
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
