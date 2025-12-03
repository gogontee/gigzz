// pages/more.js
import Link from "next/link";
import MobileHeader from "../components/MobileHeader";
import { 
  Briefcase, 
  Globe, 
  Users, 
  Building2, 
  FileText, 
  Shield, 
  Star,
  BookOpen,
  Newspaper,
  CreditCard,
  HelpCircle,
  Info,
  Mail
} from "lucide-react";
import { useEffect, useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "../utils/supabaseClient";

export default function MorePage() {
  const user = useUser();
  const [role, setRole] = useState(null);

  // Fetch user's role
  const fetchProfile = async (userId) => {
    try {
      if (!userId) return setRole(null);

      const { data: employerProfile } = await supabase
        .from("employers")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (employerProfile) {
        setRole("employer");
        return;
      }

      const { data: applicantProfile } = await supabase
        .from("applicants")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (applicantProfile) {
        setRole("applicant");
        return;
      }

      setRole(user?.user_metadata?.role || null);
    } catch (err) {
      console.error("Profile fetch error:", err);
      setRole(null);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    } else {
      setRole(null);
    }
  }, [user]);

  // Featured section for employers only
  const featuredSection = role === "employer" ? [{
    href: "/gigzzstar",
    icon: <Star className="w-5 h-5" />,
    label: "Gigzzstars",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50"
  }] : [];

  // Main sections in grid (3 columns on desktop, 2 on mobile)
  const mainSections = [
    {
      href: "/learnmore",
      icon: <BookOpen className="w-5 h-5" />,
      label: "How To",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      href: "/news",
      icon: <Newspaper className="w-5 h-5" />,
      label: "News",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      href: "/pricing",
      icon: <CreditCard className="w-5 h-5" />,
      label: "Pricing",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      href: "/about",
      icon: <Info className="w-5 h-5" />,
      label: "Why Gigzz",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      href: "/faq",
      icon: <HelpCircle className="w-5 h-5" />,
      label: "FAQ",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    {
      href: "/contact",
      icon: <Mail className="w-5 h-5" />,
      label: "Contact",
      color: "text-pink-600",
      bgColor: "bg-pink-50"
    },
  ];

  // Legal sections (2 columns on all screen sizes)
  const legalSections = [
    {
      href: "/terms",
      icon: <FileText className="w-5 h-5" />,
      label: "Terms of Service",
      color: "text-gray-700",
      bgColor: "bg-gray-50"
    },
    {
      href: "/policy",
      icon: <Shield className="w-5 h-5" />,
      label: "Privacy Policy",
      color: "text-gray-700",
      bgColor: "bg-gray-50"
    },
  ];

  // Quick links (preserved as is)
  const quickLinks = [
    { href: "/job/alljobs", icon: <Briefcase className="w-5 h-5" />, label: "All Jobs" },
    { href: "/remote", icon: <Globe className="w-5 h-5" />, label: "Remote" },
    { href: "/hybrid", icon: <Users className="w-5 h-5" />, label: "Hybrid" },
    { href: "/onsite", icon: <Building2 className="w-5 h-5" />, label: "Onsite" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* ✅ Always show MobileHeader */}
      <div className="block">
        <MobileHeader />
      </div>

      <div className="px-4 py-6 pt-4 md:pt-20">
        {/* Header */}
        <div className="px-2 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">More</h1>
          <p className="text-gray-500 text-sm mt-1">Settings, support, and legal information</p>
        </div>

        {/* Featured Section (for employers only) */}
        {featuredSection.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 px-2 mb-3">Featured</h2>
            {featuredSection.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between py-3 px-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.bgColor}`}>
                    <div className={item.color}>{item.icon}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">{item.label}</span>
                  </div>
                </div>
                <div className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors">
                  →
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Main Sections Grid (3 columns desktop, 2 columns mobile) */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 px-2 mb-3">Resources</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {mainSections.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <div className={`p-3 rounded-lg ${item.bgColor} mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <div className={`${item.color}`}>{item.icon}</div>
                </div>
                <span className="text-xs font-medium text-gray-700 text-center group-hover:text-orange-600 transition-colors">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links Grid (Preserved as is) */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 px-2 mb-3">Quick Links</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center py-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <div className="p-2 rounded-full bg-gray-100 group-hover:bg-orange-100 transition-colors mb-2">
                  <div className="text-gray-600 group-hover:text-orange-600 transition-colors">
                    {link.icon}
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-700 group-hover:text-orange-600 transition-colors">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Legal Sections Grid (2 columns on all screen sizes) */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 px-2 mb-3">Legal</h2>
          <div className="grid grid-cols-2 gap-3">
            {legalSections.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <div className={`p-3 rounded-lg ${item.bgColor} mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <div className={`${item.color}`}>{item.icon}</div>
                </div>
                <span className="text-xs font-medium text-gray-700 text-center group-hover:text-orange-600 transition-colors">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* App Version Info */}
        <div className="text-center px-4 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Gigzz App v1.0.0
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            © 2025 Gigzz Africa. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}