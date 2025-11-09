"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { supabase } from "../utils/supabaseClient"; // ✅ adjust if path differs

const MobileHeader = dynamic(() => import("../components/MobileHeader"), {
  ssr: false,
});

// Strip HTML tags and then trim by word count for previews
const getPreview = (html, wordLimit = 50) => {
  if (!html) return "";
  const text = html.replace(/<[^>]+>/g, ""); // remove tags
  const words = text.split(" ");
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(" ") + "...";
};

// Function to format content with proper spacing and readability
const formatContent = (content, isPreview = false) => {
  if (!content) return "";
  
  if (isPreview) {
    // For preview, ensure proper spacing and formatting
    const text = content
      .replace(/<[^>]+>/g, " ") // Replace tags with spaces
      .replace(/\s+/g, " ") // Collapse multiple spaces
      .trim();
    
    const words = text.split(" ");
    if (words.length <= 50) return text;
    
    const previewText = words.slice(0, 50).join(" ") + "...";
    
    // Format preview with proper spacing
    return (
      <div className="space-y-3">
        <p className="leading-relaxed">{previewText}</p>
      </div>
    );
  }
  
  // For full content, use dangerouslySetInnerHTML but ensure proper styling
  return { __html: content };
};

export default function LearnMore() {
  const [topics, setTopics] = useState([]);
  const [active, setActive] = useState(null); // desktop active
  const [mobileOpen, setMobileOpen] = useState({}); // mobile accordion
  const [readMore, setReadMore] = useState({}); // read more toggle per topic
  const [loading, setLoading] = useState(true);

  // Fetch topics from Supabase
  useEffect(() => {
    const fetchTopics = async () => {
      const { data, error } = await supabase
        .from("learn_more")
        .select("title, slug, content")
        .order("id", { ascending: true });

      if (error) {
        console.error("Error fetching learn_more:", error.message);
      } else {
        setTopics(data || []);

        // ✅ If there's a hash in the URL, use that as active
        const hash = window.location.hash?.replace("#", "");
        if (hash && data.some((t) => t.slug === hash)) {
          setActive(hash);
          // scroll to it
          setTimeout(() => {
            document.getElementById(hash)?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);
        } else if (data.length > 0) {
          setActive(data[0].slug);
        }
      }
      setLoading(false);
    };

    fetchTopics();
  }, []);

  // ✅ Watch for hash changes (if user clicks sidebar or external link)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash?.replace("#", "");
      if (hash && topics.some((t) => t.slug === hash)) {
        setActive(hash);
        // also scroll to section
        document.getElementById(hash)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [topics]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden">
        <MobileHeader />
        <h1 className="text-2xl font-bold text-center mb-2 mt-4">Learn More</h1>
      </div>

      {/* Sidebar for Desktop */}
      <aside className="hidden md:block w-1/4 bg-white shadow-md p-6 sticky top-0 h-screen overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6 pt-20">Learn More</h1>
        <ul className="flex flex-col gap-2">
          {topics.map((topic) => (
            <li key={topic.slug}>
              <a
                href={`#${topic.slug}`}
                onClick={() => setActive(topic.slug)}
                className={`block px-3 py-2 rounded hover:bg-orange-500 hover:text-white transition cursor-pointer ${
                  active === topic.slug
                    ? "bg-orange-500 text-white"
                    : "text-gray-800"
                }`}
              >
                {topic.title}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      {/* Content Area */}
      <main className="flex-1 w-full md:w-3/4 p-6 md:p-12 md:pt-20 overflow-y-auto">
        {/* Desktop View */}
        <div className="hidden md:block">
          {topics.map((topic) => {
            const isExpanded = readMore[topic.slug];
            const wordCount = topic.content.replace(/<[^>]+>/g, "").split(" ").length;
            const needsReadMore = wordCount > 50;

            return (
              <motion.section
                key={topic.slug}
                id={topic.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-12 scroll-mt-20 bg-white rounded-lg shadow-sm p-6"
              >
                <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">
                  {topic.title}
                </h2>

                <div className="space-y-4">
                  {isExpanded || !needsReadMore ? (
                    <div
                      className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={formatContent(topic.content, false)}
                    />
                  ) : (
                    formatContent(topic.content, true)
                  )}
                </div>

                {needsReadMore && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() =>
                        setReadMore((prev) => ({
                          ...prev,
                          [topic.slug]: !prev[topic.slug],
                        }))
                      }
                      className="text-orange-500 hover:text-orange-700 font-medium px-4 py-2 rounded-lg border border-orange-500 hover:bg-orange-50 transition-colors"
                    >
                      {isExpanded ? "Show Less" : "Read More"}
                    </button>
                  </div>
                )}
              </motion.section>
            );
          })}
        </div>

        {/* Mobile View - Accordion */}
        <div className="md:hidden flex flex-col gap-4">
          {topics.map((topic) => {
            const isOpen = mobileOpen[topic.slug] || false;
            const isExpanded = readMore[topic.slug] || false;
            const wordCount = topic.content.replace(/<[^>]+>/g, "").split(" ").length;
            const needsReadMore = wordCount > 50;

            return (
              <div
                key={topic.slug}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <button
                  className="w-full text-left px-4 py-4 font-semibold text-gray-800 hover:bg-orange-50 transition flex justify-between items-center text-lg border-b"
                  onClick={() =>
                    setMobileOpen((prev) => ({
                      ...prev,
                      [topic.slug]: !prev[topic.slug],
                    }))
                  }
                >
                  {topic.title}
                  <span className="ml-2 text-orange-500">
                    {isOpen ? "▲" : "▼"}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 py-4">
                    <div className="space-y-4">
                      {isExpanded || !needsReadMore ? (
                        <div
                          className="prose prose-base max-w-none text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={formatContent(topic.content, false)}
                        />
                      ) : (
                        formatContent(topic.content, true)
                      )}
                    </div>

                    {needsReadMore && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() =>
                            setReadMore((prev) => ({
                              ...prev,
                              [topic.slug]: !prev[topic.slug],
                            }))
                          }
                          className="text-orange-500 hover:text-orange-700 font-medium px-4 py-2 rounded-lg border border-orange-500 hover:bg-orange-50 transition-colors w-full text-center"
                        >
                          {isExpanded ? "Show Less" : "Read More"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && topics.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No Content Available
            </h3>
            <p className="text-gray-500">
              Check back later for learning resources.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}