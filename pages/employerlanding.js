import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import {
  Briefcase,
  BookOpen,
  Users,
  MessageCircle,
  ClipboardList,
  ArrowRight,
  HelpCircle,
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
    href: "#",
  },
];

export default function EmployerLanding() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header only on small screens */}
      <div className="block md:hidden">
        <MobileHeader />
      </div>

      {/* Main Title Section */}
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

        <Link
          href={user ? "/createjob" : "/auth/signup"}
          className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-orange-500 transition ring-2 ring-transparent hover:ring-orange-500"
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </Link>
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
            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 group"
          >
            <div className="flex items-center gap-3 text-black mb-2">
              <div className="p-2 bg-gray-100 rounded-full">
                {tab.icon}
              </div>
              <h3 className="text-lg font-semibold group-hover:text-orange-500">
                {tab.title}
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">{tab.description}</p>
            <Link
              href={tab.href}
              className="text-sm text-orange-500 hover:text-black font-medium"
            >
              Learn more →
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Category Tabs */}
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

      {/* Footer only on desktop */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
