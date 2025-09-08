// pages/more.js
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import MobileHeader from "../components/MobileHeader";
import { ChevronDown } from "lucide-react";
import { Briefcase, Globe, Users, Building2 } from "lucide-react";

export default function MorePage() {
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* ✅ Always show MobileHeader */}
      <div className="block">
        <MobileHeader />
      </div>

      <div className="px-6 py-8 space-y-4 pt-4 md:pt-20">
        {/* Gigzzstars Dropdown */}
        <div>
          <button
            onClick={() => toggleDropdown("gigzzstars")}
            className="flex justify-between items-center w-full py-3 px-4 rounded-lg bg-zinc-50 shadow text-black hover:bg-orange-400 hover:text-white transition"
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
                <Link href="/gigzzstars/design-creative" className="block px-3 py-2 rounded hover:bg-gray-100">
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

        {/* Other Tabs */}
        {[
          { href: "/news", label: "News" },
          { href: "/pricing", label: "Pricing" },
          { href: "/about", label: "Why Gigzz" },
          { href: "/faq", label: "FAQ" },
          { href: "/contact", label: "Contact" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block py-3 px-4 rounded-lg bg-zinc-50 shadow text-black hover:bg-orange-400 hover:text-white transition"
          >
            {item.label}
          </Link>
        ))}

        {/* ✅ Jobs Quick Links Row */}
        <div className="flex justify-between items-center mt-6 px-2">
          <Link href="/job/alljobs" className="flex flex-col items-center text-black hover:text-orange-400">
            <Briefcase className="w-6 h-6 mb-1" />
            <span className="text-xs">All Jobs</span>
          </Link>
          <Link href="/remote" className="flex flex-col items-center text-black hover:text-orange-400">
            <Globe className="w-6 h-6 mb-1" />
            <span className="text-xs">Remote</span>
          </Link>
          <Link href="/hybrid" className="flex flex-col items-center text-black hover:text-orange-400">
            <Users className="w-6 h-6 mb-1" />
            <span className="text-xs">Hybrid</span>
          </Link>
          <Link href="/onsite" className="flex flex-col items-center text-black hover:text-orange-400">
            <Building2 className="w-6 h-6 mb-1" />
            <span className="text-xs">Onsite</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
