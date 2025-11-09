// components/DesktopHeader.js
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../utils/supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import { Briefcase, LogOut, LogIn, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DesktopHeader() {
  const router = useRouter();
  const user = useUser();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [role, setRole] = useState(null);
  const [navDropdownOpen, setNavDropdownOpen] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);


  // Fetch user's avatar and role
  const fetchProfile = async (userId) => {
    try {
      if (!userId) return setAvatarUrl(null) || setRole(null);

      const { data: employerProfile } = await supabase
        .from("employers")
        .select("avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (employerProfile) {
        setAvatarUrl(employerProfile.avatar_url || null);
        setRole("employer");
        return;
      }

      const { data: applicantProfile } = await supabase
        .from("applicants")
        .select("avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (applicantProfile) {
        setAvatarUrl(applicantProfile.avatar_url || null);
        setRole("applicant");
        return;
      }

      setAvatarUrl(null);
      setRole(user?.user_metadata?.role || null);
    } catch (err) {
      console.error("Profile fetch error:", err);
      setAvatarUrl(null);
      setRole(null);
    }
  };

  useEffect(() => {
    if (user?.id) fetchProfile(user.id);
  }, [user]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setAvatarUrl(null);
      setRole(null);
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const isActive = (path) => router.pathname === path;

  return (
    <header className="fixed top-0 left-0 w-full bg-black/90 backdrop-blur-md text-white z-50 transition">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <img
            src="https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars//gigzzwhite.png"
            alt="Gigzz"
            className="h-8 w-auto"
          />
        </Link>

        {/* Center nav */}
        <nav className="flex-1 flex justify-center gap-6 items-center">
          <Link
            href="/"
            className={`transition ${isActive("/") ? "text-orange-500" : ""}`}
          >
            Home
          </Link>

          {/* Find Jobs Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setNavDropdownOpen("find")}
            onMouseLeave={() => setNavDropdownOpen(null)}
          >
            <button className="transition hover:text-orange-500 flex items-center gap-1">
              Find Jobs
              <svg
                className="w-4 h-4 mt-0.5 text-white transition"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <AnimatePresence>
              {navDropdownOpen === "find" && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-10 bg-white text-black rounded shadow p-3 space-y-2 min-w-[160px] z-50"
                >
                  <Link
                    href="/remote"
                    className="block hover:text-orange-500 transition"
                  >
                    Remote Jobs
                  </Link>
                  <Link
                    href="/hybrid"
                    className="block hover:text-orange-500 transition"
                  >
                    Hybrid Jobs
                  </Link>
                  <Link
                    href="/onsite"
                    className="block hover:text-orange-500 transition"
                  >
                    Onsite Jobs
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/employerlanding"
            className="transition hover:text-orange-500"
          >
            Post Your Job
          </Link>

          {/* ✅ Gigzzstars direct link */}
          <Link
            href="/gigzzstar"
            className={`transition hover:text-orange-500 ${
              isActive("/gigzzstar") ? "text-orange-500" : ""
            }`}
          >
            Sportlight
          </Link>

          <Link
            href="/news"
            className={`transition hover:text-orange-500 ${
              isActive("/news") ? "text-orange-500" : ""
            }`}
          >
            News
          </Link>
          <Link
            href="/pricing"
            className={`transition hover:text-orange-500 ${
              isActive("/pricing") ? "text-orange-500" : ""
            }`}
          >
            Pricing
          </Link>
          <Link
            href="/about"
            className={`transition hover:text-orange-500 ${
              isActive("/about") ? "text-orange-500" : ""
            }`}
          >
            Why Gigzz
          </Link>
          <Link
            href="/faq"
            className={`transition hover:text-orange-500 ${
              isActive("/faq") ? "text-orange-500" : ""
            }`}
          >
            FAQ
          </Link>
          <Link
            href="/contact"
            className={`transition hover:text-orange-500 ${
              isActive("/contact") ? "text-orange-500" : ""
            }`}
          >
            Contact
          </Link>
        </nav>

        {/* Auth Section */}
        <div className="flex items-center gap-3">
          {user ? (
            <div
              className="relative"
              onMouseEnter={() => setUserDropdownOpen(true)}
              onMouseLeave={() => setUserDropdownOpen(false)}
            >
              <button className="hover:text-orange-500 transition flex items-center gap-2 px-3 py-1.5 rounded-full border border-white bg-white/5">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
                <span className="hidden sm:inline text-sm">
                  {user.email?.split("@")[0]}
                </span>
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 bg-white text-black rounded shadow-lg w-44 p-2 z-50"
                  >
                    <Link
                      href={
                        role === "employer"
                          ? "/dashboard/employer"
                          : "/dashboard/applicant"
                      }
                      className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 transition"
                    >
                      <Briefcase className="w-4 h-4" /> Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 w-full text-left rounded hover:bg-gray-100 transition"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="bg-black border border-white px-4 py-1.5 rounded-full hover:ring-2 hover:ring-orange-500 hover:text-orange-500 transition flex items-center gap-1"
            >
              <LogIn className="w-4 h-4" /> Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
