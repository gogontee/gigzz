import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import {
  Briefcase,
  BookOpen,
  ClipboardList,
  ArrowRight,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import MobileHeader from "../components/MobileHeader";
import Footer from "../components/Footer";

const supabase = createPagesBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const tabs = [
  {
    title: "Post a job & hire a pro",
    description: "Find top talent and start building today.",
    icon: <Briefcase className="w-5 h-5 text-black" />,
    href: "/job/post",
    modalContent: {
      title: "Post a Job & Hire Professionals",
      content: `Do you need support for a project, role, or ongoing task — online or offline? Whether you're looking for a creative, a technical expert, an administrative assistant, a marketer, a developer, a designer, a consultant, a skilled worker, or a full team for your business — MyGigzz is your go-to talent hub.

From freelance gigs to contract roles, part-time, full-time, onsite, remote, and hybrid positions, you can post any legitimate job and get connected with skilled, ready-to-work creatives and professionals.

Create a detailed job post, set your requirements, and start receiving applications from qualified candidates. Review portfolios, compare proposals, and hire with confidence.

Post your job on MyGigzz today — and turn your ideas into reality.`
    }
  },
  {
    title: "Browse Portfolio",
    description: "View portfolios of top creatives.",
    icon: <ClipboardList className="w-5 h-5 text-black" />,
    href: "/portfolio",
    modalContent: {
      title: "Why Browse Portfolios?",
      content: "Browsing through applicant portfolios helps you make informed hiring decisions. You can assess the quality of previous work, see if their style matches your vision, and evaluate their experience with similar projects. This ensures you hire the right creative professional for your specific needs."
    }
  },
  {
    title: "How it works",
    description: "Learn how Gigzz makes hiring simple.",
    icon: <BookOpen className="w-5 h-5 text-black" />,
    href: "/learnmore",
    modalContent: {
      title: "How Gigzz Works",
      content: `Gigzz is an African-leading talent and creative platform that connects employers with skilled freelancers and job seekers. Post your project or job opening, receive applications from qualified professionals, review their profiles, portfolios, and experience, and connect directly with the best fit for your needs.

Gigzz makes it easy to discover talent for freelance projects, contract roles, part-time or full-time positions — both remote and onsite.`
    }
  },
];

export default function EmployerLanding() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [modalMessage, setModalMessage] = useState(null);
  const [learnMoreModal, setLearnMoreModal] = useState(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(true);
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

  const handleTabClick = (href, tabTitle) => {
    if (tabTitle === "Post a job & hire a pro") {
      if (!user) {
        setModalMessage("Kindly sign up or log in as client to post jobs.");
      } else if (role === "applicant") {
        setModalMessage("Kindly login as client to post jobs.");
      } else if (role === "employer") {
        router.push(href); // /job/post
      }
    } else if (tabTitle === "Browse Portfolio") {
      // Everyone can access portfolio
      router.push(href); // /portfolio
    } else {
      router.push(href); // /learnmore
    }
  };

  const handleLearnMoreClick = (e, tab) => {
    e.stopPropagation(); // Prevent triggering the parent tab click
    setLearnMoreModal(tab);
    // Reset scroll states when modal opens
    setShowScrollTop(false);
    setShowScrollBottom(true);
  };

  const handleModalScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    // Check if content is scrollable
    setIsScrollable(scrollHeight > clientHeight);
    
    // Show/hide scroll indicators
    setShowScrollTop(scrollTop > 20);
    setShowScrollBottom(scrollTop < scrollHeight - clientHeight - 20);
  };

  const scrollModalContent = (direction) => {
    const contentElement = document.querySelector('.modal-content-scrollable');
    if (contentElement) {
      const scrollAmount = direction === 'down' ? 200 : -200;
      contentElement.scrollBy({ top: scrollAmount, behavior: 'smooth' });
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
          Connect with elite freelancers and industry experts. Whether you're
          starting a project or scaling a team, Gigzz has the talent for you.
        </motion.p>

        <button
          onClick={() => handleTabClick("/job/post", "Post a job & hire a pro")}
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
            onClick={() => handleTabClick(tab.href, tab.title)}
          >
            <div className="flex items-center gap-3 text-black mb-2">
              <div className="p-2 bg-gray-100 rounded-full">{tab.icon}</div>
              <h3 className="text-lg font-semibold group-hover:text-orange-500">
                {tab.title}
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">{tab.description}</p>
            <button
              onClick={(e) => handleLearnMoreClick(e, tab)}
              className="text-sm text-orange-500 hover:text-black font-medium"
            >
              Learn more →
            </button>
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

      {/* Auth Modal */}
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

      {/* Learn More Modal */}
      <AnimatePresence>
        {learnMoreModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={() => setLearnMoreModal(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-white rounded-xl max-w-md w-full shadow-lg relative flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center gap-3 p-6 border-b border-gray-100">
                <div className="p-2 bg-gray-100 rounded-full">
                  {learnMoreModal.icon}
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  {learnMoreModal.modalContent.title}
                </h2>
                <button
                  className="absolute top-4 right-4 text-gray-600 hover:text-black p-1"
                  onClick={() => setLearnMoreModal(null)}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content Container */}
              <div className="relative flex-grow overflow-hidden">
                {/* Top scroll indicator */}
                {showScrollTop && isScrollable && (
                  <div className="absolute top-0 left-0 right-0 z-10 flex justify-center">
                    <div className="bg-gradient-to-b from-white to-transparent pt-2 pb-6">
                      <button
                        onClick={() => scrollModalContent('up')}
                        className="p-1 bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 transition"
                      >
                        <ChevronUp size={20} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Scrollable Content */}
                <div
                  className="modal-content-scrollable p-6 overflow-y-auto max-h-[50vh]"
                  onScroll={handleModalScroll}
                >
                  <div className="text-gray-600 whitespace-pre-line leading-relaxed">
                    {learnMoreModal.modalContent.content}
                  </div>
                </div>

                {/* Bottom scroll indicator */}
                {showScrollBottom && isScrollable && (
                  <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center">
                    <div className="bg-gradient-to-t from-white to-transparent pb-2 pt-6">
                      <button
                        onClick={() => scrollModalContent('down')}
                        className="p-1 bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 transition"
                      >
                        <ChevronDown size={20} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setLearnMoreModal(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setLearnMoreModal(null);
                      handleTabClick(learnMoreModal.href, learnMoreModal.title);
                    }}
                    className="px-5 py-2 bg-black text-white rounded-full hover:bg-orange-500 transition font-medium"
                  >
                    Continue to {learnMoreModal.title.split(' ')[0]}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}