import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ThemeContext } from '../../context/ThemeContext'
import {
    ChevronLeft, ChevronRight, Store, Lock, Bell, Globe,
    MessageSquare, Instagram, CreditCard, HelpCircle, FileText,
    LogOut, Moon, Sun, ExternalLink
} from 'lucide-react'

const SettingsRedesign = () => {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const [profile] = useState({
        storeName: user?.storeName || user?.businessName || 'My Store',
        tagline: 'Premium products & accessories...'
    })

    const [integrations, setIntegrations] = useState({
        whatsapp: true,
        instagram: false,
        paystack: true
    })

    const handleLogout = () => {
        if (confirm('Are you sure you want to log out?')) {
            logout()
            navigate('/login')
        }
    }

    const SettingsItem = ({ icon: Icon, label, value, onClick, hasChevron = true, iconColor = 'blue' }) => (
        <div onClick={onClick} className={`flex items-center justify-between p-4 cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor === 'blue' ? 'bg-blue-100 text-blue-500' :
                        iconColor === 'green' ? 'bg-green-100 text-green-500' :
                            iconColor === 'orange' ? 'bg-orange-100 text-orange-500' :
                                iconColor === 'purple' ? 'bg-purple-100 text-purple-500' :
                                    'bg-gray-100 text-gray-500'
                    }`}>
                    <Icon size={18} />
                </div>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {value && <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{value}</span>}
                {hasChevron && <ChevronRight size={18} className={isDark ? 'text-gray-600' : 'text-gray-300'} />}
            </div>
        </div>
    )

    const ToggleSwitch = ({ enabled, onChange }) => (
        <button
            onClick={() => onChange(!enabled)}
            className={`w-12 h-7 rounded-full transition-colors ${enabled ? 'bg-[#0095FF]' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
        >
            <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    )

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#0F0F12]' : 'bg-gray-50'}`}>
            {/* Header */}
            <header className={`px-4 pt-4 pb-2 flex items-center justify-center relative ${isDark ? 'text-white' : ''}`}>
                <button onClick={() => navigate('/dashboard')} className={`absolute left-2 p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-semibold">Settings</h1>
            </header>

            {/* Profile Card */}
            <div className="px-4 py-4">
                <div className={`rounded-2xl p-4 ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-sm'}`}>
                    <div className="flex items-center gap-4 cursor-pointer">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                            <Store size={24} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                        </div>
                        <div className="flex-1">
                            <h2 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{profile.storeName}</h2>
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{profile.tagline}</p>
                        </div>
                        <ChevronRight size={20} className={isDark ? 'text-gray-600' : 'text-gray-300'} />
                    </div>
                </div>
            </div>

            {/* Appearance */}
            <div className="px-4 pb-4">
                <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 px-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>APPEARANCE</h3>
                <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-sm'}`}>
                    <div className={`flex items-center justify-between p-4`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-500'}`}>
                                {isDark ? <Moon size={18} /> : <Sun size={18} />}
                            </div>
                            <div>
                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Dark Mode</p>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{isDark ? 'On' : 'Off'}</p>
                            </div>
                        </div>
                        <ToggleSwitch enabled={isDark} onChange={toggleTheme} />
                    </div>
                </div>
            </div>

            {/* Account Section */}
            <div className="px-4 pb-4">
                <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 px-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>ACCOUNT</h3>
                <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-sm'}`}>
                    <SettingsItem icon={Lock} label="Password & Security" onClick={() => { }} />
                    <SettingsItem icon={Bell} label="Notifications" onClick={() => { }} />
                    <SettingsItem icon={Globe} label="Language & Region" value="English" onClick={() => { }} />
                </div>
            </div>

            {/* Integrations Section */}
            <div className="px-4 pb-4">
                <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 px-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>INTEGRATIONS</h3>
                <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-sm'}`}>
                    {/* WhatsApp */}
                    <div className={`flex items-center justify-between p-4 ${isDark ? 'border-b border-white/5' : 'border-b border-gray-50'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-500 flex items-center justify-center">
                                <MessageSquare size={18} />
                            </div>
                            <div>
                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>WhatsApp Business</p>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Auto-reply to orders</p>
                            </div>
                        </div>
                        <ToggleSwitch enabled={integrations.whatsapp} onChange={(val) => setIntegrations({ ...integrations, whatsapp: val })} />
                    </div>

                    {/* Instagram */}
                    <div className={`flex items-center justify-between p-4 ${isDark ? 'border-b border-white/5' : 'border-b border-gray-50'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-500 flex items-center justify-center">
                                <Instagram size={18} />
                            </div>
                            <div>
                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Instagram Shop</p>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Sync inventory</p>
                            </div>
                        </div>
                        <button className="text-[#0095FF] font-semibold text-sm border border-[#0095FF] px-3 py-1 rounded-lg hover:bg-blue-50">
                            Connect
                        </button>
                    </div>

                    {/* Paystack */}
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-500 flex items-center justify-center">
                                <CreditCard size={18} />
                            </div>
                            <div>
                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Paystack Payments</p>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Payouts enabled</p>
                            </div>
                        </div>
                        <span className="flex items-center gap-1 text-sm text-green-500 font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Active
                        </span>
                    </div>
                </div>
            </div>

            {/* Support Section */}
            <div className="px-4 pb-4">
                <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 px-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>SUPPORT</h3>
                <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-sm'}`}>
                    <SettingsItem icon={HelpCircle} label="Help Center" onClick={() => { }} />
                    <SettingsItem icon={FileText} label="Legal & Terms" onClick={() => { }} />
                </div>
            </div>

            {/* Logout Button */}
            <div className="px-4 pb-8">
                <button
                    onClick={handleLogout}
                    className={`w-full py-3 text-center text-red-500 font-semibold rounded-xl ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'border border-gray-200 hover:bg-gray-50'}`}
                >
                    Log Out
                </button>
            </div>

            {/* App Version */}
            <div className="text-center pb-32">
                <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>KOFA Merchant App v1.0.2</p>
            </div>
        </div>
    )
}

export default SettingsRedesign
