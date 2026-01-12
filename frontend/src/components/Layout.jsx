import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart2,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  Zap
} from 'lucide-react';
import { Button } from './ui/Button';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/products', label: 'Products', icon: Package },
    { path: '/orders', label: 'Orders', icon: ShoppingCart },
    { path: '/insights', label: 'Insights', icon: BarChart2 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-app text-main flex font-sans transition-colors duration-300">

      {/* --- Desktop Sidebar --- */}
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 glass-panel border-r border-border-subtle z-40">
        {/* Logo Area */}
        <div className="p-6 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-primary to-blue-600 flex items-center justify-center shadow-lg shadow-brand-glow">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <span className="font-bold text-xl tracking-tight">KOFA</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                  ${isActive
                    ? 'bg-brand-primary/10 text-brand-primary font-medium'
                    : 'text-muted hover:text-main hover:bg-surface-2'
                  }
                `}
              >
                <Icon size={20} className={isActive ? 'text-brand-primary' : 'text-dim group-hover:text-main'} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_var(--brand-primary)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-border-subtle">
          <div className="flex items-center gap-3 mb-4 p-3 bg-surface-2/50 rounded-xl border border-border-subtle">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.businessName || 'Business'}</p>
              <p className="text-xs text-muted truncate">{user?.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center p-2 rounded-lg text-muted hover:bg-surface-2 hover:text-main transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center p-2 rounded-lg text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* --- Mobile Header --- */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 glass-panel z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-primary to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold">K</span>
          </div>
          <span className="font-bold text-lg">KOFA</span>
        </div>
        <button onClick={toggleTheme} className="p-2 text-muted">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 lg:ml-64 pt-20 lg:pt-8 px-4 lg:px-8 pb-24 lg:pb-8 min-w-0 overflow-x-hidden">
        <div className="max-w-6xl mx-auto animate-fadeIn">
          {children}
        </div>
      </main>

      {/* --- Mobile Bottom Nav --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 glass-panel border-t border-border-subtle z-50 flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive ? 'text-brand-primary' : 'text-muted hover:text-main'
                }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
};

export default Layout;
