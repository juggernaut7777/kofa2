import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
                    <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </Link>
                    <h1 className="text-lg font-semibold text-gray-900">Privacy Policy</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
                        <p className="text-gray-500 text-sm">Last updated: March 7, 2026</p>
                    </div>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">1. Introduction</h2>
                        <p className="text-gray-600 leading-relaxed">
                            KOFA ("we", "our", or "us") is committed to protecting your personal information and your right to privacy.
                            This Privacy Policy describes how we collect, use, store, and share your information when you use our
                            AI-powered business management platform at <strong>kofaapp.me</strong> (the "Service").
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            By using our Service, you agree to the collection and use of information in accordance with this policy.
                            This policy complies with the Nigeria Data Protection Regulation (NDPR) and applicable international
                            data protection standards.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">2. Information We Collect</h2>
                        <p className="text-gray-600 leading-relaxed">We collect the following types of information:</p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li><strong>Account Information:</strong> Name, email address, phone number, business name, and business address provided during registration.</li>
                            <li><strong>Business Data:</strong> Product inventory, pricing, order records, customer phone numbers, and expense records you enter into the platform.</li>
                            <li><strong>Payment Information:</strong> Bank account details you provide for payment processing (bank name, account number, account holder name).</li>
                            <li><strong>Usage Data:</strong> Log data including IP address, browser type, pages visited, and interaction patterns with the Service.</li>
                            <li><strong>AI Interaction Data:</strong> Messages and queries you send to the KOFA AI Assistant to improve response quality.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">3. How We Use Your Information</h2>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>To provide, operate, and maintain the KOFA platform</li>
                            <li>To process your business transactions, orders, and inventory management</li>
                            <li>To power the AI Assistant with relevant business context</li>
                            <li>To generate analytics, reports, and business insights</li>
                            <li>To communicate with you about your account and service updates</li>
                            <li>To detect, prevent, and address security issues</li>
                            <li>To improve and develop new features for the Service</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">4. Data Storage & Security</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Your data is stored on secure cloud servers hosted by Microsoft Azure and Heroku. We implement
                            industry-standard security measures including:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>Encrypted data transmission via SSL/TLS (HTTPS)</li>
                            <li>Hashed password storage using bcrypt</li>
                            <li>JWT-based authentication with token expiration</li>
                            <li>Session timeout after 15 minutes of inactivity</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">5. Data Sharing</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We do <strong>not</strong> sell your personal information. We may share data with:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li><strong>Service Providers:</strong> Cloud hosting (Azure, Heroku), email services, and payment processors that help us operate the platform.</li>
                            <li><strong>Legal Requirements:</strong> If required by law, regulation, or legal process.</li>
                            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">6. Your Rights</h2>
                        <p className="text-gray-600 leading-relaxed">Under the NDPR and applicable regulations, you have the right to:</p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                            <li><strong>Correction:</strong> Request correction of any inaccurate personal data.</li>
                            <li><strong>Deletion:</strong> Request deletion of your personal data and account.</li>
                            <li><strong>Data Portability:</strong> Request export of your business data in a standard format.</li>
                            <li><strong>Withdraw Consent:</strong> Withdraw your consent to data processing at any time.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">7. Cookies</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We use essential cookies and localStorage to maintain your session and preferences. We do not use
                            third-party tracking cookies for advertising purposes. You can manage cookie preferences through
                            your browser settings.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">8. Children's Privacy</h2>
                        <p className="text-gray-600 leading-relaxed">
                            The Service is intended for business owners aged 18 and above. We do not knowingly collect
                            personal information from children under 18.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">9. Changes to This Policy</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of any material changes
                            by posting the new policy on this page and updating the "Last updated" date.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">10. Contact Us</h2>
                        <p className="text-gray-600 leading-relaxed">
                            If you have any questions about this Privacy Policy or wish to exercise your data rights,
                            please contact us at:
                        </p>
                        <p className="text-gray-600">
                            <strong>Email:</strong> support@kofaapp.me<br />
                            <strong>Website:</strong> https://kofaapp.me
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="text-center py-8 text-sm text-gray-400">
                    <Link to="/" className="hover:text-gray-600 transition-colors">← Back to KOFA</Link>
                </div>
            </main>
        </div>
    )
}

export default PrivacyPolicy
