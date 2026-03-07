import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Cookie } from 'lucide-react'

const CookieNotice = () => {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const accepted = localStorage.getItem('kofa_cookies_accepted')
        if (!accepted) {
            // Delay showing by 1.5s so it doesn't immediately jump in
            const timer = setTimeout(() => setVisible(true), 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    const accept = () => {
        localStorage.setItem('kofa_cookies_accepted', 'true')
        setVisible(false)
    }

    if (!visible) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[70] p-4 animate-in slide-in-from-bottom duration-300">
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <Cookie size={20} className="text-[#0095FF]" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-relaxed">
                        We use essential cookies to keep you logged in and remember your preferences.
                        By continuing to use KOFA, you agree to our{' '}
                        <Link to="/privacy" className="text-[#0095FF] hover:underline font-medium">Privacy Policy</Link>.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={accept}
                        className="px-4 py-2 bg-[#0095FF] text-white text-sm font-medium rounded-lg hover:bg-[#0080E0] transition-colors"
                    >
                        Got it
                    </button>
                    <button
                        onClick={accept}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CookieNotice
