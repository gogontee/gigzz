import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = Cookies.get("gigzz_cookie_consent");
    if (!consent) setShowBanner(true);
  }, []);

  const handleAcceptAll = () => {
    Cookies.set("gigzz_cookie_consent", "all", { expires: 180 });
    setShowBanner(false);
  };

  const handleNecessaryOnly = () => {
    Cookies.set("gigzz_cookie_consent", "necessary", { expires: 180 });
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      className="
        fixed 
        left-0 right-0 
        bg-gray-900 text-white 
        p-4 sm:p-5 
        z-[9999] shadow-2xl
        rounded-t-2xl sm:rounded-none
        bottom-20 sm:bottom-0 
        mx-2 sm:mx-0
        transition-all duration-300
      "
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-xs sm:text-sm text-gray-200 text-center sm:text-left">
          Gigzz uses cookies to enhance your experience. You can choose to accept all
          or only essential cookies.{" "}
          <a href="/cookie" className="underline text-orange-400">
            Learn more
          </a>
        </p>

        <div className="flex gap-2 justify-center sm:justify-end w-full sm:w-auto">
          <button
            onClick={handleNecessaryOnly}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs sm:text-sm"
          >
            Necessary Only
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-xs sm:text-sm font-medium"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
