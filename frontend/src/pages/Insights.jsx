import { useState, useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'

// Import the individual page components
import Analytics from './Analytics'
import Reports from './Reports'
import Expenses from './Expenses'

const Insights = () => {
    const { theme } = useContext(ThemeContext)
    const [activeTab, setActiveTab] = useState('analytics')
    const isDark = theme === 'dark'

    const tabs = [
        { id: 'analytics', label: 'Analytics', icon: '📈' },
        { id: 'reports', label: 'Reports', icon: '📋' },
        { id: 'expenses', label: 'Expenses', icon: '💸' },
    ]

    return (
        <div className={`min-h-screen ${isDark ? 'bg-dark-bg' : 'bg-slate-50'}`}>
            {/* Tab Navigation */}
            <div className={`sticky top-16 z-40 px-4 py-3 ${isDark ? 'bg-dark-card border-b border-gray-800' : 'bg-white shadow-sm'}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                        ? 'bg-kofa-yellow text-black shadow-lg'
                                        : isDark
                                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="relative">
                {activeTab === 'analytics' && <Analytics />}
                {activeTab === 'reports' && <Reports />}
                {activeTab === 'expenses' && <Expenses />}
            </div>
        </div>
    )
}

export default Insights
