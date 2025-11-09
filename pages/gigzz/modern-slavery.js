// pages/gigzz/modern-slavery.js
"use client";

import { motion } from "framer-motion";

export default function ModernSlavery() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.h1
        className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 pt-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Gigzz Modern Slavery & Human Trafficking Statement
      </motion.h1>
      <p className="text-gray-500 mb-8">Date: September 2025 | Company: Gigzz</p>

      {/* Section Component */}
      <Section
        title="Our Commitment"
        content={[
          "We condemn all forms of modern slavery, forced labor, child labor, and human trafficking. Gigzz is dedicated to:",
          "• Ensuring fair treatment and equal opportunities for all Creatives and Clients using our platform.",
          "• Maintaining transparent business practices in compliance with relevant laws and regulations.",
          "• Embedding human rights principles into the way we operate and grow globally.",
        ]}
      />

      <Section
        title="Risk Assessment & Due Diligence"
        content={[
          "As a digital marketplace connecting Clients and Creatives, we acknowledge the importance of monitoring risks. We actively work to:",
          "• Review and monitor our suppliers, partners, and payment providers to prevent unethical practices.",
          "• Conduct due diligence checks where applicable to ensure ethical sourcing and service delivery.",
          "• Implement safeguards to protect vulnerable groups, including freelancers working remotely.",
        ]}
      />

      <Section
        title="Steps We Are Taking"
        content={[
          "To strengthen our commitment, Gigzz has implemented and will continue to develop:",
          "• Policies & Standards: Clear codes of conduct for staff, clients, and creatives.",
          "• Supplier Expectations: Working only with third-party providers (e.g., payment gateways, hosting services) that share our values on human rights.",
          "• Reporting Channels: Confidential avenues for reporting any suspected cases of exploitation or misconduct.",
          "• Awareness & Training: Educating our team and stakeholders on the risks of modern slavery.",
        ]}
      />

      <Section
        title="Partnerships & Collaboration"
        content={[
          "We believe in working collaboratively with regulators, industry bodies, and stakeholders to strengthen the fight against modern slavery.",
          "As Gigzz grows, we will enhance our compliance frameworks and introduce stricter monitoring processes to safeguard our community.",
        ]}
      />

      <Section
        title="Looking Ahead"
        content={[
          "In the coming year, Gigzz will:",
          "• Expand ethical sourcing assessments with our partners.",
          "• Increase transparency by publishing annual updates on our anti-slavery measures.",
          "• Strengthen monitoring tools to detect and prevent exploitative practices on our platform.",
        ]}
      />

      <Section
        title="Our Mission"
        content={[
          "Gigzz exists to empower creatives worldwide by connecting them with opportunities in a safe, ethical, and fair environment.",
          "Upholding human dignity is central to our mission, and we will continue to take meaningful steps to eliminate the risk of modern slavery across our operations and supply chain.",
        ]}
      />

      <motion.div
        className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-lg mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-2">📩 Contact Us</h2>
        <p className="text-gray-700">
          For further information or to report a concern related to this statement, please
          contact us at:{" "}
          <a
            href="mailto:compliance@gigzz.com"
            className="text-orange-600 hover:underline font-medium"
          >
            compliance@gigzz.com
          </a>
        </p>
      </motion.div>
    </div>
  );
}

function Section({ title, content }) {
  return (
    <motion.section
      className="mb-10"
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">{title}</h2>
      {content.map((line, idx) => (
        <p key={idx} className="text-gray-700 mb-2 leading-relaxed">
          {line}
        </p>
      ))}
    </motion.section>
  );
}
