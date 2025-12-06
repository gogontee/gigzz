"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabaseClient";
import { X, AlertCircle } from "lucide-react"; // Added X icon import

// Lazy imports for forms
const LearnMoreForm = dynamic(() => import("../components/LearnMoreForm"), {
  ssr: false,
});
const NewsForm = dynamic(() => import("../components/NewsForm"), {
  ssr: false,
});

// Rich Text Editor
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

// Lazy import for ApplicantsList
const ApplicantsList = dynamic(() => import("../components/ApplicantsList"), {
  ssr: false,
  loading: () => <div className="p-4">Loading applicants...</div>
});

export default function AdminPanel() {
  const router = useRouter();
  const MAX_ATTEMPTS = 5;

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Sidebar dropdown states
  const [openMenu, setOpenMenu] = useState(null);
  const [activeContent, setActiveContent] = useState(null);

  // Data states
  const [learnMoreData, setLearnMoreData] = useState([]);
  const [newsData, setNewsData] = useState([]);
  const [jobsData, setJobsData] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [editContent, setEditContent] = useState("");

  // Get current user on component mount
  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setCurrentUser(user);
    } catch (error) {
      console.error("Error getting current user:", error);
    }
  };

  const handleLogin = async () => {
    if (!currentUser) {
      setError("No user logged in. Please sign in first.");
      return;
    }

    setLoading(true);
    try {
      // Check if the entered code matches the editorscode for the current user
      const { data, error } = await supabase
        .from("passcodes")
        .select("editorscode")
        .eq("user_id", currentUser.id)
        .single();

      if (error) {
        console.error("Error fetching passcode:", error);
        setError("Access denied. No editor permissions found.");
        setLoading(false);
        return;
      }

      if (!data) {
        setError("Access denied. No editor permissions found.");
        setLoading(false);
        return;
      }

      if (code === data.editorscode) {
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
    } catch (error) {
      console.error("Error during login:", error);
      setError("Error verifying access. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data functions
  const fetchLearnMore = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("learn_more")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLearnMoreData(data || []);
    } catch (error) {
      console.error("Error fetching learn more:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNewsData(data || []);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobsData(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Total jobs
      const { count: totalJobs } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true });

      // Total applicants
      const { count: totalApplicants } = await supabase
        .from("applicants")
        .select("*", { count: "exact", head: true });

      // Total clients (employers)
      const { count: totalClients } = await supabase
        .from("employers")
        .select("*", { count: "exact", head: true });

      // Total portfolios (projects)
      const { count: totalPortfolios } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true });

      // Jobs by agents
      const { count: agentJobs } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("agent", true);

      // Total testimonials
      const { count: totalTestimonials } = await supabase
        .from("testimonials")
        .select("*", { count: "exact", head: true });

      // Unsubscribed talents (balance = 0)
      const { count: unsubscribedTalents } = await supabase
        .from("token_wallets")
        .select("*", { count: "exact", head: true })
        .eq("balance", 0);

      // Pending verifications
      const { count: pendingVerifications } = await supabase
        .from("verifications")
        .select("*", { count: "exact", head: true })
        .eq("approved", "pending");

      // Verified clients
      const { count: verifiedClients } = await supabase
        .from("verifications")
        .select("*", { count: "exact", head: true })
        .eq("approved", "verified");

      setAnalytics({
        totalJobs,
        totalApplicants,
        totalClients,
        totalPortfolios,
        agentJobs,
        totalTestimonials,
        unsubscribedTalents: (unsubscribedTalents || 0) - (totalClients || 0),
        pendingVerifications,
        verifiedClients,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete functions
  const deleteLearnMore = async (id) => {
    if (!confirm("Are you sure you want to delete this content?")) return;

    try {
      const { error } = await supabase
        .from("learn_more")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchLearnMore();
      alert("Content deleted successfully!");
    } catch (error) {
      console.error("Error deleting content:", error);
      alert("Error deleting content");
    }
  };

  const deleteNews = async (id) => {
    if (!confirm("Are you sure you want to delete this news?")) return;

    try {
      const { error } = await supabase
        .from("news")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchNews();
      alert("News deleted successfully!");
    } catch (error) {
      console.error("Error deleting news:", error);
      alert("Error deleting news");
    }
  };

  const deleteJob = async (id) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchJobs();
      alert("Job deleted successfully!");
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Error deleting job");
    }
  };

  // Update functions with rich text editor
  const updateLearnMore = async (id) => {
    try {
      const { error } = await supabase
        .from("learn_more")
        .update({ 
          content: editContent,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;
      setEditingItem(null);
      fetchLearnMore();
      alert("Content updated successfully!");
    } catch (error) {
      console.error("Error updating content:", error);
      alert("Error updating content");
    }
  };

  const updateNews = async (id) => {
    try {
      const { error } = await supabase
        .from("news")
        .update({ 
          content: editContent,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;
      setEditingItem(null);
      fetchNews();
      alert("News updated successfully!");
    } catch (error) {
      console.error("Error updating news:", error);
      alert("Error updating news");
    }
  };

  // Close function for editing modals
  const closeEditModal = () => {
    setEditingItem(null);
    setEditContent("");
  };

  // Load data when content changes
  useEffect(() => {
    if (!isLoggedIn) return;

    switch (activeContent) {
      case "editLearn":
      case "deleteLearn":
        fetchLearnMore();
        break;
      case "editNews":
      case "deleteNews":
        fetchNews();
        break;
      case "manageJobs":
        fetchJobs();
        break;
      case "analytics":
        fetchAnalytics();
        break;
    }
  }, [activeContent, isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg relative"
        >
          {/* Exit button */}
          <button
            onClick={() => router.push("/")}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Admin Access
          </h1>
          
          {!currentUser && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
              Please sign in to access the admin panel.
            </div>
          )}

          {currentUser && (
            <>
              <p className="text-gray-600 mb-4 text-center">
                Enter your editor code to continue
              </p>
              {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

              <div className="flex flex-col gap-4">
                <input
                  type="password"
                  placeholder="Enter your editor code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={loading}
                />
                <button
                  onClick={handleLogin}
                  disabled={loading || !currentUser}
                  className="bg-black text-white px-4 py-2 rounded hover:bg-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Verifying..." : "Enter Admin Panel"}
                </button>
              </div>

              <div className="mt-4 text-center text-sm text-gray-500">
                <p>Attempts: {attempts} of {MAX_ATTEMPTS}</p>
                {currentUser && (
                  <p className="mt-2">Logged in as: {currentUser.email}</p>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar */}
      <aside className="w-full md:w-1/4 bg-white shadow-md p-6 md:pt-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          {currentUser && (
            <p className="text-sm text-gray-600 mt-1">
              Welcome, {currentUser.email}
            </p>
          )}
        </div>
        
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

          {/* User Management Section */}
          <button
            onClick={() => setOpenMenu(openMenu === "users" ? null : "users")}
            className="w-full text-left px-4 py-2 rounded hover:bg-blue-500 hover:text-white transition font-semibold"
          >
            User Management
          </button>
          {openMenu === "users" && (
            <div className="flex flex-col ml-4 mt-2 gap-1">
              <button
                onClick={() => setActiveContent("manageApplicants")}
                className="px-3 py-1 rounded hover:bg-blue-100 transition text-gray-700 text-left"
              >
                Manage Applicants
              </button>
              <button
                onClick={() => setActiveContent("manageEmployers")}
                className="px-3 py-1 rounded hover:bg-blue-100 transition text-gray-700 text-left"
              >
                Manage Employers
              </button>
              <button
                onClick={() => setActiveContent("manageUsers")}
                className="px-3 py-1 rounded hover:bg-blue-100 transition text-gray-700 text-left"
              >
                Manage All Users
              </button>
            </div>
          )}

          {/* Other sidebar items */}
          <button 
            onClick={() => setActiveContent("manageJobs")}
            className="w-full text-left px-4 py-2 rounded hover:bg-orange-500 hover:text-white transition font-semibold"
          >
            Manage Job Listings
          </button>
          <button 
            onClick={() => setActiveContent("analytics")}
            className="w-full text-left px-4 py-2 rounded hover:bg-orange-500 hover:text-white transition font-semibold"
          >
            View Analytics
          </button>

          {/* Logout button */}
          <button 
            onClick={() => {
              setIsLoggedIn(false);
              setActiveContent(null);
              setCode("");
              setError("");
              setAttempts(0);
            }}
            className="w-full text-left px-4 py-2 rounded hover:bg-red-500 hover:text-white transition font-semibold mt-4"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 p-6 md:p-12 md:pt-20 overflow-y-auto">
        {/* Content Header with Exit */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your platform content and users</p>
          </div>
          <button
            onClick={() => {
              setIsLoggedIn(false);
              setActiveContent(null);
              setCode("");
              setError("");
              setAttempts(0);
            }}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition"
            aria-label="Exit admin panel"
          >
            <X size={20} />
            <span className="hidden md:inline">Exit Admin</span>
          </button>
        </div>

        {/* Learn More Content */}
        {activeContent === "addLearn" && (
          <div className="bg-white rounded-lg shadow-md relative">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                Add Learn More Content
              </h2>
              <button
                onClick={() => setActiveContent(null)}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <LearnMoreForm onSuccess={() => setActiveContent(null)} />
            </div>
          </div>
        )}

        {activeContent === "editLearn" && (
          <div className="bg-white rounded-lg shadow-md relative">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                Edit Learn More Content
              </h2>
              <button
                onClick={() => setActiveContent(null)}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {loading ? (
                <p>Loading...</p>
              ) : editingItem ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Editing: {editingItem.title}</h3>
                    <button
                      onClick={closeEditModal}
                      className="text-gray-400 hover:text-gray-600 transition"
                      aria-label="Close editing"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <ReactQuill
                    value={editContent}
                    onChange={setEditContent}
                    theme="snow"
                    className="mb-4 h-64"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateLearnMore(editingItem.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={closeEditModal}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {learnMoreData.map((item) => (
                    <div key={item.id} className="border p-4 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{item.title}</h3>
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setEditContent(item.content);
                          }}
                          className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition"
                        >
                          Edit
                        </button>
                      </div>
                      <div 
                        className="text-gray-600 mb-2 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeContent === "deleteLearn" && (
          <div className="bg-white rounded-lg shadow-md relative">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                Delete Learn More Content
              </h2>
              <button
                onClick={() => setActiveContent(null)}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="space-y-4">
                  {learnMoreData.map((item) => (
                    <div key={item.id} className="border p-4 rounded flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-gray-600 text-sm">{item.slug}</p>
                      </div>
                      <button
                        onClick={() => deleteLearnMore(item.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* News Content */}
        {activeContent === "addNews" && (
          <div className="bg-white rounded-lg shadow-md relative">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Add News</h2>
              <button
                onClick={() => setActiveContent(null)}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <NewsForm onSuccess={() => setActiveContent(null)} />
            </div>
          </div>
        )}

        {activeContent === "editNews" && (
          <div className="bg-white rounded-lg shadow-md relative">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Edit News</h2>
              <button
                onClick={() => setActiveContent(null)}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {loading ? (
                <p>Loading...</p>
              ) : editingItem ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Editing: {editingItem.title}</h3>
                    <button
                      onClick={closeEditModal}
                      className="text-gray-400 hover:text-gray-600 transition"
                      aria-label="Close editing"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <ReactQuill
                    value={editContent}
                    onChange={setEditContent}
                    theme="snow"
                    className="mb-4 h-64"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateNews(editingItem.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={closeEditModal}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {newsData.map((item) => (
                    <div key={item.id} className="border p-4 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{item.title}</h3>
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setEditContent(item.content);
                          }}
                          className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition"
                        >
                          Edit
                        </button>
                      </div>
                      <div 
                        className="text-gray-600 mb-2 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeContent === "deleteNews" && (
          <div className="bg-white rounded-lg shadow-md relative">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Delete News</h2>
              <button
                onClick={() => setActiveContent(null)}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="space-y-4">
                  {newsData.map((item) => (
                    <div key={item.id} className="border p-4 rounded flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-gray-600 text-sm">{item.slug}</p>
                      </div>
                      <button
                        onClick={() => deleteNews(item.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manage Jobs */}
        {activeContent === "manageJobs" && (
          <div className="bg-white rounded-lg shadow-md relative">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Manage Job Listings</h2>
              <button
                onClick={() => setActiveContent(null)}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {loading ? (
                <p>Loading jobs...</p>
              ) : (
                <div className="space-y-4">
                  {jobsData.map((job) => (
                    <div key={job.id} className="border p-4 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          <p className="text-gray-600">{job.category} • {job.type}</p>
                          <p className="text-gray-600">
                            ${job.min_price} - ${job.max_price} • {job.location}
                          </p>
                          <p className="text-sm text-gray-500">
                            Posted: {new Date(job.created_at).toLocaleDateString()}
                          </p>
                          {job.agent && (
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                              Agent Job
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => deleteJob(job.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics */}
        {activeContent === "analytics" && (
          <div className="bg-white rounded-lg shadow-md relative">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Platform Analytics</h2>
              <button
                onClick={() => setActiveContent(null)}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {loading ? (
                <p>Loading analytics...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded border">
                    <h3 className="font-semibold text-blue-800">Total Jobs</h3>
                    <p className="text-2xl font-bold">{analytics.totalJobs || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded border">
                    <h3 className="font-semibold text-green-800">Total Applicants</h3>
                    <p className="text-2xl font-bold">{analytics.totalApplicants || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded border">
                    <h3 className="font-semibold text-purple-800">Total Clients</h3>
                    <p className="text-2xl font-bold">{analytics.totalClients || 0}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded border">
                    <h3 className="font-semibold text-yellow-800">Total Portfolios</h3>
                    <p className="text-2xl font-bold">{analytics.totalPortfolios || 0}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded border">
                    <h3 className="font-semibold text-indigo-800">Agent Jobs</h3>
                    <p className="text-2xl font-bold">{analytics.agentJobs || 0}</p>
                  </div>
                  <div className="bg-pink-50 p-4 rounded border">
                    <h3 className="font-semibold text-pink-800">Total Testimonials</h3>
                    <p className="text-2xl font-bold">{analytics.totalTestimonials || 0}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded border">
                    <h3 className="font-semibold text-red-800">Unsubscribed Talents</h3>
                    <p className="text-2xl font-bold">{analytics.unsubscribedTalents || 0}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded border">
                    <h3 className="font-semibold text-orange-800">Pending Verifications</h3>
                    <p className="text-2xl font-bold">{analytics.pendingVerifications || 0}</p>
                  </div>
                  <div className="bg-teal-50 p-4 rounded border">
                    <h3 className="font-semibold text-teal-800">Verified Clients</h3>
                    <p className="text-2xl font-bold">{analytics.verifiedClients || 0}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manage Applicants - ApplicantsList Component */}
        {activeContent === "manageApplicants" && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden relative">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Applicants Management</h2>
                  <p className="text-gray-600 mt-1">Manage all applicants, update tokens, and view profiles</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchAnalytics()}
                    className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 2v6h-6"></path>
                      <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                      <path d="M3 22v-6h6"></path>
                      <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                    </svg>
                    Refresh
                  </button>
                  <button
                    onClick={() => setActiveContent("analytics")}
                    className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-100 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3v18h18"></path>
                      <path d="m19 9-5 5-4-4-3 3"></path>
                    </svg>
                    View Analytics
                  </button>
                  <button
                    onClick={() => setActiveContent(null)}
                    className="text-gray-400 hover:text-gray-600 transition ml-2"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-1">
              <ApplicantsList />
            </div>
          </div>
        )}

        {/* Manage Employers (Placeholder for future) */}
        {activeContent === "manageEmployers" && (
          <div className="bg-white rounded-lg shadow-md relative">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Manage Employers</h2>
              <button
                onClick={() => setActiveContent(null)}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 text-center py-12">
              <div className="inline-block p-4 bg-blue-50 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Employers Management</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                This section will allow you to manage all employer accounts, verify companies, and monitor employer activities.
              </p>
              <button
                className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                onClick={() => alert("Employer management feature coming soon!")}
              >
                Coming Soon
              </button>
            </div>
          </div>
        )}

        {/* Manage All Users (Placeholder for future) */}
        {activeContent === "manageUsers" && (
          <div className="bg-white rounded-lg shadow-md relative">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Manage All Users</h2>
              <button
                onClick={() => setActiveContent(null)}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 text-center py-12">
              <div className="inline-block p-4 bg-purple-50 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">All Users Management</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                This section will provide a comprehensive view of all users (applicants, employers, admins) with advanced filtering and management capabilities.
              </p>
              <button
                className="mt-6 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                onClick={() => alert("User management feature coming soon!")}
              >
                Coming Soon
              </button>
            </div>
          </div>
        )}

        {/* Default Welcome */}
        {!activeContent && (
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-semibold mb-4">Welcome to Admin Panel</h2>
            <p className="text-gray-600 mb-6">Select a sidebar option to manage content, jobs, users, or view analytics.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">Quick Actions</h3>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li>• <button onClick={() => setActiveContent("manageApplicants")} className="hover:text-blue-900 hover:underline">Manage Applicants</button></li>
                  <li>• <button onClick={() => setActiveContent("manageJobs")} className="hover:text-blue-900 hover:underline">View Job Listings</button></li>
                  <li>• <button onClick={() => setActiveContent("analytics")} className="hover:text-blue-900 hover:underline">Check Analytics</button></li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">Content Management</h3>
                <ul className="space-y-2 text-sm text-green-700">
                  <li>• <button onClick={() => setActiveContent("addLearn")} className="hover:text-green-900 hover:underline">Add Learn More</button></li>
                  <li>• <button onClick={() => setActiveContent("addNews")} className="hover:text-green-900 hover:underline">Add News</button></li>
                  <li>• <button onClick={() => setActiveContent("editLearn")} className="hover:text-green-900 hover:underline">Edit Content</button></li>
                </ul>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-orange-800 mb-2">Platform Stats</h3>
                <ul className="space-y-2 text-sm text-orange-700">
                  <li>• Total Applicants: {analytics.totalApplicants || "Loading..."}</li>
                  <li>• Total Jobs: {analytics.totalJobs || "Loading..."}</li>
                  <li>• Total Clients: {analytics.totalClients || "Loading..."}</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}