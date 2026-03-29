import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const DataDeletion = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
                    <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </Link>
                    <h1 className="text-lg font-semibold text-gray-900">Data Deletion</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Deletion Instructions</h1>
                        <p className="text-gray-500 text-sm">Last updated: March 29, 2026</p>
                    </div>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">Your Right to Delete Data</h2>
                        <p className="text-gray-600 leading-relaxed">
                            At KOFA, we respect your right to control your personal data. In accordance with the
                            Nigeria Data Protection Regulation (NDPR) and applicable international data protection
                            laws, you can request the deletion of your personal data and account at any time.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">How to Delete Your Data</h2>
                        <p className="text-gray-600 leading-relaxed">You can request data deletion through any of the following methods:</p>

                        <div className="space-y-4">
                            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                                <h3 className="font-semibold text-blue-900 mb-2">Option 1: In-App Deletion</h3>
                                <ol className="list-decimal pl-5 text-gray-600 space-y-1">
                                    <li>Log in to your KOFA account at <strong>kofaapp.me</strong></li>
                                    <li>Navigate to <strong>Settings</strong></li>
                                    <li>Scroll down to <strong>Account Management</strong></li>
                                    <li>Click <strong>"Delete My Account"</strong></li>
                                    <li>Confirm the deletion when prompted</li>
                                </ol>
                            </div>

                            <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                                <h3 className="font-semibold text-green-900 mb-2">Option 2: Email Request</h3>
                                <p className="text-gray-600">
                                    Send an email to <strong>support@kofaapp.me</strong> with the subject line
                                    <strong> "Data Deletion Request"</strong> and include:
                                </p>
                                <ul className="list-disc pl-5 text-gray-600 space-y-1 mt-2">
                                    <li>Your registered email address</li>
                                    <li>Your business name on KOFA</li>
                                    <li>Whether you want full account deletion or specific data removal</li>
                                </ul>
                            </div>

                            <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
                                <h3 className="font-semibold text-purple-900 mb-2">Option 3: Facebook/Meta Data Deletion</h3>
                                <p className="text-gray-600">
                                    If you logged in using Facebook or connected your account via Meta services,
                                    you can also request deletion through your
                                    <a href="https://www.facebook.com/settings?tab=applications" className="text-blue-600 hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                                        Facebook App Settings
                                    </a>.
                                    Remove the "kofa" app from your list of connected apps, and we will automatically
                                    process the deletion of all associated data.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">What Data Gets Deleted</h2>
                        <p className="text-gray-600 leading-relaxed">When you request full account deletion, we will permanently remove:</p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li><strong>Account Information:</strong> Name, email, phone number, business details</li>
                            <li><strong>Business Data:</strong> Product inventory, order records, expense records</li>
                            <li><strong>Customer Data:</strong> Customer contact information you stored in KOFA</li>
                            <li><strong>AI Chat History:</strong> All conversations with the KOFA AI Assistant</li>
                            <li><strong>Financial Records:</strong> Revenue, expense, and profit data</li>
                            <li><strong>Media:</strong> Product images and receipt scans you uploaded</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">Processing Timeline</h2>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li><strong>In-App Deletion:</strong> Processed immediately. Data is fully removed within 30 days.</li>
                            <li><strong>Email Requests:</strong> We will acknowledge your request within 48 hours and complete deletion within 30 days.</li>
                            <li><strong>Meta/Facebook Removal:</strong> Processed automatically within 24 hours of app removal.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">Data Retention Exceptions</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Certain data may be retained beyond the deletion period if required by Nigerian law or
                            for legitimate business purposes, including:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>Transaction records required for tax compliance (up to 6 years)</li>
                            <li>Data necessary to resolve pending disputes or legal claims</li>
                            <li>Anonymized, aggregated data that cannot identify you personally</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">Confirmation</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Once your data has been fully deleted, we will send a confirmation email to your
                            registered email address. After deletion, your data cannot be recovered.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900">Contact Us</h2>
                        <p className="text-gray-600 leading-relaxed">
                            If you have questions about data deletion or need assistance, contact us:
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
                    {' · '}
                    <Link to="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
                    {' · '}
                    <Link to="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
                </div>
            </main>
        </div>
    )
}

export default DataDeletion
