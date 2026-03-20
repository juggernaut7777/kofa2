import { useState, useEffect, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Package, Check, MessageSquare, ChevronRight,
  Store, Zap, TrendingUp, BarChart3,
  ArrowRight, Menu, X, Shield, Clock,
  Smartphone, Users, Bot, Receipt, Star
} from 'lucide-react'

/* ─── Animated counter hook ─── */
const useCountUp = (end, duration = 2000, startOnView = true) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    if (!startOnView) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const startTime = Date.now()
          const tick = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * end))
            if (progress < 1) requestAnimationFrame(tick)
          }
          tick()
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration, startOnView])

  return { count, ref }
}

/* ─── Fade-in on scroll component ─── */
const FadeIn = ({ children, className = '', delay = 0 }) => {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

const Landing = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const features = [
    {
      icon: Bot,
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.12)',
      title: 'WhatsApp AI Bot',
      desc: 'Your business runs on WhatsApp. KOFA replies to customers, checks stock, and takes orders — 24/7, no breaks.',
    },
    {
      icon: Store,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      title: 'Online Storefront',
      desc: 'Get a link you can share on Instagram and TikTok. Customers browse, order, and pay without DMing you.',
    },
    {
      icon: BarChart3,
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.12)',
      title: 'Profit Intelligence',
      desc: '"How much did I make this week?" Stop guessing. Ask KOFA. It knows your revenue, expenses, and real margins.',
    },
    {
      icon: Package,
      color: '#a855f7',
      bg: 'rgba(168,85,247,0.12)',
      title: 'Smart Inventory',
      desc: 'Track stock in real-time. Get low-stock alerts. Import products from spreadsheets. Never oversell again.',
    },
    {
      icon: Receipt,
      color: '#ec4899',
      bg: 'rgba(236,72,153,0.12)',
      title: 'Expense Tracking',
      desc: 'Log what you spend — rent, supplies, transport. KOFA calculates your true profit, not just revenue.',
    },
    {
      icon: Users,
      color: '#06b6d4',
      bg: 'rgba(6,182,212,0.12)',
      title: 'Customer CRM',
      desc: 'See who buys what, how often, and how much they spend. Build loyalty with your best customers.',
    }
  ]

  const testimonials = [
    {
      name: 'Chioma A.',
      role: 'Fashion Vendor, Lagos',
      text: 'Before KOFA I was losing track of orders in my DMs. Now my customers order from my storefront link and everything is automatic.',
      rating: 5,
    },
    {
      name: 'Emeka O.',
      role: 'Electronics Dealer, Onitsha',
      text: 'The AI bot on WhatsApp handles 70% of my inquiries. I can focus on sourcing instead of replying "How much?" all day.',
      rating: 5,
    },
    {
      name: 'Fatima M.',
      role: 'Beauty Products, Abuja',
      text: 'I finally know my actual profit. Turns out I was spending more on packaging than I thought. KOFA showed me.',
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen font-sans text-white" style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}>

      {/* ══════════ NAVIGATION ══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{
        background: 'rgba(10,10,15,0.8)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div style={{
              width: 34, height: 34,
              background: 'linear-gradient(135deg, #0095FF, #00C2FF)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,149,255,0.3)',
            }}>
              <Package size={18} strokeWidth={2.5} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', color: '#fff' }}>KOFA</span>
          </div>
          <div className="hidden md:flex items-center gap-8" style={{ fontSize: 14, fontWeight: 500 }}>
            <a href="#features" style={{ color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}>Features</a>
            <a href="#pricing" style={{ color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}>Pricing</a>
            <Link to="/login" style={{ color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}>Login</Link>
          </div>
          <Link to="/signup" className="hidden md:block">
            <button style={{
              background: '#fff',
              color: '#0a0a0f',
              padding: '8px 20px',
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 4px 20px rgba(255,255,255,0.2)' }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none' }}
            >
              Get Started →
            </button>
          </Link>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div style={{
            background: 'rgba(10,10,15,0.98)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '16px 24px 24px',
          }}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}
              style={{ display: 'block', padding: '12px 0', color: 'rgba(255,255,255,0.7)', fontWeight: 500, fontSize: 15, textDecoration: 'none' }}>Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}
              style={{ display: 'block', padding: '12px 0', color: 'rgba(255,255,255,0.7)', fontWeight: 500, fontSize: 15, textDecoration: 'none' }}>Pricing</a>
            <Link to="/login" style={{ display: 'block', padding: '12px 0', color: 'rgba(255,255,255,0.7)', fontWeight: 500, fontSize: 15, textDecoration: 'none' }}>Login</Link>
            <Link to="/signup" style={{ display: 'block', marginTop: 8 }}>
              <button style={{
                width: '100%', background: '#fff', color: '#0a0a0f',
                padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer',
              }}>Get Started</button>
            </Link>
          </div>
        )}
      </nav>

      {/* ══════════ HERO ══════════ */}
      <header style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '140px 24px 100px',
        background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(0,149,255,0.15), transparent), #0a0a0f',
        textAlign: 'center',
      }}>
        {/* Subtle grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black, transparent)',
        }} />

        <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto' }}>
          {/* Badge */}
          <FadeIn>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(0,149,255,0.1)',
              border: '1px solid rgba(0,149,255,0.2)',
              padding: '6px 16px', borderRadius: 99,
              fontSize: 13, fontWeight: 600, color: '#4db8ff',
              marginBottom: 32,
            }}>
              <Zap size={13} fill="currentColor" /> Built for African commerce
            </div>
          </FadeIn>

          {/* Main heading */}
          <FadeIn delay={0.1}>
            <h1 style={{
              fontSize: 'clamp(40px, 8vw, 80px)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              marginBottom: 24,
              color: '#fff',
            }}>
              Stop managing.<br />
              <span style={{
                background: 'linear-gradient(135deg, #0095FF 0%, #00C2FF 50%, #0095FF 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'shimmer 3s linear infinite',
              }}>Start selling.</span>
            </h1>
          </FadeIn>

          {/* Subtitle */}
          <FadeIn delay={0.2}>
            <p style={{
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              color: 'rgba(255,255,255,0.45)',
              maxWidth: 560,
              margin: '0 auto 40px',
              lineHeight: 1.6,
            }}>
              KOFA handles your inventory, orders, expenses, and customer chats — so you can focus on what you do best: selling.
            </p>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={0.3}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
              <Link to="/signup">
                <button style={{
                  background: 'linear-gradient(135deg, #0095FF, #0077CC)',
                  color: '#fff',
                  padding: '16px 32px',
                  borderRadius: 99,
                  fontSize: 16,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 32px rgba(0,149,255,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                  onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 12px 40px rgba(0,149,255,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' }}
                  onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 8px 32px rgba(0,149,255,0.3), inset 0 1px 0 rgba(255,255,255,0.15)' }}
                >
                  Start Free Trial
                </button>
              </Link>
              <a href="#features">
                <button style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.8)',
                  padding: '16px 32px',
                  borderRadius: 99,
                  fontSize: 16,
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  transition: 'background 0.2s, border-color 0.2s',
                }}
                  onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)' }}
                  onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
                >
                  See Features ↓
                </button>
              </a>
            </div>
          </FadeIn>
        </div>
      </header>

      {/* ══════════ SOCIAL PROOF BAR ══════════ */}
      <section style={{
        background: '#0a0a0f',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '40px 24px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '40px 60px' }}>
          {[
            { end: 500, suffix: '+', label: 'Vendors' },
            { end: 10, suffix: 'M+', label: 'Naira processed', prefix: '₦' },
            { end: 15000, suffix: '+', label: 'Orders handled' },
            { end: 99, suffix: '%', label: 'Uptime' },
          ].map((stat, i) => {
            const { count, ref } = useCountUp(stat.end, 2000)
            return (
              <div key={i} ref={ref} style={{ textAlign: 'center', minWidth: 100 }}>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                  {stat.prefix || ''}{count.toLocaleString()}{stat.suffix}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 500, marginTop: 4 }}>
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="features" style={{
        background: '#0a0a0f',
        padding: '80px 24px 100px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <h2 style={{
                fontSize: 'clamp(28px, 5vw, 44px)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: '#fff',
                marginBottom: 16,
              }}>
                Everything you need.<br />
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>Nothing you don't.</span>
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', maxWidth: 500, margin: '0 auto' }}>
                Built specifically for Nigerian vendors who sell on WhatsApp, Instagram, and at physical locations.
              </p>
            </div>
          </FadeIn>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20,
          }}>
            {features.map((f, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  padding: 28,
                  transition: 'border-color 0.3s, background 0.3s',
                  cursor: 'default',
                  height: '100%',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${f.color}33`; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                >
                  <div style={{
                    width: 44, height: 44,
                    background: f.bg,
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 20,
                  }}>
                    <f.icon size={22} color={f.color} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #0d1117 100%)',
        padding: '80px 24px 100px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', marginBottom: 12 }}>
                Up and running in 3 minutes
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>No training needed. No complex setup.</p>
            </div>
          </FadeIn>

          {[
            { step: '01', title: 'Sign up & add your products', desc: 'Type them in or import from a spreadsheet. Add prices, stock levels, and categories.', icon: Package },
            { step: '02', title: 'Share your store link', desc: 'Get a beautiful storefront URL. Share it on WhatsApp status, Instagram bio, or anywhere.', icon: Store },
            { step: '03', title: 'Let KOFA handle the rest', desc: 'AI manages inquiries, tracks inventory, records sales, and shows you your profit.', icon: Zap },
          ].map((item, i) => (
            <FadeIn key={i} delay={i * 0.15}>
              <div style={{
                display: 'flex', gap: 24, alignItems: 'flex-start',
                padding: '24px 0',
                borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <div style={{
                  minWidth: 56, height: 56,
                  background: 'rgba(0,149,255,0.08)',
                  border: '1px solid rgba(0,149,255,0.15)',
                  borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 800, color: '#4db8ff',
                }}>
                  {item.step}
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section style={{
        background: '#0a0a0f',
        padding: '80px 24px 100px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', marginBottom: 12 }}>
                Vendors love KOFA
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>Don't just take our word for it.</p>
            </div>
          </FadeIn>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
          }}>
            {testimonials.map((t, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  padding: 28,
                }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, marginBottom: 20, fontStyle: 'italic' }}>
                    "{t.text}"
                  </p>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{t.role}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ PRICING ══════════ */}
      <section id="pricing" style={{
        background: 'linear-gradient(180deg, #0d1117 0%, #0a0a0f 100%)',
        padding: '80px 24px 100px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', marginBottom: 12 }}>
                Simple pricing
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>Start free. Upgrade when you grow.</p>
            </div>
          </FadeIn>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            maxWidth: 960,
            margin: '0 auto',
          }}>
            {/* Free */}
            <FadeIn delay={0}>
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: '32px 28px',
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Free</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Get started</p>
                <div style={{ marginBottom: 28 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, color: '#fff' }}>₦0</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>/month</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['5 products', '15 AI queries/month', 'Basic analytics', 'Online storefront'].map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                      <Check size={15} color="#22c55e" strokeWidth={3} /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" style={{ display: 'block' }}>
                  <button style={{
                    width: '100%', padding: '14px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontWeight: 700, fontSize: 14,
                    cursor: 'pointer', transition: 'background 0.2s',
                  }}
                    onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.06)'}
                  >
                    Start Free
                  </button>
                </Link>
              </div>
            </FadeIn>

            {/* Grow */}
            <FadeIn delay={0.1}>
              <div style={{
                background: 'rgba(0,149,255,0.06)',
                border: '1px solid rgba(0,149,255,0.25)',
                borderRadius: 20,
                padding: '32px 28px',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #0095FF, #00C2FF)',
                  color: '#fff', fontSize: 11, fontWeight: 800,
                  padding: '4px 14px', borderRadius: 99,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>Popular</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Grow</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>For growing businesses</p>
                <div style={{ marginBottom: 28 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, color: '#fff' }}>₦4,500</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>/month</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['Unlimited products', '150 AI queries/month', 'Full analytics & insights', 'CSV import/export', 'Priority support'].map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                      <Check size={15} color="#4db8ff" strokeWidth={3} /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" style={{ display: 'block' }}>
                  <button style={{
                    width: '100%', padding: '14px', borderRadius: 12,
                    background: 'linear-gradient(135deg, #0095FF, #0077CC)',
                    border: 'none',
                    color: '#fff', fontWeight: 700, fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,149,255,0.3)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                    onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 24px rgba(0,149,255,0.4)' }}
                    onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 16px rgba(0,149,255,0.3)' }}
                  >
                    Start Growing
                  </button>
                </Link>
              </div>
            </FadeIn>

            {/* Pro */}
            <FadeIn delay={0.2}>
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: '32px 28px',
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Pro</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>For power sellers</p>
                <div style={{ marginBottom: 28 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, color: '#fff' }}>₦10,000</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>/month</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['Everything in Grow', '1,000 AI queries/month', '3 team members', 'WhatsApp AI bot', 'Advanced reports'].map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                      <Check size={15} color="#22c55e" strokeWidth={3} /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" style={{ display: 'block' }}>
                  <button style={{
                    width: '100%', padding: '14px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontWeight: 700, fontSize: 14,
                    cursor: 'pointer', transition: 'background 0.2s',
                  }}
                    onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.06)'}
                  >
                    Go Pro
                  </button>
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section style={{
        background: '#0a0a0f',
        padding: '80px 24px 100px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(0,149,255,0.08), transparent)',
        }} />
        <div style={{ position: 'relative' }}>
          <FadeIn>
            <h2 style={{
              fontSize: 'clamp(28px, 6vw, 48px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: '#fff',
              marginBottom: 16,
            }}>
              Ready to professionalize<br />your hustle?
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 32, maxWidth: 440, margin: '0 auto 32px' }}>
              Join hundreds of Nigerian vendors already using KOFA to grow their business.
            </p>
            <Link to="/signup">
              <button style={{
                background: 'linear-gradient(135deg, #0095FF, #0077CC)',
                color: '#fff',
                padding: '16px 40px',
                borderRadius: 99,
                fontSize: 17,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(0,149,255,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 12px 40px rgba(0,149,255,0.45), inset 0 1px 0 rgba(255,255,255,0.15)' }}
                onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 8px 32px rgba(0,149,255,0.3), inset 0 1px 0 rgba(255,255,255,0.15)' }}
              >
                Get Started for Free →
              </button>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{
        background: '#0a0a0f',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '40px 24px',
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28,
              background: 'linear-gradient(135deg, #0095FF, #00C2FF)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Package size={14} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,0.5)' }}>KOFA</span>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, fontWeight: 500 }}>
            <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}>Privacy</Link>
            <Link to="/terms" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}>Terms</Link>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 KOFA. Built in Lagos 🇳🇬</p>
        </div>
      </footer>

      {/* ══════════ GLOBAL STYLES ══════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        html { scroll-behavior: smooth; }
        
        ::selection {
          background: rgba(0,149,255,0.3);
          color: #fff;
        }
      `}</style>
    </div>
  )
}

export default Landing
