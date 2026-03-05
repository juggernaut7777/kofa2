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

  // --- MOCKUP COMPONENTS ---

  const WhatsAppMockup = () => (
    <div className="bg-white rounded-[2rem] border-4 border-gray-900 overflow-hidden shadow-2xl max-w-sm mx-auto">
      <div className="bg-[#075E54] p-4 text-white flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">K</div>
        <div>
          <p className="font-bold">KOFA Assistant</p>
          <p className="text-xs opacity-80">Business Account</p>
        </div>
      </div>
      <div className="bg-[#E5DDD5] h-80 p-4 space-y-4 overflow-y-auto text-sm">
        <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm max-w-[85%]">
          Do you have the Nike Air Max in size 42?
        </div>
        <div className="bg-[#DCF8C6] p-3 rounded-xl rounded-tr-none shadow-sm max-w-[85%] ml-auto">
          Yes! Based on your inventory, we have <strong>2 pairs left</strong>. Price: ₦45,000. Want to order?
        </div>
        <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm max-w-[85%]">
          Yes please. Sending ₦45k now.
        </div>
        <div className="bg-[#DCF8C6] p-3 rounded-xl rounded-tr-none shadow-sm max-w-[85%] ml-auto">
          Great! Send the transfer receipt here and I'll create the invoice automatically.
        </div>
      </div>
    </div>
  )

  const ScanMockup = () => (
    <div className="relative bg-black rounded-[2rem] border-4 border-gray-800 overflow-hidden shadow-2xl max-w-sm mx-auto h-96">
      {/* Background "Camera" View */}
      <div className="absolute inset-0 bg-gray-800 flex items-center justify-center opacity-50">
        <div className="text-white/20 text-6xl font-bold rotate-[-15deg]">RECEIPT</div>
      </div>

      {/* Scanning Line */}
      <div className="absolute top-1/4 left-0 right-0 h-1 bg-brand-primary shadow-[0_0_20px_rgba(0,149,255,1)] animate-[scan_2s_ease-in-out_infinite]" />

      {/* Detected Text Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl p-6 rounded-t-3xl transition-transform animate-slideUp">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Scanned Items</p>
        <div className="space-y-3">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <p className="font-bold">20x Coca Cola</p>
            <p className="text-brand-primary font-bold">₦4,000</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="font-bold">Supplier: Mama T</p>
            <Badge variant="success" size="sm">Saved</Badge>
          </div>
        </div>
        <Button variant="primary" className="w-full mt-4">Add to Inventory</Button>
      </div>
    </div>
  )

  const StorefrontMockup = () => (
    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-w-sm mx-auto">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <Menu size={20} className="text-gray-500" />
        <span className="font-bold">Luxe Fashion</span>
        <ShoppingBag size={20} className="text-gray-500" />
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-2">
            <div className="bg-gray-100 aspect-square rounded-lg relative">
              {i === 1 && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">SALE</span>}
            </div>
            <div>
              <p className="font-bold text-sm">Product {i}</p>
              <p className="text-brand-primary text-xs font-bold">₦15,000</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const BusinessAIMockup = () => (
    <Card className="max-w-md mx-auto p-0 overflow-hidden shadow-2xl border-border-strong">
      <div className="bg-surface-2 p-4 border-b border-border-subtle flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-purple-600 rounded-xl flex items-center justify-center text-white">
          <Zap size={20} fill="currentColor" />
        </div>
        <div>
          <p className="font-bold text-main">Business IQ</p>
          <p className="text-xs text-muted">Ask anything about your sales</p>
        </div>
      </div>
      <div className="p-6 space-y-4 bg-surface-1">
        <div className="flex justify-end">
          <div className="bg-surface-3 text-main px-4 py-2 rounded-2xl rounded-tr-sm text-sm">
            How much profit did I make last week?
          </div>
        </div>
        <div className="flex justify-start gap-3">
          <div className="w-8 h-8 flex-shrink-0 bg-brand-primary/10 rounded-full flex items-center justify-center">
            <Zap size={14} className="text-brand-primary" />
          </div>
          <div className="space-y-2 max-w-[85%]">
            <div className="bg-brand-primary/5 border border-brand-primary/10 p-4 rounded-2xl rounded-tl-sm space-y-2">
              <p className="text-sm text-main">
                Last week you made <span className="font-bold text-brand-primary">₦145,000</span> in profit! 🚀
              </p>
              <div className="h-1 bg-gray-200 rounded-full w-full overflow-hidden">
                <div className="h-full bg-brand-primary w-[75%]" />
              </div>
              <p className="text-xs text-muted">Top seller: <span className="font-medium">Red Velvet Dress</span></p>
            </div>
          </div>
        </div>
      </div>
    </Card>
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
      <header className="px-6 py-20 lg:py-32 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-8">
          <Zap size={14} fill="currentColor" /> The OS for African Commerce
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-main mb-6">
          Run your business on <span className="text-transparent bg-clip-text bg-gradient-brand">Autopilot.</span>
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
          <div className="order-2 md:order-1">
            <WhatsAppMockup />
          </div>
          <div className="order-1 md:order-2">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
              <MessageSquare size={24} />
            </div>
            <h2 className="text-4xl font-bold mb-4">WhatsApp AI Assistant.</h2>
            <p className="text-lg text-muted mb-8 leading-relaxed">
              Most of your sales happen on WhatsApp. Why are you still replying manually? KOFA's AI reads your chats, checks your stock, and collects payments automatically.
            </p>
            <ul className="space-y-4">
              {['Replies instantly 24/7', 'Knows your inventory', 'Collects delivery details'].map(f => (
                <li key={f} className="flex gap-3 text-main font-medium"><Check className="text-green-500" /> {f}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* --- FEATURE 2: SCAN TO UPLOAD --- */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <ScanLine size={24} />
            </div>
            <h2 className="text-4xl font-bold mb-4">Scan Receipts to Stock.</h2>
            <p className="text-lg text-muted mb-8 leading-relaxed">
              Hate typing product names? Just snap a photo of your supplier's receipt. KOFA extracts the items and prices instantly.
            </p>
            <Button variant="outline" className="rounded-full">See it in action</Button>
          </div>
          <div>
            <ScanMockup />
          </div>
        </div>
      </section>

      {/* --- FEATURE 3: STOREFRONT --- */}
      <section className="py-24 px-6 bg-surface-2/30 border-y border-border-subtle">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
            <StorefrontMockup />
          </div>
          <div className="order-1 md:order-2">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
              <Store size={24} />
            </div>
            <h2 className="text-4xl font-bold mb-4">Your Own Online Store.</h2>
            <p className="text-lg text-muted mb-8 leading-relaxed">
              Get a beautiful link (`kofa.me/your-brand`) to share on Instagram. Customers can browse your products and order without DMing you.
            </p>
          </div>
        </div>
      </section>

      {/* --- FEATURE 4: BUSINESS AI --- */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="w-12 h-12 bg-blue-100 text-brand-primary rounded-2xl flex items-center justify-center mb-6">
              <TrendingUp size={24} />
            </div>
            <h2 className="text-4xl font-bold mb-4">"How much did I make?"</h2>
            <p className="text-lg text-muted mb-8 leading-relaxed">
              Stop guessing. Just ask KOFA. Our Business AI analyzes your sales and expenses to tell you your *true* profit, best-selling items, and more.
            </p>
          </div>
          <div>
            <BusinessAIMockup />
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
      <footer className="border-t border-gray-100 py-10 text-center text-sm text-muted">
        <p>© 2026 KOFA Commerce Engine. Built in Lagos.</p>
      </footer>
    </div>
  )
}

export default Landing
