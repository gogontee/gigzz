// pages/more.js
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import MobileHeader from "../components/MobileHeader";
import { ChevronDown } from "lucide-react";

export default function MorePage() {
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  return (
    <div className="min-h-screen bg-white text-white">
      {/* ✅ Always show MobileHeader */}
      <div className="block">
        <MobileHeader />
      </div>

      <div className="px-6 py-8 space-y-4">
        {/* Gigzzstars Dropdown */}
        <div>
          <button
            onClick={() => toggleDropdown("gigzzstars")}
            className="flex justify-between items-center w-full py-3 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition"
          >
            <span className="flex-1 text-left">Gigzzstars</span>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                openDropdown === "gigzzstars" ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {openDropdown === "gigzzstars" && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-2 bg-white text-black rounded-lg shadow p-4 grid grid-cols-1 gap-2"
              >
                <Link href="/gigzzstar" className="block px-3 py-2 rounded hover:bg-gray-100">
                  All Stars
                </Link>
                <Link href="/gigzzstars/development-it" className="block px-3 py-2 rounded hover:bg-gray-100">
                  Design &amp; Creative
                </Link>
                <Link href="/gigzzstars/development-it" className="block px-3 py-2 rounded hover:bg-gray-100">
                  Development &amp; IT
                </Link>
                <Link href="/gigzzstars/marketing-sales" className="block px-3 py-2 rounded hover:bg-gray-100">
                  Marketing &amp; Sales
                </Link>
                <Link href="/gigzzstars/writing-translation" className="block px-3 py-2 rounded hover:bg-gray-100">
                  Writing &amp; Translation
                </Link>
                <Link href="/gigzzstars/customer-support" className="block px-3 py-2 rounded hover:bg-gray-100">
                  Customer Support
                </Link>
                <Link href="/gigzzstars/finance-accounting" className="block px-3 py-2 rounded hover:bg-gray-100">
                  Finance &amp; Accounting
                </Link>
                <Link href="/gigzzstars/legal-services" className="block px-3 py-2 rounded hover:bg-gray-100">
                  Legal Services
                </Link>
                <Link href="/gigzzstars/engineering-industry" className="block px-3 py-2 rounded hover:bg-gray-100">
                  Engineering
                </Link>
                <Link href="/gigzzstars/entertainment" className="block px-3 py-2 rounded hover:bg-gray-100">
                  Entertainment
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* News */}
        <Link
          href="/news"
          className="block py-3 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition"
        >
          News
        </Link>

        {/* Pricing */}
        <Link
          href="/pricing"
          className="block py-3 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition"
        >
          Pricing
        </Link>

        {/* Why Gigzz */}
        <Link
          href="/about"
          className="block py-3 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition"
        >
          Why Gigzz
        </Link>

        {/* FAQ */}
        <Link
          href="/faq"
          className="block py-3 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition"
        >
          FAQ
        </Link>

        {/* Contact */}
        <Link
          href="/contact"
          className="block py-3 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition"
        >
          Contact
        </Link>
      </div>
    </div>
  );
}
