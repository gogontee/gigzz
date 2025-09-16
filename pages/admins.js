"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Lazy imports
const LearnMoreForm = dynamic(() => import("../components/LearnMoreForm"), {
  ssr: false,
});
const NewsForm = dynamic(() => import("../components/NewsForm"), {
  ssr: false,
});

export default function AdminPanel() {
  const router = useRouter();
  const ADMIN_CODE = "55443322";
  const MAX_ATTEMPTS = 5;

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Sidebar dropdown states
  const [openMenu, setOpenMenu] = useState(null);
  const [activeContent, setActiveContent] = useState(null);

  const handleLogin = () => {
    if (code === ADMIN_CODE) {
      setIsLoggedIn(true);
      setError("");
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(`Incorrect code. Attempt ${newAttempts} of ${MAX_ATTEMPTS}.`);
      setCode("");

      if (newAttempts >= MAX_ATTEMPTS) {
        alert("Maximum attempts reached. Redirecting to homepage.");
        router.push("/");
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg"
        >
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Admin Access
          </h1>
          {error && <p className="text-red-500 mb-4">{error}</p>}

          <div className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="Enter 8-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              maxLength={8}
            />
            <button
              onClick={handleLogin}
              className="bg-black text-white px-4 py-2 rounded hover:bg-orange-500 transition"
            >
              Enter
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Admin panel content
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar */}
      <aside className="w-full md:w-1/4 bg-white shadow-md p-6 md:pt-20">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
        <div className="flex flex-col gap-2">
          {/* Manage Learn More Content */}
          <button
            onClick={() =>
              setOpenMenu(openMenu === "learnMore" ? null : "learnMore")
            }
            className="w-full text-left px-4 py-2 rounded hover:bg-orange-500 hover:text-white transition font-semibold"
          >
            Manage Learn More Content
          </button>
          {openMenu === "learnMore" && (
            <div className="flex flex-col ml-4 mt-2 gap-1">
              <button
                onClick={() => setActiveContent("addLearn")}
                className="px-3 py-1 rounded hover:bg-orange-100 transition text-gray-700 text-left"
              >
                Add Content
              </button>
              <button
                onClick={() => setActiveContent("editLearn")}
                className="px-3 py-1 rounded hover:bg-orange-100 transition text-gray-700 text-left"
              >
                Edit Content
              </button>
              <button
                onClick={() => setActiveContent("deleteLearn")}
                className="px-3 py-1 rounded hover:bg-orange-100 transition text-gray-700 text-left"
              >
                Delete Content
              </button>
            </div>
          )}

          {/* Manage News */}
          <button
            onClick={() => setOpenMenu(openMenu === "news" ? null : "news")}
            className="w-full text-left px-4 py-2 rounded hover:bg-orange-500 hover:text-white transition font-semibold"
          >
            Manage News
          </button>
          {openMenu === "news" && (
            <div className="flex flex-col ml-4 mt-2 gap-1">
              <button
                onClick={() => setActiveContent("addNews")}
                className="px-3 py-1 rounded hover:bg-orange-100 transition text-gray-700 text-left"
              >
                Add News
              </button>
              <button
                onClick={() => setActiveContent("editNews")}
                className="px-3 py-1 rounded hover:bg-orange-100 transition text-gray-700 text-left"
              >
                Edit News
              </button>
              <button
                onClick={() => setActiveContent("deleteNews")}
                className="px-3 py-1 rounded hover:bg-orange-100 transition text-gray-700 text-left"
              >
                Delete News
              </button>
            </div>
          )}

          {/* Other sidebar items */}
          <button className="w-full text-left px-4 py-2 rounded hover:bg-orange-500 hover:text-white transition font-semibold">
            View Analytics
          </button>
          <button className="w-full text-left px-4 py-2 rounded hover:bg-orange-500 hover:text-white transition font-semibold">
            Manage Job Listings
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 p-6 md:p-12 md:pt-20 overflow-y-auto">
        {/* Learn More Content */}
        {activeContent === "addLearn" && (
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              Add Learn More Content
            </h2>
            <LearnMoreForm />
          </div>
        )}
        {activeContent === "editLearn" && (
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              Edit Learn More Content
            </h2>
            <p>Here you can select existing content and edit it. (Placeholder)</p>
          </div>
        )}
        {activeContent === "deleteLearn" && (
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              Delete Learn More Content
            </h2>
            <p>Here you can select content to delete. (Placeholder)</p>
          </div>
        )}

        {/* News Content */}
        {activeContent === "addNews" && (
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-semibold mb-4">Add News</h2>
            <NewsForm />
          </div>
        )}
        {activeContent === "editNews" && (
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-semibold mb-4">Edit News</h2>
            <p>Here you can select existing news and edit it. (Placeholder)</p>
          </div>
        )}
        {activeContent === "deleteNews" && (
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-semibold mb-4">Delete News</h2>
            <p>Here you can select news to delete. (Placeholder)</p>
          </div>
        )}

        {/* Default Welcome */}
        {!activeContent && (
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-semibold mb-4">Welcome</h2>
            <p>Select a sidebar option to manage content or view analytics.</p>
          </div>
        )}
      </main>
    </div>
  );
}

