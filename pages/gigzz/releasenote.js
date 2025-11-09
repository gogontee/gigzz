// pages/gigzz/releasenote.js
"use client";

import { motion } from "framer-motion";

export default function ReleaseNote() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.h1
        className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 md:pt-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        🚀 Gigzz Release Notes – v1.0
      </motion.h1>
      <p className="text-gray-500 mb-8">September 19, 2025</p>

      {/* Intro */}
      <p className="text-lg text-gray-700 mb-8 leading-relaxed">
        We’re excited to announce the first official release of <strong>Gigzz</strong>, 
        your all-in-one creative job marketplace connecting <strong>Clients</strong> and{" "}
        <strong>Creatives</strong> across the globe. This update lays the foundation 
        for finding work, showcasing talent, and building meaningful collaborations.
      </p>

      {/* New Features */}
      <Section title="✨ New Features">
        <List>
          <Item>Role-based Signup – Clients and Creatives can now sign up with personalized profiles.</Item>
          <Item>Portfolios – Creatives can create up to 6 portfolios, each with up to 6 gallery images, project descriptions, and external links.</Item>
          <Item>
            Token System – Apply to jobs using Gigzz Tokens:
            <ul className="list-disc list-inside ml-4 mt-2 text-gray-700">
              <li>Standard Pack: 3 tokens</li>
            </ul>
          </Item>
          <Item>Job Applications – Submit tailored applications with a cover letter, up to 3 links, and 3 attachments.</Item>
          <Item>Job Posting – Clients can create detailed job posts with deadlines, budget ranges, and requirements.</Item>
          <Item>Promotions – Boost your profile or portfolio for 5 Gigzz to appear on client dashboards and get featured in the GigzzStar section.</Item>
          <Item>Dashboards – Separate, streamlined dashboards for Clients and Creatives.</Item>
          <Item>Wallet Funding – Secure payment integration with Paystack to fund your Gigzz wallet.</Item>
          <Item>In-App Messaging – Direct messaging between Clients & Creatives.</Item>
          <Item>Job Search – Advanced job filters for faster discovery.</Item>
          <Item>Wallet Top-up – Expanded wallet funding and payment methods.</Item>
        </List>
      </Section>

      {/* Improvements */}
      <Section title="🛠 Improvements">
        <List>
          <Item>Clean, mobile-first design with smooth tab-based navigation (Remote / Hybrid / Onsite jobs).</Item>
          <Item>Real-time visibility: promoted portfolios are highlighted on the client side.</Item>
          <Item>Profile = CV: optimized profiles to serve as your digital résumé.</Item>
        </List>
      </Section>

      {/* Fixes */}
      <Section title="🐞 Fixes">
        <List>
          <Item>Fixed issues with portfolio RLS insert errors on Supabase.</Item>
          <Item>Improved token deduction logic during job applications.</Item>
          <Item>Resolved signup errors related to wallet auto-funding.</Item>
        </List>
      </Section>

      {/* Mission */}
      <Section title="🌍 Mission">
        <p className="text-gray-700 leading-relaxed">
          Gigzz is built on the mission of empowering creatives to showcase their talent, 
          connect with global clients, and access equal opportunities — wherever they are.
        </p>
      </Section>

      {/* Next Up */}
      <Section title="📅 Next Up">
        <p className="text-gray-700 leading-relaxed">
          In-app third-party payments and more exciting features coming soon...
        </p>
      </Section>

      {/* Tip */}
      <div className="mt-10 p-4 bg-orange-50 border-l-4 border-orange-400 rounded-xl">
        <p className="text-gray-800 font-medium">
          ⚡ Tip: Keep your portfolio clean, professional, and promoted — 
          your next big opportunity might just find you!
        </p>
      </div>
    </div>
  );
}

/* --- Small helpers for clean structure --- */
function Section({ title, children }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function List({ children }) {
  return <ul className="list-disc list-inside space-y-2 text-gray-700">{children}</ul>;
}

function Item({ children }) {
  return <li>{children}</li>;
}
