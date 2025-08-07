import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import {
  Briefcase,
  BookOpen,
  Users,
  MessageCircle,
  ClipboardList,
  ArrowRight,
  HelpCircle,
  X,
} from "lucide-react";

import MobileHeader from "../components/MobileHeader";
import Footer from "../components/Footer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const tabs = [
  {
    title: "Post a job & hire a pro",
    description: "Find top talent and start building today.",
    icon: <Briefcase className="w-5 h-5 text-black" />,
    href: "#",
  },
  {
    title: "Browse Projects",
    description: "Get custom projects delivered by pros.",
    icon: <ClipboardList className="w-5 h-5 text-black" />,
    href: "#",
  },
  {
    title: "Consult an Expert",
    description: "Book time with experienced professionals.",
    icon: <MessageCircle className="w-5 h-5 text-black" />,
    href: "#",
  },
  {
    title: "How it works",
    description: "Learn how Gigzz makes hiring simple.",
    icon: <BookOpen className="w-5 h-5 text-black" />,
    href: "#",
  },
  {
    title: "Manage Your Team",
    description: "Collaborate, pay, and grow with ease.",
    icon: <Users className="w-5 h-5 text-black" />,
    href: "#",
  },
  {
    title: "FAQs",
    description: "Find answers to the most common questions.",
    icon: <HelpCircle className="w-5 h-5 text-black" />,
    href: "/faq",
  },
];

export default function EmployerLanding() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [modalMessage, setModalMessage] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: sessionData } = await supabase.auth.getUser();
      const currentUser = sessionData?.user;

      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", currentUser.id)
          .single();

        if (profile?.role) {
          setRole(profile.role);
        }
      }
    };

    fetchUser();
  }, []);

  const handleGetStarted = () => {
    if (user && role === "employer") {
      router.push("/dashboard/employer");
    } else {
      setModalMessage(
        "Please sign up or log in as a client to post jobs for free."
      );
    }
  };

  const handleTabClick = (href) => {
    if (href === "/faq") {
      router.push(href);
    } else {
      setModalMessage("We're still working on this feature.");
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Mobile Header */}
      <div className="block md:hidden">
        <MobileHeader />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pt-10 md:pt-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-gray-800 mb-4"
        >
          Welcome to Gigzz Hiring Hub
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 text-lg mb-8"
        >
          Connect with elite freelancers and industry experts. Whether you’re
          starting a project or scaling a team, Gigzz has the talent for you.
        </motion.p>

        <button
          onClick={handleGetStarted}
          className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-orange-500 transition ring-2 ring-transparent hover:ring-orange-500"
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Feature Tabs */}
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24 mt-12">
        {tabs.map((tab, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.03 }}
            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 group cursor-pointer"
            onClick={() => handleTabClick(tab.href)}
          >
            <div className="flex items-center gap-3 text-black mb-2">
              <div className="p-2 bg-gray-100 rounded-full">{tab.icon}</div>
              <h3 className="text-lg font-semibold group-hover:text-orange-500">
                {tab.title}
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">{tab.description}</p>
            <span className="text-sm text-orange-500 hover:text-black font-medium">
              {tab.href === "/faq" ? "Go to FAQ →" : "Learn more →"}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Category Tags */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex flex-wrap justify-center gap-3">
          {[
            "Development & IT",
            "Design & Creative",
            "Sales & Marketing",
            "Writing & Translation",
            "Admin & Customer Support",
            "Finance & Accounting",
            "HR & Training",
            "Legal",
            "Engineering & Architecture",
            "Hire freelancers",
          ].map((label, index) => (
            <button
              key={index}
              className="px-5 py-2 rounded-full bg-white text-black shadow hover:bg-orange-500 hover:text-white transition text-sm whitespace-nowrap"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Footer (Desktop Only) */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg relative"
            >
              <button
                className="absolute top-3 right-3 text-gray-600 hover:text-black"
                onClick={() => setModalMessage(null)}
              >
                <X size={20} />
              </button>
              <h2 className="text-lg font-bold mb-2 text-orange-600">Notice</h2>
              <p className="text-gray-700 text-sm">{modalMessage}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
