import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Check, ArrowRight, Menu, X,
  MessageCircle, Package, TrendingUp, Shield,
  Smartphone, CreditCard, ChevronDown, PlayCircle
} from 'lucide-react'

// Asset Components using CSS (lightweight, fast, no external images needed)
const ChatSimulation = () => (
  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-sm mx-auto transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
    <div className="bg-[#075E54] p-4 flex items-center gap-3 text-white">
      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold">K</div>
      <div>
        <p className="text-sm font-bold">KOFA Assistant</p>
        <p className="text-xs opacity-80">Online</p>
      </div>
    </div>
    <div className="p-4 bg-[#E5DDD5] space-y-4 h-64 overflow-y-auto text-xs">
      <div className="bg-white p-2 rounded-lg rounded-tl-none max-w-[80%] shadow-sm">
        Do you have the red sneakers in size 42?
      </div>
      <div className="bg-[#DCF8C6] p-2 rounded-lg rounded-tr-none max-w-[80%] ml-auto shadow-sm">
        Yes! We have 2 pairs left in size 42. Price is ₦15,000. Would you like to order?
      </div>
      <div className="bg-white p-2 rounded-lg rounded-tl-none max-w-[80%] shadow-sm">
        Yes please. Assuming delivery is available?
      </div>
      <div className="bg-[#DCF8C6] p-2 rounded-lg rounded-tr-none max-w-[80%] ml-auto shadow-sm">
        Delivery is available! Please reply with your address to confirm.
      </div>
    </div>
  </div>
)

const DashboardPreview = () => (
  <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
    <div className="border-b border-gray-100 p-4 flex items-center gap-2 bg-gray-50/50">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
      </div>
      <div className="h-2 w-32 bg-gray-200 rounded-full ml-2" />
    </div>
    <div className="p-6 grid gap-6">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-gray-500 text-xs uppercase font-medium tracking-wider mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900">₦1,245,000</p>
        </div>
        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">+12%</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-50 rounded-lg p-3">
            <div className="w-full h-20 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-3/4 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-1/2 bg-blue-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
)

const Landing = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden selection:bg-blue-100">

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0095FF] rounded-lg flex items-center justify-center text-white">
                <Package size={18} strokeWidth={3} />
              </div>
              <span className="font-bold text-xl tracking-tight">KOFA</span>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#features" className="hover:text-[#0095FF] transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-[#0095FF] transition-colors">How it works</a>
              <a href="#pricing" className="hover:text-[#0095FF] transition-colors">Pricing</a>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/login" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-black">
                Log in
              </Link>
              <Link to="/signup" className="bg-[#0095FF] hover:bg-[#007ACC] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md">
                Get Started
              </Link>
              <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white p-4 space-y-4">
            <a href="#features" className="block text-gray-600 font-medium">Features</a>
            <a href="#pricing" className="block text-gray-600 font-medium">Pricing</a>
            <Link to="/login" className="block text-gray-600 font-medium">Log in</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 sm:pt-24 sm:pb-32 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1] mb-6">
              Manage your business without the <span className="text-[#0095FF]">chaos</span>.
            </h1>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed">
              KOFA gives you an AI sales assistant, real-time inventory tracking, and clear profit insights. Stop using messy Excel sheets and paper notes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link to="/signup" className="inline-flex items-center justify-center gap-2 bg-[#0095FF] hover:bg-[#007ACC] text-white font-semibold px-8 py-3.5 rounded-full transition-all text-base shadow-sm hover:shadow-lg hover:-translate-y-0.5">
                Start Selling Smarter
                <ArrowRight size={18} />
              </Link>
              <button className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-8 py-3.5 rounded-full transition-all">
                <PlayCircle size={18} />
                Watch Demo
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100" />
                ))}
              </div>
              <p>Trusted by 3,000+ Nigerian businesses</p>
            </div>
          </div>

          <div className="relative lg:h-[600px] flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-50/50 rounded-full blur-3xl -z-10" />
            <div className="relative w-full max-w-lg">
              <DashboardPreview />
              <div className="absolute -right-12 -bottom-12 w-64 hidden md:block">
                <ChatSimulation />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <div className="bg-gray-50 border-y border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8">Powering top brands across Nigeria</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Text placeholders for logos to keep it clean */}
            <span className="text-xl font-bold font-serif">LuxeLagos</span>
            <span className="text-xl font-bold font-mono">TechPoint</span>
            <span className="text-xl font-extrabold italic">NaijaGlam</span>
            <span className="text-xl font-light tracking-widest">URBANWEAR</span>
            <span className="text-xl font-bold">FoodCourt</span>
          </div>
        </div>
      </div>

      {/* Feature 1: The AI */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 bg-gray-50 rounded-3xl p-8 sm:p-12">
            <ChatSimulation />
          </div>
          <div className="order-1 md:order-2">
            <div className="w-12 h-12 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center mb-6">
              <MessageCircle size={24} />
            </div>
            <h2 className="text-3xl font-bold mb-4">Meet your new Sales Assistant.</h2>
            <p className="text-lg text-gray-500 mb-6 leading-relaxed">
              KOFA's AI connects to your WhatsApp and Instagram. It replies to customers instantly, checks your stock, and even closes sales while you sleep.
            </p>
            <ul className="space-y-3 mb-8">
              {['Auto-replies to inquiries', 'Checks inventory in real-time', 'Sends payment links'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <Check size={12} className="text-green-600" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Feature 2: Inventory */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-t border-gray-100">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mb-6">
              <Package size={24} />
            </div>
            <h2 className="text-3xl font-bold mb-4">Stop overselling. Start growing.</h2>
            <p className="text-lg text-gray-500 mb-6 leading-relaxed">
              Never apologize for being "out of stock" again. KOFA tracks every item. When it's sold on WhatsApp, it's updated everywhere.
            </p>
            <Link to="/signup" className="text-[#0095FF] font-semibold flex items-center gap-2 hover:gap-3 transition-all">
              Learn about inventory <ArrowRight size={16} />
            </Link>
          </div>
          <div className="bg-white border rounded-3xl p-8 shadow-lg">
            <div className="space-y-4">
              {[
                { name: 'Red Velvet Dress', stock: 2, status: 'Low Stock', color: 'red' },
                { name: 'Denim Jacket', stock: 15, status: 'In Stock', color: 'green' },
                { name: 'White Sneakers', stock: 0, status: 'Out of Stock', color: 'gray' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.stock} remaining</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded bg-${item.color}-100 text-${item.color}-700`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Three Column Features */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything you need to run your business</h2>
          <p className="text-gray-500">We replaced the chaos with one simple dashboard.</p>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { icon: TrendingUp, title: "Profit Tracking", desc: "Know exactly how much you're making after expenses." },
            { icon: CreditCard, title: "Instant Payments", desc: "Accept payments via transfer or card. Get settled next day." },
            { icon: Smartphone, title: "Mobile First", desc: "Run your entire business from your phone. No laptop needed." }
          ].map((f, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4 text-gray-900">
                <f.icon size={20} />
              </div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Simple Pricing */}
      <section id="pricing" className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-gray-500">Start for free. Upgrade as you grow.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="border border-gray-200 rounded-3xl p-8 hover:border-blue-200 transition-colors">
            <h3 className="font-bold text-xl mb-2">Free</h3>
            <p className="text-4xl font-bold mb-6">₦0<span className="text-lg font-normal text-gray-400">/mo</span></p>
            <p className="text-gray-500 mb-8 border-b border-gray-100 pb-8">Perfect for just starting out.</p>
            <ul className="space-y-4 mb-8">
              <li className="flex gap-3 text-sm text-gray-600"><Check size={16} className="text-green-500" /> 50 Products</li>
              <li className="flex gap-3 text-sm text-gray-600"><Check size={16} className="text-green-500" /> Basic AI Assistant</li>
              <li className="flex gap-3 text-sm text-gray-600"><Check size={16} className="text-green-500" /> Manual Orders</li>
            </ul>
            <Link to="/signup" className="block w-full py-3 bg-gray-50 text-gray-900 font-semibold text-center rounded-xl hover:bg-gray-100 transition-colors">
              Get Started
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="border-2 border-[#0095FF] rounded-3xl p-8 relative shadow-xl">
            <div className="absolute top-0 right-0 bg-[#0095FF] text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg">POPULAR</div>
            <h3 className="font-bold text-xl mb-2">Starter</h3>
            <p className="text-4xl font-bold mb-6">₦5,000<span className="text-lg font-normal text-gray-400">/mo</span></p>
            <p className="text-gray-500 mb-8 border-b border-gray-100 pb-8">For growing businesses.</p>
            <ul className="space-y-4 mb-8">
              <li className="flex gap-3 text-sm text-gray-900 font-medium"><Check size={16} className="text-[#0095FF]" /> 200 Products</li>
              <li className="flex gap-3 text-sm text-gray-900 font-medium"><Check size={16} className="text-[#0095FF]" /> Advanced AI (WhatsApp)</li>
              <li className="flex gap-3 text-sm text-gray-900 font-medium"><Check size={16} className="text-[#0095FF]" /> Profit Analytics</li>
            </ul>
            <Link to="/signup" className="block w-full py-3 bg-[#0095FF] text-white font-semibold text-center rounded-xl hover:bg-[#007ACC] transition-colors">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Package size={24} className="text-[#0095FF]" />
              <span className="font-bold text-2xl">KOFA</span>
            </div>
            <p className="text-gray-400 max-w-xs">
              The operating system for African commerce. Built with ❤️ in Lagos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 text-sm text-gray-400">
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Login</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-xs">
          © 2026 KOFA Inc. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

export default Landing
