"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaCookieBite, FaShieldAlt, FaChartBar, FaAd, FaChevronLeft } from "react-icons/fa";
import MobileHeader from "../components/MobileHeader";

export default function CookieSettings() {
  const [consent, setConsent] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [bottomOffset, setBottomOffset] = useState("6rem");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const bottomTab = document.querySelector(".bottom-tab");
    if (bottomTab) {
      const tabHeight = bottomTab.offsetHeight;
      setBottomOffset(`${tabHeight + 40}px`);
    }
  }, []);

  useEffect(() => {
    setConsent(Cookies.get("gigzz_cookie_consent") || "none");
  }, []);

  const handleChange = (type) => {
    Cookies.set("gigzz_cookie_consent", type, { expires: 180 });
    setConsent(type);
  };

  const cookieTypes = [
    {
      id: "necessary",
      title: "Strictly Necessary Cookies",
      icon: <FaShieldAlt className="text-blue-600" />,
      description: "Required for the website to function properly",
      examples: ["Authentication", "Security", "Session management"],
      alwaysActive: true
    },
    {
      id: "performance",
      title: "Performance Cookies",
      icon: <FaChartBar className="text-green-600" />,
      description: "Help us understand how visitors interact with our website",
      examples: ["Page load times", "Error tracking", "User interactions"]
    },
    {
      id: "marketing",
      title: "Marketing Cookies",
      icon: <FaAd className="text-purple-600" />,
      description: "Used to deliver relevant ads and track campaign performance",
      examples: ["Ad personalization", "Campaign analytics", "Social media integration"]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader
          title="Cookie Settings"
          showBackButton={true}
          backUrl="/settings"
          className="bg-white border-b border-gray-200"
        />
      )}
      
      <div 
        className={`transition-all duration-300 ${
          isMobile ? 'pt-4' : 'py-8'
        } px-4`}
        style={{
          paddingBottom: `calc(env(safe-area-inset-bottom) + ${bottomOffset})`,
        }}
      >
        <div className="max-w-2xl mx-auto">
          {/* Desktop Header - Only show on non-mobile */}
          {!isMobile && (
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <FaCookieBite className="text-2xl text-orange-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Cookie Preferences
              </h1>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                Control how we use cookies to enhance your Gigzz experience
              </p>
            </div>
          )}

          {/* Mobile Header Alternative */}
          {isMobile && (
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-orange-100 rounded-full">
                  <FaCookieBite className="text-xl text-orange-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Cookie Preferences
              </h1>
              <p className="text-gray-600">
                Control your cookie settings
              </p>
            </div>
          )}

          {/* Current Selection Banner */}
          {consent && consent !== "none" && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-blue-900 text-sm">
                    Current setting: <span className="capitalize">{consent}</span>
                  </p>
                  <p className="text-blue-700 text-xs mt-1">
                    {consent === "necessary" 
                      ? "Only essential cookies are enabled" 
                      : "All cookies are enabled"
                    }
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap ml-4"
                >
                  Learn More
                </button>
              </div>
            </motion.div>
          )}

          {/* Quick Action Buttons - Moved up for better mobile UX */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
            <h2 className={`font-bold text-gray-900 mb-4 ${isMobile ? 'text-lg text-center' : 'text-xl text-center'}`}>
              Quick Settings
            </h2>
            <p className="text-gray-600 text-center mb-5 text-sm">
              Choose your preferred cookie setting with one click
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleChange("necessary")}
                className={`w-full px-4 py-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ${
                  consent === "necessary"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-25"
                }`}
              >
                <div className="text-left flex-1">
                  <div className="font-semibold text-base">Only Necessary</div>
                  <div className="text-sm opacity-75 mt-1">Essential functionality only</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 ${
                  consent === "necessary" 
                    ? "border-blue-500 bg-blue-500" 
                    : "border-gray-300 group-hover:border-blue-400"
                }`}>
                  {consent === "necessary" && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleChange("all")}
                className={`w-full px-4 py-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ${
                  consent === "all"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-green-300 hover:bg-green-25"
                }`}
              >
                <div className="text-left flex-1">
                  <div className="font-semibold text-base">Allow All Cookies</div>
                  <div className="text-sm opacity-75 mt-1">Best experience + analytics</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 ${
                  consent === "all" 
                    ? "border-green-500 bg-green-500" 
                    : "border-gray-300 group-hover:border-green-400"
                }`}>
                  {consent === "all" && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </button>
            </div>

            <p className="text-center text-gray-500 text-xs mt-5">
              You can change these settings anytime.{" "}
              <button 
                onClick={() => setShowModal(true)}
                className="text-orange-500 hover:underline font-medium"
              >
                Learn more
              </button>
            </p>
          </div>

          {/* Cookie Types Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h2 className={`font-bold text-gray-900 mb-5 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Understanding Cookie Types
            </h2>
            
            <div className="space-y-5">
              {cookieTypes.map((cookie, index) => (
                <div key={cookie.id} className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {cookie.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2 flex-col sm:flex-row sm:items-center">
                      <h3 className="font-semibold text-gray-900 text-sm">{cookie.title}</h3>
                      {cookie.alwaysActive && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                          Always active
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{cookie.description}</p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Examples include:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {cookie.examples.map((example, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></div>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Learn More Button */}
            <div className="mt-6 pt-5 border-t border-gray-200">
              <button
                onClick={() => setShowModal(true)}
                className="w-full py-3 px-4 bg-orange-50 text-orange-700 rounded-lg font-medium hover:bg-orange-100 transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
              >
                Learn more about how we use cookies
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl w-full shadow-2xl max-h-[90vh] flex flex-col mx-auto max-w-2xl"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FaChevronLeft size={16} className="text-gray-500" />
                    </button>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Cookie Policy
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      How Gigzz uses cookies
                    </p>
                  </div>
                </div>
                {!isMobile && (
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FaTimes size={20} className="text-gray-500" />
                  </button>
                )}
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-blue-800 text-xs">
                      <strong>Note:</strong> Necessary cookies are always enabled as they are required 
                      for basic functionality like login, security, and payments.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      🍪 What Are Cookies?
                    </h3>
                    <p className="text-gray-700 text-sm">
                      Cookies are small text files stored on your device that help websites remember 
                      your preferences, improve performance, and tailor content to your interests. 
                      They make your browsing experience smoother, faster, and more secure.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                      🔍 Detailed Cookie Breakdown
                    </h3>
                    
                    <div className="space-y-3">
                      {cookieTypes.map((cookie) => (
                        <div key={cookie.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            {cookie.icon}
                            <h4 className="font-semibold text-gray-900 text-sm">{cookie.title}</h4>
                            {cookie.alwaysActive && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                Always active
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-xs mb-2">{cookie.description}</p>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-xs font-medium text-gray-700 mb-1">Typical uses:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {cookie.examples.map((example, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></div>
                                  <span className="text-xs">{example}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      🔒 Your Privacy Matters
                    </h3>
                    <p className="text-gray-700 text-sm">
                      At Gigzz, we take your privacy seriously. We never sell or share your 
                      personal data with third parties for profit. All cookie data is encrypted 
                      and stored securely following industry best practices.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      ⚙️ Managing Your Preferences
                    </h3>
                    <p className="text-gray-700 text-sm">
                      You can switch between "Necessary Only" and "Allow All" cookie settings 
                      at any time from the Cookie Preferences page. Your choice will be 
                      remembered for 180 days, after which we'll ask for your preferences again.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-700 text-xs">
                      For complete details about how we handle your data, please read our{" "}
                      <a
                        href="/policy"
                        className="text-orange-500 font-medium hover:underline"
                      >
                        Privacy Policy
                      </a>{" "}
                      and{" "}
                      <a
                        href="/terms"
                        className="text-orange-500 font-medium hover:underline"
                      >
                        Terms of Service
                      </a>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex-1 px-4 py-3 bg-orange-500 text-white hover:bg-orange-600 rounded-lg font-medium transition-colors text-sm"
                  >
                    Adjust Settings
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