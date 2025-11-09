// pages/news.js
import Head from "next/head";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

// Prevent SSR hydration issues
const MobileHeader = dynamic(() => import("../components/MobileHeader"), {
  ssr: false,
});

const Header = dynamic(() => import("../components/Header"), {
  ssr: false,
});

// Custom Alert Component
const Alert = ({ message, type = "success", onClose }) => {
  const bgColor = type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200";
  const textColor = type === "success" ? "text-green-800" : "text-red-800";
  const borderColor = type === "success" ? "border-green-400" : "border-red-400";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 ${bgColor} ${borderColor} ${textColor} border rounded-xl px-6 py-4 shadow-lg max-w-md mx-auto backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {type === "success" ? (
            <svg className="w-5 h-5 mr-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 mr-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          <span className="font-medium">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-gray-500 hover:text-gray-700 transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
};

export default function News() {
  const [isMobile, setIsMobile] = useState(false);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  });
  const [subscribing, setSubscribing] = useState(false);
  const [alert, setAlert] = useState(null);

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
        showAlert("Failed to load news articles", "error");
      } else {
        setNews(data);
      }
      setLoading(false);
    };

    fetchNews();
  }, []);

  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      showAlert("Please enter your name", "error");
      return;
    }

    if (!formData.email) {
      showAlert("Please enter your email address", "error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showAlert("Please enter a valid email address", "error");
      return;
    }

    setSubscribing(true);

    try {
      // Check if email already exists in subscriptions
      const { data: existingSubscription, error: fetchError } = await supabase
        .from("subscriptions")
        .select("email")
        .eq("email", formData.email)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error checking subscription:", fetchError);
        throw fetchError;
      }

      if (existingSubscription) {
        showAlert("This email is already subscribed!", "error");
        setSubscribing(false);
        return;
      }

      // Insert new subscription with name and email
      const { error: insertError } = await supabase
        .from("subscriptions")
        .insert([
          {
            name: formData.name.trim(),
            email: formData.email,
            created_at: new Date().toISOString()
          }
        ]);

      if (insertError) {
        console.error("Error creating subscription:", insertError);
        throw insertError;
      }

      // Success
      setFormData({ name: "", email: "" });
      showAlert(`🎉 Thank you for subscribing, ${formData.name}! You'll receive the latest updates from Gigzz.`);
      
    } catch (error) {
      console.error("Subscription error:", error);
      showAlert("❌ Failed to subscribe. Please try again.", "error");
    } finally {
      setSubscribing(false);
    }
  };

  // Extract unique categories from news
  const categories = ["all", ...new Set(news.map(item => item.category).filter(Boolean))];

  const filteredNews = selectedCategory === "all" 
    ? news 
    : news.filter(item => item.category === selectedCategory);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <>
      <Head>
        <title>News & Updates – Gigzz</title>
        <meta
          name="description"
          content="Stay updated with the latest news, trends, and announcements from Gigzz."
        />
      </Head>

      {isMobile ? <MobileHeader /> : <Header />}

      {/* Alert Notification */}
      <AnimatePresence>
        {alert && (
          <Alert 
            message={alert.message} 
            type={alert.type} 
            onClose={() => setAlert(null)} 
          />
        )}
      </AnimatePresence>

      <main
        className={`min-h-screen bg-gradient-to-br from-gray-50 to-white text-black px-4 py-8 ${
          !isMobile ? "pt-24" : ""
        }`}
      >
        {/* Hero Section */}
        <motion.section 
          className="max-w-6xl mx-auto mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
            News & Updates
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stay informed with the latest trends, announcements, and insights from the Gigzz community
          </p>
        </motion.section>

        {/* Category Filters */}
        <motion.div 
          className="max-w-6xl mx-auto mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <motion.button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-black text-white shadow-lg"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-black hover:text-black"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* News Grid */}
        <motion.div
          className="max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((skeleton) => (
                <motion.div
                  key={skeleton}
                  className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 animate-pulse"
                  variants={cardVariants}
                >
                  <div className="bg-gray-200 h-32 md:h-48 rounded-lg md:rounded-xl mb-3 md:mb-4"></div>
                  <div className="bg-gray-200 h-3 md:h-4 rounded mb-2 md:mb-3"></div>
                  <div className="bg-gray-200 h-3 md:h-4 rounded w-3/4 mb-3 md:mb-4"></div>
                  <div className="bg-gray-200 h-2 md:h-3 rounded w-1/2"></div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && filteredNews.length === 0 && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-6xl mb-4">📰</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No news articles found
              </h3>
              <p className="text-gray-500">
                {selectedCategory !== "all" 
                  ? `No news in ${selectedCategory} category yet.`
                  : "Check back later for the latest updates."
                }
              </p>
            </motion.div>
          )}

          {/* Updated Grid - 2 columns on mobile, 3 columns on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <AnimatePresence>
              {filteredNews.map((item) => {
                const previewText = item.content
                  ?.replace(/<[^>]+>/g, "")
                  .slice(0, isMobile ? 60 : 120);

                return (
                  <motion.article
                    key={item.id}
                    className="group bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md md:hover:shadow-xl transition-all duration-300"
                    variants={cardVariants}
                    whileHover="hover"
                    layout
                  >
                    {/* News Image */}
                    {item.photo && (
                      <div className="relative overflow-hidden">
                        <img
                          src={item.photo}
                          alt={item.title}
                          className="w-full h-32 md:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 md:top-4 left-2 md:left-4">
                          {item.category && (
                            <span className="bg-black text-white px-2 md:px-3 py-1 rounded-full text-xs font-medium capitalize">
                              {item.category}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-3 md:p-6">
                      {/* Date */}
                      <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-500 mb-2 md:mb-3">
                        <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          year: isMobile ? undefined : "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>

                      {/* Title */}
                      <h2 className="text-sm md:text-xl font-bold mb-2 md:mb-3 text-gray-900 group-hover:text-orange-400 transition-colors duration-200 line-clamp-2 leading-tight md:leading-normal">
                        {item.title}
                      </h2>

                      {/* Content Preview/Full */}
                      <AnimatePresence mode="wait">
                        {!expanded[item.id] ? (
                          <motion.div
                            key="preview"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="mb-3 md:mb-4"
                          >
                            <p className="text-xs md:text-base text-gray-600 line-clamp-2 md:line-clamp-3 mb-2 md:mb-4 leading-relaxed">
                              {previewText}...
                            </p>
                            <motion.button
                              onClick={() => toggleExpand(item.id)}
                              className="flex items-center gap-1 text-black font-semibold hover:text-orange-400 transition-colors duration-200 group/btn text-xs md:text-sm"
                              whileHover={{ x: 2 }}
                            >
                              Read more
                              <svg 
                                className="w-3 h-3 md:w-4 md:h-4 group-hover/btn:translate-x-1 transition-transform duration-200" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </motion.button>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="expanded"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-3 md:mb-4"
                          >
                            <div
                              className="prose prose-xs md:prose-sm max-w-none text-gray-600 mb-2 md:mb-4 text-xs md:text-sm leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: item.content }}
                            />
                            <motion.button
                              onClick={() => toggleExpand(item.id)}
                              className="flex items-center gap-1 text-black font-semibold hover:text-orange-400 transition-colors duration-200 group/btn text-xs md:text-sm"
                              whileHover={{ x: -2 }}
                            >
                              <svg 
                                className="w-3 h-3 md:w-4 md:h-4 group-hover/btn:-translate-x-1 transition-transform duration-200" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                              Show less
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Author/Publisher (if available) - Hide on mobile for space */}
                      {item.author && !isMobile && (
                        <div className="flex items-center gap-2 pt-3 md:pt-4 border-t border-gray-100">
                          <div className="w-5 h-5 md:w-6 md:h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <svg className="w-2 h-2 md:w-3 md:h-3 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 12a5 5 0 110-10 5 5 0 010 10zm0 2c-2.5 0-7.5 1.3-7.5 4v3h15v-3c0-2.7-5-4-7.5-4z" />
                            </svg>
                          </div>
                          <span className="text-xs md:text-sm text-gray-500">By {item.author}</span>
                        </div>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Newsletter CTA */}
        {!loading && news.length > 0 && (
          <motion.section 
            className="max-w-4xl mx-auto mt-12 md:mt-16 mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-gradient-to-r from-black to-gray-800 rounded-xl md:rounded-2xl p-6 md:p-12 text-white">
              <h2 className="text-xl md:text-3xl font-bold mb-3 md:mb-4">
                Stay Updated
              </h2>
              <p className="text-gray-300 mb-4 md:mb-6 max-w-xl mx-auto text-sm md:text-base">
                Get the latest news and updates from Gigzz delivered directly to your inbox.
              </p>
              <form onSubmit={handleSubscribe} className="flex flex-col gap-3 md:gap-4 max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    className="flex-1 px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-500 text-sm"
                    disabled={subscribing}
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Your email"
                    className="flex-1 px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-500 text-sm"
                    disabled={subscribing}
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={subscribing}
                  className="bg-orange-400 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-semibold hover:bg-orange-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  whileHover={!subscribing ? { scale: 1.05 } : {}}
                  whileTap={!subscribing ? { scale: 0.95 } : {}}
                >
                  {subscribing ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Subscribing...
                    </div>
                  ) : (
                    "Subscribe Now"
                  )}
                </motion.button>
              </form>
              <p className="text-gray-400 text-xs md:text-sm mt-3 md:mt-4">
                No spam, unsubscribe at any time.
              </p>
            </div>
          </motion.section>
        )}
      </main>
    </>
  );
}