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
        if (data && data.length > 0) {
          setActive(data[0].slug); // set first as active
        }
      }
      setLoading(false);
    };

    fetchTopics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden">
        <MobileHeader />
        <h1 className="text-2xl font-bold text-center mb-2">Learn More</h1>
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
            const preview = getPreview(topic.content, 50);
            const isExpanded = readMore[topic.slug];

            return (
              <motion.section
                key={topic.slug}
                id={topic.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-12 scroll-mt-20"
              >
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  {topic.title}
                </h2>

                <div
                  className="prose prose-orange max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: isExpanded ? topic.content : preview,
                  }}
                />

                {topic.content.replace(/<[^>]+>/g, "").split(" ").length > 50 && (
                  <button
                    onClick={() =>
                      setReadMore((prev) => ({
                        ...prev,
                        [topic.slug]: !prev[topic.slug],
                      }))
                    }
                    className="text-orange-500 hover:text-orange-700 font-medium ml-1"
                  >
                    {isExpanded ? "Show less" : "Read more"}
                  </button>
                )}
              </motion.section>
            );
          })}
        </div>

        {/* Mobile View - Accordion */}
        <div className="md:hidden flex flex-col gap-4">
          {topics.map((topic) => {
            const preview = getPreview(topic.content, 50);
            const isOpen = mobileOpen[topic.slug] || false;
            const isExpanded = readMore[topic.slug] || false;

            return (
              <div
                key={topic.slug}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <button
                  className="w-full text-left px-4 py-3 font-semibold text-gray-800 hover:bg-orange-100 transition flex justify-between items-center"
                  onClick={() =>
                    setMobileOpen((prev) => ({
                      ...prev,
                      [topic.slug]: !prev[topic.slug],
                    }))
                  }
                >
                  {topic.title}
                  <span className="ml-2">{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && (
                  <div className="px-4 py-3 text-gray-700 text-base">
                    <div
                      className="prose prose-orange max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: isExpanded ? topic.content : preview,
                      }}
                    />

                    {topic.content.replace(/<[^>]+>/g, "").split(" ").length >
                      50 && (
                      <button
                        onClick={() =>
                          setReadMore((prev) => ({
                            ...prev,
                            [topic.slug]: !prev[topic.slug],
                          }))
                        }
                        className="text-orange-500 hover:text-orange-700 font-medium ml-1"
                      >
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
