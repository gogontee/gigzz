import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";
import { Briefcase, LogOut, LogIn, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DesktopHeader() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [onsiteModal, setOnsiteModal] = useState(false);

  useEffect(() => {
    const fetchUserAndAvatar = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user;

      if (!currentUser) return;

      setUser(currentUser);

      const role = currentUser.user_metadata?.role || "applicant";
      const table = role === "employer" ? "employers" : "applicants";

      const { data: profile } = await supabase
        .from(table)
        .select("avatar_url")
        .eq("id", currentUser.id)
        .single();

      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      }
    };

    fetchUserAndAvatar();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.reload();
  };

  const isActive = (path) => router.pathname === path;

  return (
    <header className="fixed top-0 left-0 w-full bg-black backdrop-blur-md text-white shadow z-50 transition duration-300">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <img
          src="https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars//gigzzwhite.png"
          alt="Gigzz Logo"
          className="h-8 w-auto"
        />

        {/* Navigation */}
<nav className="flex-1 flex justify-center gap-6 items-center relative">
  <Link href="/" className={`transition hover:text-orange-500 ${isActive("/") ? "text-orange-500" : ""}`}>
    Home
  </Link>

  {/* Find Jobs Dropdown */}
  <div
    className="relative"
    onMouseEnter={() => setNavDropdownOpen('find')}
    onMouseLeave={() => setNavDropdownOpen(null)}
  >
    <button className="transition hover:text-orange-500 flex items-center gap-1">
      Find Jobs
      <svg className="w-4 h-4 mt-0.5 text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <AnimatePresence>
      {navDropdownOpen === 'find' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-10 bg-white text-black rounded shadow p-3 space-y-2 min-w-[160px] z-50"
        >
          <Link href="/remote" className="block hover:text-orange-500 transition">
            Remote Jobs
          </Link>
          <Link href="/hybrid" className="block hover:text-orange-500 transition">
            Hybrid Jobs
          </Link>
          <Link href="/onsite" className="block hover:text-orange-500 transition">
            Onsite Jobs
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  </div>

  {/* Other links */}
  <Link href="/employerlanding" className="transition hover:text-orange-500">
    Post Your Job
  </Link>

  {/* Gigzzstars dropdown inserted here */}
  <div
    className="relative"
    onMouseEnter={() => setNavDropdownOpen('gigzzstars')}
    onMouseLeave={() => setNavDropdownOpen(null)}
  >
    <button className="transition hover:text-orange-500 flex items-center gap-1">
      Gigzzstars
      <svg className="w-4 h-4 mt-0.5 text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <AnimatePresence>
  {navDropdownOpen === 'gigzzstars' && (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="absolute top-10 left-0 bg-white/95 backdrop-blur-md text-black rounded-xl shadow-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-[220px] z-50"
    >
      <Link href="/gigzzstars/design-creative" className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ease-in-out  hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-95"
>
        Design &amp; Creative
      </Link>
      <Link href="/gigzzstars/development-it" className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ease-in-out  hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-95"
>
        Development &amp; IT
      </Link>
      <Link href="/gigzzstars/marketing-sales" className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ease-in-out hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-95"
>
        Marketing &amp; Sales
      </Link>
      <Link href="/gigzzstars/writing-translation" className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ease-in-out  hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-95"
>
        Writing &amp; Translation
      </Link>
      <Link href="/gigzzstars/customer-support" className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ease-in-out hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-95"
>
        Customer Support
      </Link>
      <Link href="/gigzzstars/finance-accounting" className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ease-in-out  hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-95"
>
        Finance &amp; Accounting
      </Link>
      <Link href="/gigzzstars/legal-services" className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ease-in-out  hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-95"
>
        Legal Services
      </Link>
      <Link href="/gigzzstars/engineering-industry" className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ease-in-out  hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-95"
>
        Engineering
      </Link>
      <Link href="/gigzzstars/entertainment" className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ease-in-out  hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-95"
>
        Entertainment
      </Link>
    </motion.div>
  )}
</AnimatePresence>
  </div>

  <Link href="/news" className={`transition hover:text-orange-500 ${isActive("/news") ? "text-orange-500" : ""}`}>
    News
  </Link>
  <Link href="/pricing" className={`transition hover:text-orange-500 ${isActive("/pricing") ? "text-orange-500" : ""}`}>
    Pricing
  </Link>
  <Link href="/about" className={`transition hover:text-orange-500 ${isActive("/about") ? "text-orange-500" : ""}`}>
    Why Gigzz
  </Link>
  <Link href="/faq" className={`transition hover:text-orange-500 ${isActive("/faq") ? "text-orange-500" : ""}`}>
    FAQ
  </Link>
  <Link href="/contact" className={`transition hover:text-orange-500 ${isActive("/contact") ? "text-orange-500" : ""}`}>
    Contact
  </Link>
</nav>



        {/* Auth Section */}
        {user ? (
          <div
            className="relative"
            onMouseEnter={() => setUserDropdownOpen(true)}
            onMouseLeave={() => setUserDropdownOpen(false)}
          >
            <button className="hover:text-orange-500 transition flex items-center gap-2 px-4 py-1.5 rounded-full border border-white">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
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
                    href={user.user_metadata?.role === "employer" ? "/dashboard/employer" : "/dashboard/applicant"}
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
            href="/auth/signup"
            className="bg-black border border-white px-4 py-1.5 rounded-full hover:ring-2 hover:ring-orange-500 hover:text-orange-500 transition flex items-center gap-1"
          >
            <LogIn className="w-4 h-4" /> Sign Up
          </Link>
        )}
      </div>

      {/* Onsite Modal */}
      {onsiteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-xl shadow p-6 w-full max-w-md text-center space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Onsite Jobs</h2>
            <p className="text-gray-600">Onsite jobs will be available soon. Stay tuned!</p>
            <button
              onClick={() => setOnsiteModal(false)}
              className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-orange-500 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
