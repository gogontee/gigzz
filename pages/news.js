// pages/news.js
import Head from "next/head";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient"; 

// Prevent SSR hydration issues
const MobileHeader = dynamic(() => import("../components/MobileHeader"), {
  ssr: false,
});

export default function News() {
  const [isMobile, setIsMobile] = useState(false);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({}); // 👈 track expanded cards

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching news:", error);
      } else {
        setNews(data);
      }
      setLoading(false);
    };

    fetchNews();
  }, []);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <Head>
        <title>News – Gigzz</title>
        <meta
          name="description"
          content="Stay updated with the latest news from Gigzz."
        />
      </Head>

      {isMobile && <MobileHeader />}

      <main
        className={`min-h-screen bg-white text-black px-4 py-8 ${
          !isMobile ? "pt-20" : ""
        }`}
      >
        <h1 className="text-xl font-bold mb-6 text-center">Latest News</h1>

        <div className="space-y-8 max-w-3xl mx-auto">
          {loading && (
            <p className="text-center text-gray-500">Loading news...</p>
          )}

          {!loading && news.length === 0 && (
            <p className="text-center text-gray-500">
              No news articles available.
            </p>
          )}

          {news.map((item) => {
            const previewText = item.content
              ?.replace(/<[^>]+>/g, "") // strip HTML tags
              .slice(0, 100);

            return (
              <article
                key={item.id}
                className="border rounded-xl p-5 shadow hover:shadow-lg transition"
              >
                {/* News Photo (optional) */}
                {item.photo && (
                  <img
                    src={item.photo}
                    alt={item.title}
                    className="w-full h-56 object-cover rounded-lg mb-4"
                  />
                )}

                {/* Title */}
                <h2 className="text-2xl font-semibold mb-2">{item.title}</h2>

                {/* Date */}
                <p className="text-sm text-gray-500 mb-4">
                  {new Date(item.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>

                {/* Content */}
                {!expanded[item.id] ? (
                  <>
                    <p className="text-gray-700 mb-2">
                      {previewText}...
                    </p>
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="text-orange-600 font-medium hover:underline"
                    >
                      Read more
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      className="prose prose-lg max-w-none text-gray-800"
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="mt-3 text-orange-600 font-medium hover:underline"
                    >
                      Show less
                    </button>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </main>
    </>
  );
}
