import { FaArrowLeft, FaLock, FaUserSecret, FaShieldAlt, FaFileSignature } from "react-icons/fa";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 bg-white text-orange-500 rounded-lg hover:bg-orange-50 transition-colors duration-200 font-medium"
        >
          <FaArrowLeft />
          Return to Site
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-200 mt-0 lg:mt-20">
          <div className="flex justify-center mb-4">
            <div className="bg-orange-100 p-3 rounded-full">
              <FaLock className="text-orange-500 text-2xl" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-orange-600 bg-clip-text text-transparent mb-3">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 mb-2">Your privacy matters at Gigzz</p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center">
              <FaShieldAlt className="mr-2 text-green-500" />
              Effective Date: October 21, 2025
            </div>
            <div className="flex items-center">
              <FaUserSecret className="mr-2 text-blue-500" />
              Last Updated: October 21, 2025
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto space-y-8 text-gray-700 leading-relaxed bg-white rounded-2xl shadow-md p-8 border border-gray-200">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
          <p>
            Gigzz (“we”, “our”, or “us”) is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile applications, and services that connect clients and creatives.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Personal Information:</strong> When you register on Gigzz, we collect your name, email address, phone number, role (Client or Creative), company information, and other details you provide.
            </li>
            <li>
              <strong>Profile Data:</strong> This includes your photo, bio, portfolio, skills, and uploaded files.
            </li>
            <li>
              <strong>Payment Data:</strong> If you purchase tokens or make transactions, we collect payment details through secure third-party payment processors (e.g., Paystack).
            </li>
            <li>
              <strong>Usage Data:</strong> We automatically collect information about your interactions with our platform — such as IP address, browser type, and activity logs.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide and improve our platform’s services and user experience.</li>
            <li>Facilitate communication between Clients and Creatives.</li>
            <li>Process transactions and maintain secure payments.</li>
            <li>Send important updates, notifications, and marketing communications (with your consent).</li>
            <li>Comply with legal and regulatory obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. How We Share Information</h2>
          <p>
            We do not sell or rent your personal data. We may share limited data with trusted third parties such as:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Supabase (for authentication, storage, and data management).</li>
            <li>Payment processors like Paystack (for secure payments).</li>
            <li>Analytics tools to improve platform performance.</li>
            <li>Legal authorities, when required by law or to protect our rights.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
          <p>
            We implement robust technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no online system is completely secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access, update, or delete your personal information.</li>
            <li>Withdraw consent for marketing communications.</li>
            <li>Request a copy of your data in a portable format.</li>
            <li>Deactivate or delete your account at any time.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
          <p>
            We retain your information as long as your account is active or as needed to comply with legal obligations, resolve disputes, and enforce our agreements.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Cookies and Tracking</h2>
          <p>
            Gigzz uses cookies and similar technologies to enhance your browsing experience, analyze site traffic, and personalize content. You can modify your browser settings to disable cookies, though some features may not function properly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Children's Privacy</h2>
          <p>
            Our services are not directed to individuals under 16. We do not knowingly collect data from minors. If we become aware of such collection, we will promptly delete the information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
          <p>
            Gigzz may update this Privacy Policy periodically to reflect changes in technology, laws, or business practices. Any updates will be posted on this page with a new effective date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Contact Us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy or your personal data, please contact us at:
          </p>
          <p className="mt-2 text-gray-800 font-medium">
            📧 Email: support@mygigzz.com <br />
            🌐 Website: www.mygigzz.com
          </p>
        </section>

        {/* Acceptance Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="font-bold text-green-800 text-lg mb-2">
              Acknowledgment
            </h3>
            <p className="text-green-700 mb-4">
              By using Gigzz, you acknowledge that you have read and understood our Privacy Policy and agree to our data practices.
            </p>
            <div className="flex justify-center">
              <Link
                href="/"
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 font-medium"
              >
                <FaFileSignature />
                Return to Gigzz
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
