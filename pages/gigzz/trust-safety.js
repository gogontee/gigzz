// pages/trust-safety.js
"use client";
import { motion } from "framer-motion";

export default function TrustSafetyPage() {
  return (
    <div className="bg-white text-gray-900 min-h-screen">
      {/* Header */}
      <header className="bg-white text-center py-10 px-6 md:px-20">
        <h1 className="pt-20 text-2xl md:text-4xl font-bold text-black">
          Trust & Safety
        </h1>
        <p className="mt-2 text-gray-500">
          Date: September 2025 | Company: Gigzz
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 md:px-20 py-12 space-y-12">
        {/* Intro */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-lg leading-relaxed">
            At <span className="font-semibold">Gigzz</span>, trust and safety are at the
            core of everything we do. Our platform was built to empower{" "}
            <strong>Creatives</strong> and <strong>Clients</strong> to connect,
            collaborate, and grow in an environment that is safe, fair, and transparent.
            We understand that when you use Gigzz, you are trusting us not only with your
            opportunities but also with your reputation, your work, and your financial
            security.
          </p>
        </motion.section>

        {/* Commitment to Safety */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold mb-4 text-black border-l-4 border-orange-500 pl-3">
            Our Commitment to Safety
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-800">
            <li>
              <strong>Verified Profiles:</strong> We require accurate information during
              signup and maintain verification measures to build trust between Clients and
              Creatives.
            </li>
            <li>
              <strong>Safe Payments:</strong> All transactions are handled through secure,
              trusted payment gateways to protect your funds.
            </li>
            <li>
              <strong>Community Standards:</strong> We enforce clear policies that
              prohibit harassment, discrimination, exploitation, or unethical behavior.
            </li>
          </ul>
        </motion.section>

        {/* How We Keep Gigzz Safe */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold mb-4 text-black border-l-4 border-orange-500 pl-3">
            How We Keep Gigzz Safe
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-800">
            <li>
              <strong>Moderation & Monitoring:</strong> Active review of jobs, portfolios,
              and communications to detect and prevent fraudulent or harmful activities.
            </li>
            <li>
              <strong>Transparent Dispute Resolution:</strong> A fair and structured
              process to resolve conflicts between Clients and Creatives.
            </li>
            <li>
              <strong>Trustworthy Ratings & Reviews:</strong> Feedback systems that allow
              users to make informed decisions when choosing who to work with.
            </li>
            <li>
              <strong>Identity & Role Clarity:</strong> Clear distinction between Clients
              and Creatives to set expectations and reduce misunderstandings.
            </li>
          </ul>
        </motion.section>

        {/* Your Role in Building Trust */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold mb-4 text-black border-l-4 border-orange-500 pl-3">
            Your Role in Building Trust
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-800">
            <li>Provide accurate and honest information on profiles and portfolios.</li>
            <li>
              As Creatives/Applicants, avoid and report any Client that requires any form
              of payment from you before offering you the job.
            </li>
            <li>
              Treat all interactions with professionalism and respect and ensure mutual
              understanding before job execution.
            </li>
            <li>Report any suspicious activity, exploitation, or misconduct immediately.</li>
            <li>
              Use secure in-platform communication systems rather than
              external channels.
            </li>
          </ul>
        </motion.section>

        {/* Mission */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold mb-4 text-black border-l-4 border-orange-500 pl-3">
            Our Mission
          </h2>
          <p className="text-lg leading-relaxed text-gray-800">
            Gigzz exists to create equal opportunities for Creatives around the world
            while ensuring Clients can find reliable talent. By embedding trust and safety
            into our platform’s design, policies, and culture, we are committed to
            protecting every member of our community and building an ecosystem where
            creativity thrives without compromise.
          </p>
        </motion.section>

        {/* Contact */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold mb-4 text-black border-l-4 border-orange-500 pl-3">
            📩 Contact Us
          </h2>
          <p className="text-lg text-gray-800">
            If you experience or notice any behavior that goes against our trust and
            safety principles, please contact us immediately at:
          </p>
          <a
            href="mailto:safety@gigzz.com"
            className="inline-block mt-4 text-orange-600 font-semibold hover:underline"
          >
            📧 safety@gigzz.com
          </a>
        </motion.section>
      </main>
    </div>
  );
}
