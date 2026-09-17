"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { setConsent, hasValidConsent } from "../utils/cookies";

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setMounted(true);

    const openHandler = () => setShowBanner(true);
    window.addEventListener("gigzz-open-banner", openHandler);

    if (!hasValidConsent()) {
      const t = setTimeout(() => setShowBanner(true), 400);
      return () => {
        clearTimeout(t);
        window.removeEventListener("gigzz-open-banner", openHandler);
      };
    }

    return () => {
      window.removeEventListener("gigzz-open-banner", openHandler);
    };
  }, []);

  const handleAcceptAll = () => {
    setConsent("all");
    setShowBanner(false);
  };

  const handleNecessaryOnly = () => {
    setConsent("necessary");
    setShowBanner(false);
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 240 }}
          className="
            fixed z-[9999]
            left-3 right-3 bottom-24
            sm:left-6 sm:right-6 sm:bottom-6
            md:left-auto md:right-6 md:max-w-md
            rounded-2xl
            bg-gray-900/95 backdrop-blur-md
            text-white
            shadow-2xl ring-1 ring-white/10
            p-4 sm:p-5
          "
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2 rounded-xl bg-orange-400/15 border border-orange-400/20">
              <Cookie className="w-4 h-4 text-orange-400" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] sm:text-sm text-gray-200 leading-relaxed">
                We use cookies to keep you logged in and improve Gigzz. You can
                accept all or only the essential ones.{" "}
                <a
                  href="/cookie"
                  className="underline text-orange-400 hover:text-orange-300"
                >
                  Learn more
                </a>
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleNecessaryOnly}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-sm font-medium transition-colors"
                >
                  Necessary only
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 px-4 py-2 rounded-xl bg-orange-400 hover:bg-orange-500 text-white text-xs sm:text-sm font-semibold transition-colors"
                >
                  Accept all
                </button>
              </div>
            </div>

            <button
              onClick={handleNecessaryOnly}
              className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}