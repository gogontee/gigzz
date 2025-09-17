// pages/more.js
import Link from "next/link";
import MobileHeader from "../components/MobileHeader";
import { Briefcase, Globe, Users, Building2 } from "lucide-react";

export default function MorePage() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* ✅ Always show MobileHeader */}
      <div className="block">
        <MobileHeader />
      </div>

      <div className="px-6 py-8 space-y-4 pt-4 md:pt-20">
        {/* ✅ Gigzzstars now direct link */}
        <Link
          href="/gigzzstar"
          className="block py-3 px-4 rounded-lg bg-zinc-50 shadow text-black hover:bg-orange-400 hover:text-white transition"
        >
          Gigzzstars
        </Link>

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
          <Link
            href="/job/alljobs"
            className="flex flex-col items-center text-black hover:text-orange-400"
          >
            <Briefcase className="w-6 h-6 mb-1" />
            <span className="text-xs">All Jobs</span>
          </Link>
          <Link
            href="/remote"
            className="flex flex-col items-center text-black hover:text-orange-400"
          >
            <Globe className="w-6 h-6 mb-1" />
            <span className="text-xs">Remote</span>
          </Link>
          <Link
            href="/hybrid"
            className="flex flex-col items-center text-black hover:text-orange-400"
          >
            <Users className="w-6 h-6 mb-1" />
            <span className="text-xs">Hybrid</span>
          </Link>
          <Link
            href="/onsite"
            className="flex flex-col items-center text-black hover:text-orange-400"
          >
            <Building2 className="w-6 h-6 mb-1" />
            <span className="text-xs">Onsite</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
