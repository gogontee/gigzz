// pages/more.js
import Link from "next/link";
import MobileHeader from "../components/MobileHeader";
import { Briefcase, Globe, Users, Building2 } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-white text-black">
      {/* ✅ Always show MobileHeader */}
      <div className="block">
        <MobileHeader />
      </div>

      <div className="px-6 py-8 space-y-4 pt-4 md:pt-20">
        {/* ✅ Gigzzstars - Only visible to employers */}
        {role === "employer" && (
          <Link
            href="/gigzzstar"
            className="block py-3 px-4 rounded-lg bg-zinc-50 shadow text-black hover:bg-orange-400 hover:text-white transition"
          >
            Gigzzstars
          </Link>
        )}

        {/* ✅ How To - Visible to everyone */}
        <Link
          href="/learnmore"
          className="block py-3 px-4 rounded-lg bg-zinc-50 shadow text-black hover:bg-orange-400 hover:text-white transition"
        >
          How To
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