import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
                    <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </Link>
                    <h1 className="text-lg font-semibold text-gray-900">Terms of Service</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
                        <p className="text-gray-500 text-sm">Last updated: March 7, 2026</p>
                    </div>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
                        <p className="text-gray-600 leading-relaxed">
                            By accessing or using KOFA ("the Service"), you agree to be bound by these Terms of Service.
                            If you do not agree to these terms, please do not use the Service.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">2. Description of Service</h2>
                        <p className="text-gray-600 leading-relaxed">
                            KOFA is an AI-powered business management platform designed for vendors and small business owners.
                            The Service provides:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>Product inventory management</li>
                            <li>Order tracking and processing</li>
                            <li>Expense tracking and financial analytics</li>
                            <li>AI-powered business assistant</li>
                            <li>WhatsApp commerce integration</li>
                            <li>Online storefront generation</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">3. Account Registration</h2>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>You must provide accurate information during registration.</li>
                            <li>You are responsible for maintaining the security of your account credentials.</li>
                            <li>You must be at least 18 years old to use the Service.</li>
                            <li>You are responsible for all activities that occur under your account.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">4. Acceptable Use</h2>
                        <p className="text-gray-600 leading-relaxed">You agree not to:</p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>Use the Service for any unlawful or fraudulent activity</li>
                            <li>Upload content that infringes on intellectual property rights of others</li>
                            <li>Attempt to gain unauthorized access to the Service or its systems</li>
                            <li>Interfere with or disrupt the Service's infrastructure</li>
                            <li>Use automated systems (bots, scrapers) without explicit permission</li>
                            <li>Misrepresent your identity or business information</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">5. Subscription & Pricing</h2>
                        <p className="text-gray-600 leading-relaxed">
                            KOFA offers a free tier with limited features and paid subscription plans. By subscribing to a
                            paid plan:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>You agree to pay the applicable fees as displayed at the time of purchase.</li>
                            <li>Subscriptions renew automatically unless cancelled before the renewal date.</li>
                            <li>Refunds are handled on a case-by-case basis. Contact support for assistance.</li>
                            <li>We reserve the right to modify pricing with 30 days' notice.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">6. Intellectual Property</h2>
                        <p className="text-gray-600 leading-relaxed">
                            The KOFA platform, including its design, code, features, and branding, is owned by KOFA.
                            You retain ownership of all business data you enter into the Service. By using the Service,
                            you grant us a limited license to process your data solely for the purpose of providing the Service.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">7. AI Assistant Disclaimer</h2>
                        <p className="text-gray-600 leading-relaxed">
                            The KOFA AI Assistant provides business insights and suggestions based on your data.
                            These are advisory in nature and should not be considered professional financial, legal,
                            or tax advice. You are solely responsible for business decisions made based on AI recommendations.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">8. Limitation of Liability</h2>
                        <p className="text-gray-600 leading-relaxed">
                            To the maximum extent permitted by law, KOFA shall not be liable for any indirect, incidental,
                            special, or consequential damages, including but not limited to: loss of profits, data, or
                            business opportunity, arising from your use of the Service.
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            The Service is provided "as is" without warranties of any kind, either express or implied.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">9. Service Availability</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We strive to maintain high availability but do not guarantee uninterrupted access. We reserve
                            the right to modify, suspend, or discontinue any part of the Service with reasonable notice.
                            Scheduled maintenance windows will be communicated in advance when possible.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">10. Termination</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We may suspend or terminate your access to the Service if you violate these Terms. You may
                            delete your account at any time. Upon termination, we will retain your data for 30 days
                            before permanent deletion, unless required by law to retain it longer.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">11. Governing Law</h2>
                        <p className="text-gray-600 leading-relaxed">
                            These Terms are governed by and construed in accordance with the laws of the Federal Republic
                            of Nigeria. Any disputes arising from these Terms shall be resolved through amicable negotiation
                            or, failing that, through the courts of competent jurisdiction in Nigeria.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">12. Changes to These Terms</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We may revise these Terms from time to time. Material changes will be communicated through
                            the Service or via email. Continued use of the Service after changes constitutes your acceptance
                            of the updated Terms.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">13. Contact</h2>
                        <p className="text-gray-600 leading-relaxed">
                            For questions about these Terms of Service, please contact us at:
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

export default TermsOfService
