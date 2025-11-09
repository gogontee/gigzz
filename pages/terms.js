import {
  FaPrint,
  FaDownload,
  FaArrowLeft,
  FaShieldAlt,
  FaFileContract,
  FaBalanceScale,
  FaUserCheck,
  FaCreditCard,
  FaCreativeCommons,
  FaExclamationTriangle,
  FaGavel,
  FaHandshake,
  FaSync,
  FaEnvelope,
} from "react-icons/fa";
import Link from "next/link";


export default function Terms() {
  const handlePrint = () => window.print();
  const handleBack = () => window.history.back();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 lg:pt-20">
        <Link
  href="/"
  className="flex items-center gap-2 px-6 py-3 bg-white text-orange-500 rounded-lg hover:bg-orange-50 transition-colors duration-200 font-medium"
>
  <FaArrowLeft />
  Return to Site
</Link>

        
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-200">
          <div className="flex justify-center mb-4">
            <div className="bg-orange-100 p-3 rounded-full">
              <FaFileContract className="text-orange-500 text-2xl" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-orange-600 bg-clip-text text-transparent mb-3">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600 mb-2">Gigzz Platform Agreement</p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center">
              <FaShieldAlt className="mr-2 text-green-500" />
              Last updated: October 21, 2025
            </div>
            <div className="flex items-center">
              <FaUserCheck className="mr-2 text-blue-500" />
              Binding agreement
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Table of Contents */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8 border border-gray-200">
              <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center">
                <FaBalanceScale className="mr-2 text-orange-500" />
                Contents
              </h3>
              <nav className="space-y-2">
                {[
                  "Introduction",
                  "Eligibility",
                  "Account Registration",
                  "Service Description",
                  "Tokens & Payments",
                  "User Content",
                  "Conduct",
                  "Intellectual Property",
                  "Privacy",
                  "Termination",
                  "Disclaimers",
                  "Liability",
                  "Indemnification",
                  "Dispute Resolution",
                  "Changes to Terms",
                  "Miscellaneous",
                  "Contact"
                ].map((item, index) => (
                  <a
                    key={index}
                    href={`#section-${index + 1}`}
                    className="block text-sm text-gray-600 hover:text-orange-500 py-1 px-2 rounded-lg hover:bg-orange-50 transition-all duration-200"
                  >
                    {index + 1}. {item}
                  </a>
                ))}
              </nav>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
                >
                  <FaPrint />
                  Print / Save PDF
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              {/* Important Notice */}
              <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg mb-8">
                <div className="flex items-start">
                  <FaExclamationTriangle className="text-orange-500 text-xl mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-orange-800 text-lg mb-2">Important Legal Notice</h3>
                    <p className="text-orange-700">
                      These Terms constitute a binding legal agreement between you and Gigzz. 
                      Please read them carefully. By using our platform, you agree to be bound by these Terms.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 1: Introduction */}
              <section id="section-1" className="mb-8 scroll-mt-8">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg mr-4">
                    <span className="text-blue-600 font-bold text-lg">1</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Introduction</h2>
                </div>
                <div className="ml-12">
                  <p className="text-gray-700 leading-relaxed">
                    Welcome to <span className="font-semibold text-orange-600">Gigzz</span> — a premier platform that connects Clients (employers) with Creatives (applicants) across Remote, Hybrid, and Onsite opportunities. These Terms of Service ("Terms") govern your access to and use of the Gigzz website, mobile sites, APIs, and other products and services provided by Gigzz (collectively, the "Service"). 
                  </p>
                  <p className="text-gray-700 mt-3 leading-relaxed">
                    By registering, accessing, or using the Service you agree to be bound by these Terms. If you are accepting these Terms on behalf of an organization, you represent that you have authority to bind that organization to these Terms.
                  </p>
                </div>
              </section>

              {/* Section 2: Eligibility */}
              <section id="section-2" className="mb-8 scroll-mt-8">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-2 rounded-lg mr-4">
                    <span className="text-green-600 font-bold text-lg">2</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Eligibility</h2>
                </div>
                <div className="ml-12">
                  <p className="text-gray-700 leading-relaxed">
                    You must be at least <span className="font-semibold">18 years old</span> to use Gigzz. By using the Service you represent that you are legally capable of entering into binding contracts and that your use will comply with these Terms and all applicable laws, regulations, and industry standards.
                  </p>
                </div>
              </section>

              {/* Section 3: Account Registration */}
              <section id="section-3" className="mb-8 scroll-mt-8">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 p-2 rounded-lg mr-4">
                    <span className="text-purple-600 font-bold text-lg">3</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Account Registration</h2>
                </div>
                <div className="ml-12">
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="bg-gray-200 rounded-full w-2 h-2 mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Account types:</strong> You may register as a Client or a Creative. Provide accurate, current information and keep your account secure.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-gray-200 rounded-full w-2 h-2 mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Authentication & profile:</strong> You are responsible for activity on your account. Keep your password secret and notify Gigzz immediately if you suspect unauthorized use.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-gray-200 rounded-full w-2 h-2 mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Profile content:</strong> Profiles must not include false or misleading information. Gigzz may suspend or remove profiles that violate these Terms.</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 4: Service Description */}
              <section id="section-4" className="mb-8 scroll-mt-8">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-100 p-2 rounded-lg mr-4">
                    <span className="text-indigo-600 font-bold text-lg">4</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Service Description</h2>
                </div>
                <div className="ml-12">
                  <p className="text-gray-700 leading-relaxed">
                    Gigzz provides job listings, search and discovery, application and messaging tools, portfolio hosting, and token-based access to certain features. Gigzz acts solely as a venue that enables Clients and Creatives to find and work with each other — Gigzz does not employ either party and has no direct control over the relationships that form on the platform.
                  </p>
                </div>
              </section>

              {/* Section 5: Tokens & Payments */}
<section id="section-5" className="mb-8 scroll-mt-8">
  <div className="flex items-center mb-4">
    <div className="bg-yellow-100 p-2 rounded-lg mr-4">
      <span className="text-yellow-600 font-bold text-lg">5</span>
    </div>
    <h2 className="text-2xl font-bold text-gray-900">Tokens, Purchases & Payments</h2>
  </div>
  <div className="ml-12">
    <p className="text-gray-700 leading-relaxed mb-4">
      Certain actions on Gigzz require tokens or payments. Purchasing tokens, subscription tiers, or other paid features is governed by these rules:
    </p>
    <ul className="space-y-3 text-gray-700">
      <li className="flex items-start">
        <FaCreditCard className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span><strong>Token types:</strong> Gigzz offers (20 tokens) as the standard packages — see the price page for current offers and prices.</span>
      </li>
      <li className="flex items-start">
        <FaSync className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span><strong>Token usage & expiry:</strong> Tokens are consumed according to the product rules (for example, 3 token per job application). Tokens expire three (3) months after purchase unless otherwise stated.</span>
      </li>
      <li className="flex items-start">
        <FaCreditCard className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span><strong>Payments:</strong> All payments are processed through third-party payment processors. You agree to provide accurate payment information and to pay all fees and taxes associated with purchases.</span>
      </li>
      <li className="flex items-start">
        <FaHandshake className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span><strong>Refunds:</strong> Refund policies depend on the product and the payment processor. Unless expressly stated, token purchases are non-refundable. Gigzz reserves the right to issue refunds in exceptional cases at its discretion.</span>
      </li>
    </ul>
  </div>
</section>

{/* Section 6: User Content */}
<section id="section-6" className="mb-8 scroll-mt-8">
  <div className="flex items-center mb-4">
    <div className="bg-pink-100 p-2 rounded-lg mr-4">
      <span className="text-pink-600 font-bold text-lg">6</span>
    </div>
    <h2 className="text-2xl font-bold text-gray-900">User Content & Licenses</h2>
  </div>
  <div className="ml-12">
    <p className="text-gray-700 leading-relaxed mb-4">
      "User Content" means any content you post, upload, or submit to the Service (profiles, portfolios, job listings, messages, images, etc.).
    </p>
    <ul className="space-y-3 text-gray-700">
      <li className="flex items-start">
        <FaCreativeCommons className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span><strong>Responsibility:</strong> You are solely responsible for User Content you provide and any consequences that result from it.</span>
      </li>
      <li className="flex items-start">
        <FaCreativeCommons className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span><strong>License to Gigzz:</strong> By posting User Content you grant Gigzz a worldwide, non-exclusive, royalty-free, transferable license to use, copy, modify, display, distribute, and prepare derivative works of the content for the purpose of operating, improving, and promoting the Service.</span>
      </li>
      <li className="flex items-start">
        <FaCreativeCommons className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span><strong>Ownership:</strong> You retain ownership of your User Content subject to the license above and any third-party rights (e.g., photographs you do not own may not be uploaded without rights).</span>
      </li>
      <li className="flex items-start">
        <FaExclamationTriangle className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span><strong>Prohibited content:</strong> Do not post unlawful, infringing, defamatory, obscene, pornographic, harassing, hateful, or otherwise objectionable content.</span>
      </li>
    </ul>
  </div>
</section>

{/* Section 7: Conduct */}
<section id="section-7" className="mb-8 scroll-mt-8">
  <div className="flex items-center mb-4">
    <div className="bg-red-100 p-2 rounded-lg mr-4">
      <span className="text-red-600 font-bold text-lg">7</span>
    </div>
    <h2 className="text-2xl font-bold text-gray-900">Conduct & Prohibited Activities</h2>
  </div>
  <div className="ml-12">
    <p className="text-gray-700 leading-relaxed mb-4">
      You agree not to engage in the following prohibited activities:
    </p>
    <ul className="space-y-3 text-gray-700">
      <li className="flex items-start">
        <FaExclamationTriangle className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span>Use the Service for illegal activities or to violate any law or regulation.</span>
      </li>
      <li className="flex items-start">
        <FaExclamationTriangle className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span>Impersonate another person, create multiple accounts to manipulate ratings, tokens, or features, or engage in fraud.</span>
      </li>
      <li className="flex items-start">
        <FaExclamationTriangle className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span>Transmit viruses, malware, or other harmful code or attempt to gain unauthorized access to Gigzz or other users.</span>
      </li>
      <li className="flex items-start">
        <FaExclamationTriangle className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span>Solicit, harvest, or expose personal data of other users without consent.</span>
      </li>
      <li className="flex items-start">
        <FaExclamationTriangle className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span>Use the Service to post discriminatory or harassing content or to engage in abusive messaging.</span>
      </li>
    </ul>
  </div>
</section>

{/* Section 8: Intellectual Property */}
<section id="section-8" className="mb-8 scroll-mt-8">
  <div className="flex items-center mb-4">
    <div className="bg-indigo-100 p-2 rounded-lg mr-4">
      <span className="text-indigo-600 font-bold text-lg">8</span>
    </div>
    <h2 className="text-2xl font-bold text-gray-900">Intellectual Property</h2>
  </div>
  <div className="ml-12">
    <p className="text-gray-700 leading-relaxed mb-4">
      All Gigzz branding, logos, designs, and the Service (excluding User Content) are Gigzz's intellectual property. You may not copy, distribute, or create derivative works from Gigzz intellectual property without our prior written permission.
    </p>
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
      <p className="text-blue-700 text-sm">
        <strong>Note:</strong> The Gigzz name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of Gigzz or its affiliates or licensors.
      </p>
    </div>
  </div>
</section>

{/* Section 9: Privacy */}
<section id="section-9" className="mb-8 scroll-mt-8">
  <div className="flex items-center mb-4">
    <div className="bg-teal-100 p-2 rounded-lg mr-4">
      <span className="text-teal-600 font-bold text-lg">9</span>
    </div>
    <h2 className="text-2xl font-bold text-gray-900">Privacy</h2>
  </div>
  <div className="ml-12">
    <p className="text-gray-700 leading-relaxed mb-4">
      Gigzz's Privacy Policy explains how we collect, use, and share personal information. By using the Service you consent to those practices. The Privacy Policy is a separate document and is incorporated into these Terms by reference.
    </p>
    <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
      <p className="text-teal-700 text-sm">
        <strong>Data Protection:</strong> We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage.
      </p>
    </div>
  </div>
</section>

{/* Section 10: Termination */}
<section id="section-10" className="mb-8 scroll-mt-8">
  <div className="flex items-center mb-4">
    <div className="bg-orange-100 p-2 rounded-lg mr-4">
      <span className="text-orange-600 font-bold text-lg">10</span>
    </div>
    <h2 className="text-2xl font-bold text-gray-900">Termination & Suspension</h2>
  </div>
  <div className="ml-12">
    <p className="text-gray-700 leading-relaxed mb-4">
      Gigzz may suspend or terminate your account or access to the Service at any time for violations of these Terms or for other business reasons. You can also close your account at any time via account settings.
    </p>
    <ul className="space-y-3 text-gray-700">
      <li className="flex items-start">
        <FaExclamationTriangle className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span><strong>Effect of Termination:</strong> Termination does not relieve you of obligations incurred prior to termination (including payment obligations and indemnities).</span>
      </li>
      <li className="flex items-start">
        <FaExclamationTriangle className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span><strong>Content Retention:</strong> Some content may remain on our servers for a reasonable period after termination for legal and operational purposes.</span>
      </li>
    </ul>
  </div>
</section>

{/* Section 11: Disclaimers */}
<section id="section-11" className="mb-8 scroll-mt-8">
  <div className="flex items-center mb-4">
    <div className="bg-gray-100 p-2 rounded-lg mr-4">
      <span className="text-gray-600 font-bold text-lg">11</span>
    </div>
    <h2 className="text-2xl font-bold text-gray-900">Disclaimers</h2>
  </div>
  <div className="ml-12">
    <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg mb-4">
      <p className="text-red-700 font-semibold">
        THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.
      </p>
    </div>
    <p className="text-gray-700 leading-relaxed">
      GIGZZ DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. GIGZZ DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. GIGZZ MAKES NO WARRANTIES REGARDING THE QUALITY, ACCURACY, TIMELINESS, OR RELIABILITY OF ANY CONTENT OR SERVICES OBTAINED THROUGH THE PLATFORM.
    </p>
  </div>
</section>

{/* Section 12: Liability */}
<section id="section-12" className="mb-8 scroll-mt-8">
  <div className="flex items-center mb-4">
    <div className="bg-purple-100 p-2 rounded-lg mr-4">
      <span className="text-purple-600 font-bold text-lg">12</span>
    </div>
    <h2 className="text-2xl font-bold text-gray-900">Limitation of Liability</h2>
  </div>
  <div className="ml-12">
    <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-lg mb-4">
      <p className="text-purple-700 font-semibold">
        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW
      </p>
    </div>
    <p className="text-gray-700 leading-relaxed mb-4">
      GIGZZ AND ITS AFFILIATES SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS, REVENUE, DATA, OR USE. GIGZZ'S AGGREGATE LIABILITY FOR DIRECT DAMAGES ARISING FROM THESE TERMS SHALL BE LIMITED TO THE AMOUNT YOU PAID TO GIGZZ IN THE SIX (6) MONTHS PRIOR TO THE CLAIM, OR USD 100, WHICHEVER IS GREATER.
    </p>
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="text-yellow-700 text-sm">
        <strong>Important:</strong> This limitation applies to all claims of any nature, whether based on contract, tort, or any other legal theory.
      </p>
    </div>
  </div>
</section>

{/* Section 13: Indemnification */}
<section id="section-13" className="mb-8 scroll-mt-8">
  <div className="flex items-center mb-4">
    <div className="bg-green-100 p-2 rounded-lg mr-4">
      <span className="text-green-600 font-bold text-lg">13</span>
    </div>
    <h2 className="text-2xl font-bold text-gray-900">Indemnification</h2>
  </div>
  <div className="ml-12">
    <p className="text-gray-700 leading-relaxed mb-4">
      You agree to indemnify, defend, and hold harmless Gigzz, its officers, directors, employees, and agents from any claims, losses, liabilities, damages, costs, and expenses (including reasonable attorneys' fees) arising from:
    </p>
    <ul className="space-y-3 text-gray-700">
      <li className="flex items-start">
        <FaShieldAlt className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span>Your use of the Service</span>
      </li>
      <li className="flex items-start">
        <FaShieldAlt className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span>Your User Content</span>
      </li>
      <li className="flex items-start">
        <FaShieldAlt className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span>Your breach of these Terms</span>
      </li>
      <li className="flex items-start">
        <FaShieldAlt className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span>Your violation of any laws or third-party rights</span>
      </li>
    </ul>
  </div>
</section>

{/* Section 14: Dispute Resolution */}
<section id="section-14" className="mb-8 scroll-mt-8">
  <div className="flex items-center mb-4">
    <div className="bg-blue-100 p-2 rounded-lg mr-4">
      <span className="text-blue-600 font-bold text-lg">14</span>
    </div>
    <h2 className="text-2xl font-bold text-gray-900">Dispute Resolution & Governing Law</h2>
  </div>
  <div className="ml-12">
    <p className="text-gray-700 leading-relaxed mb-4">
      These Terms are governed by the laws of the Federal Republic of Nigeria without regard to conflict-of-law principles.
    </p>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <p className="text-blue-700 text-sm">
        <strong>Arbitration Agreement:</strong> Except where prohibited by law, you and Gigzz agree to resolve disputes through binding arbitration in Lagos, Nigeria, under the Arbitration and Conciliation Act and the rules chosen by the arbitrator.
      </p>
    </div>
    <p className="text-gray-700 leading-relaxed">
      Either party may seek injunctive relief in a court of competent jurisdiction. You and Gigzz agree that any arbitration or proceeding shall be conducted on an individual basis and not in a class, consolidated, or representative action.
    </p>
  </div>
</section>

{/* Section 15: Changes to Terms */}
<section id="section-15" className="mb-8 scroll-mt-8">
  <div className="flex items-center mb-4">
    <div className="bg-indigo-100 p-2 rounded-lg mr-4">
      <span className="text-indigo-600 font-bold text-lg">15</span>
    </div>
    <h2 className="text-2xl font-bold text-gray-900">Changes to These Terms</h2>
  </div>
  <div className="ml-12">
    <p className="text-gray-700 leading-relaxed mb-4">
      Gigzz may update these Terms from time to time to reflect changes in our practices, service offerings, or legal requirements.
    </p>
    <ul className="space-y-3 text-gray-700">
      <li className="flex items-start">
        <FaSync className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span><strong>Notification:</strong> We will notify users of material changes through the Service or via email</span>
      </li>
      <li className="flex items-start">
        <FaSync className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span><strong>Effective Date:</strong> Updated Terms will include an "Effective Date" at the top</span>
      </li>
      <li className="flex items-start">
        <FaSync className="text-orange-500 mr-3 mt-1 flex-shrink-0" />
        <span><strong>Acceptance:</strong> Continued use after changes constitutes acceptance of the updated Terms</span>
      </li>
    </ul>
  </div>
</section>

{/* Section 16: Miscellaneous */}
<section id="section-16" className="mb-8 scroll-mt-8">
  <div className="flex items-center mb-4">
    <div className="bg-gray-100 p-2 rounded-lg mr-4">
      <span className="text-gray-600 font-bold text-lg">16</span>
    </div>
    <h2 className="text-2xl font-bold text-gray-900">Miscellaneous</h2>
  </div>
  <div className="ml-12">
    <p className="text-gray-700 leading-relaxed mb-4">
      If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force. These Terms, together with any policies referenced herein and any agreements you enter into with Gigzz, constitute the entire agreement between you and Gigzz regarding the Service.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Key Provisions</h4>
        <ul className="space-y-1 text-gray-700">
          <li>• Entire Agreement</li>
          <li>• Severability</li>
          <li>• No Waiver</li>
          <li>• Assignment</li>
        </ul>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Relationship</h4>
        <ul className="space-y-1 text-gray-700">
          <li>• Independent Contractors</li>
          <li>• No Third-Party Beneficiaries</li>
          <li>• Force Majeure</li>
        </ul>
      </div>
    </div>
  </div>
</section>
              {/* Section 17: Contact */}
              <section id="section-17" className="mb-8 scroll-mt-8">
                <div className="flex items-center mb-4">
                  <div className="bg-red-100 p-2 rounded-lg mr-4">
                    <span className="text-red-600 font-bold text-lg">17</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
                </div>
                <div className="ml-12">
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center mb-4">
                      <FaEnvelope className="text-orange-500 text-xl mr-3" />
                      <h3 className="font-semibold text-lg text-gray-900">Get in Touch</h3>
                    </div>
                    <p className="text-gray-700 mb-4">
                      If you have questions about these Terms or need support, please contact us through any of the following channels:
                    </p>
                    <ul className="space-y-2 text-gray-700">
                      <li><strong>Support:</strong> gigzzafrica@gmail.com</li>
                      <li><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM WAT</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Acceptance Section */}
<div className="mt-12 pt-8 border-t border-gray-200">
  <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
    <h3 className="font-bold text-green-800 text-lg mb-2">Acceptance of Terms</h3>
    <p className="text-green-700 mb-4">
      By using Gigzz, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
    </p>
    <div className="flex justify-center gap-4">
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
      >
        <FaDownload />
        Save for Records
      </button>
      <Link
        href="/"
        className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 font-medium"
      >
        <FaArrowLeft />
        Return to Site
      </Link>
    </div>
  </div>
</div>

            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .max-w-6xl {
            max-width: 100% !important;
          }
          .shadow-lg, .shadow-xl {
            box-shadow: none !important;
          }
          .border {
            border: 1px solid #e5e7eb !important;
          }
        }
      `}</style>
    </div>
  );
}