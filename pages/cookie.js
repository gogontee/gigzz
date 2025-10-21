"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

export default function CookieSettings() {
  const [consent, setConsent] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setConsent(Cookies.get("gigzz_cookie_consent") || "none");
  }, []);

  const handleChange = (type) => {
    Cookies.set("gigzz_cookie_consent", type, { expires: 180 });
    setConsent(type);
  };

  return (
    <div
      className="
        max-w-lg mx-auto 
        py-16 sm:py-20 
        px-4 
        mb-24 sm:mb-0
      "
    >
      <h1 className="text-2xl font-bold mb-4 text-center sm:text-left">
        Cookie Preferences
      </h1>
      <p className="mb-6 text-center sm:text-left text-gray-700">
        Select your preferred cookie setting below.{" "}
        <button
          onClick={() => setShowModal(true)}
          className="text-orange-500 font-medium hover:underline"
        >
          Learn more
        </button>{" "}
        about how Gigzz uses cookies.
      </p>

      {/* Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => handleChange("necessary")}
          className={`w-full px-4 py-3 rounded-lg text-sm sm:text-base transition-all ${
            consent === "necessary"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Only Necessary Cookies
        </button>
        <button
          onClick={() => handleChange("all")}
          className={`w-full px-4 py-3 rounded-lg text-sm sm:text-base transition-all ${
            consent === "all"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Allow All Cookies
        </button>
      </div>

      {/* Modal Popup */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl max-w-2xl w-full shadow-xl p-6 relative overflow-y-auto max-h-[85vh]"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={18} />
              </button>

              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                Understanding Cookies on Gigzz
              </h2>

              <div className="space-y-4 text-gray-700 text-sm sm:text-base leading-relaxed">
                <p>
                  At <strong>Gigzz</strong>, we use cookies to provide you with a
                  smoother, faster, and more secure experience. Cookies are small
                  text files stored on your device that help us remember your
                  preferences, improve performance, and tailor content to your
                  interests.
                </p>

                <h3 className="font-semibold text-lg mt-4 text-gray-900">
                  🍪 Types of Cookies We Use
                </h3>
                <ul className="list-disc ml-6 space-y-2">
                  <li>
                    <strong>Necessary Cookies:</strong> Required for the website
                    to function properly — e.g., authentication, security, and
                    accessibility features.
                  </li>
                  <li>
                    <strong>Performance Cookies:</strong> Collect information
                    about how users interact with Gigzz, allowing us to improve
                    load times and usability.
                  </li>
                  <li>
                    <strong>Analytics Cookies:</strong> Help us understand user
                    behavior using privacy-compliant analytics tools to enhance
                    platform efficiency.
                  </li>
                  <li>
                    <strong>Marketing Cookies:</strong> Used (if consented) to
                    deliver relevant job ads or promotions based on your activity
                    and preferences.
                  </li>
                </ul>

                <h3 className="font-semibold text-lg mt-6 text-gray-900">
                  🔒 How We Protect Your Privacy
                </h3>
                <p>
                  Gigzz never sells or shares your personal data with third
                  parties for profit. All cookie data is encrypted and stored
                  securely, and you can withdraw your consent or modify your
                  settings anytime from this page.
                </p>

                <h3 className="font-semibold text-lg mt-6 text-gray-900">
                  ⚙️ Managing Your Cookie Preferences
                </h3>
                <p>
                  You can switch between “Necessary Only” and “Allow All” cookie
                  settings at any time. Necessary cookies are always enabled
                  because they are required for basic functionality such as
                  logging in, saving preferences, and processing secure
                  payments.
                </p>

                <p className="mt-6">
                  For more information, please review our{" "}
                  <a
                    href="/policy"
                    className="text-orange-500 font-medium hover:underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
