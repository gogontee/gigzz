import Cookies from "js-cookie";
import { useState, useEffect } from "react";

export default function CookieSettings() {
  const [consent, setConsent] = useState("");

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
      <p className="mb-6 text-center sm:text-left">
        Select your preferred cookie setting below:
      </p>

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
    </div>
  );
}
