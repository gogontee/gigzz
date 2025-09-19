// pages/dashboard/profile/[id].js
"use client";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs"; 
import { motion } from "framer-motion";
import Link from "next/link";
import DOMPurify from "dompurify";
import {
  Eye,
  MessageCircle,
  MapPin,
  GraduationCap,
  Calendar,
} from "lucide-react";
import ChatModal from "../../../components/ChatModal";

const supabase = createPagesBrowserClient();

// Helper component to safely render HTML with preview/expand
function HtmlPreview({ htmlContent, wordLimit = 50 }) {
  const [expanded, setExpanded] = useState(false);

  if (!htmlContent) return null;

  const cleanHtml = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: ["p", "strong", "em", "ul", "ol", "li", "br"],
    ALLOWED_ATTR: [],
  });

  // Strip tags for word counting
  const textContent = cleanHtml.replace(/<[^>]+>/g, "");
  const words = textContent.trim().split(/\s+/);
  const isLong = words.length > wordLimit;

  const displayContent = expanded
    ? cleanHtml
    : `<p>${words.slice(0, wordLimit).join(" ")}${isLong ? "..." : ""}</p>`;

  return (
    <div>
      <div
        className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: displayContent }}
      />
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-orange-600 text-sm font-medium mt-2 hover:underline"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { id: applicantId } = router.query;

  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);

  // Load logged-in client id
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) console.error("Supabase auth error:", error.message);
        if (user) setClientId(user.id);
      } catch (err) {
        console.error("Error getting auth user:", err);
      }
    };
    getUser();
  }, []);

  // Load profile + projects
  const loadProfileAndProjects = useCallback(async () => {
    if (!applicantId) return;
    setLoading(true);
    try {
      const { data: userMeta, error: userMetaErr } = await supabase
        .from("users")
        .select("role")
        .eq("id", applicantId)
        .maybeSingle();

      if (userMetaErr) {
        console.error("Error fetching user role:", userMetaErr);
        setLoading(false);
        return;
      }

      if (!userMeta) {
        setLoading(false);
        return;
      }

      const role = userMeta.role;
      const table = role === "employer" ? "employers" : "applicants";

      // Profile
      const { data: profileData, error: profileErr } = await supabase
        .from(table)
        .select("*")
        .eq("id", applicantId)
        .maybeSingle();

      if (profileErr) console.error("Error fetching profile:", profileErr);
      else if (profileData) setProfile({ ...profileData, role, table });

      // Projects
      const { data: projectsData, error: projectsErr } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", applicantId)
        .order("created_at", { ascending: false });

      if (projectsErr) console.error("Error fetching projects:", projectsErr);
      else if (projectsData) setProjects(projectsData);
    } catch (err) {
      console.error("Unexpected error loading profile:", err);
    } finally {
      setLoading(false);
    }
  }, [applicantId]);

  useEffect(() => {
    loadProfileAndProjects();
  }, [loadProfileAndProjects]);

  // Open chat
  const openChat = async () => {
    if (!clientId) {
      router.push("/auth/login");
      return;
    }
    if (!applicantId) return;

    setChatLoading(true);
    try {
      // Look for existing chat
      const { data: existingChats, error: fetchError } = await supabase
        .from("chats")
        .select("id")
        .or(
          `and(client_id.eq.${clientId},applicant_id.eq.${applicantId}),and(client_id.eq.${applicantId},applicant_id.eq.${clientId})`
        )
        .limit(1);

      if (fetchError) throw fetchError;

      let cId = existingChats?.[0]?.id;

      // If not found, create one
      if (!cId) {
        const { data: newChat, error: insertError } = await supabase
          .from("chats")
          .insert([{ client_id: clientId, applicant_id: applicantId }])
          .select()
          .single();

        if (insertError) throw insertError;
        cId = newChat.id;
      }

      setChatId(cId);
      setChatOpen(true);
    } catch (err) {
      console.error("Error opening chat:", err.message || err);
      alert("Cannot start chat. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-6 text-center text-gray-500">Loading profile...</div>
    );
  if (!profile)
    return (
      <div className="p-6 text-center text-red-500">Profile not found</div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto px-4 py-6 relative"
    >
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-black to-orange-500 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row gap-6 lg:mt-20 relative">
        <div className="flex-shrink-0">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white">
            <img
              src={profile.avatar_url || "/placeholder.png"}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold leading-tight">
              {profile.full_name || profile.name}
            </h1>
            <span className="text-xs uppercase bg-white/20 px-3 py-1 rounded-full">
              {profile.role === "employer" ? "Client" : "Creative"}
            </span>
          </div>

          <p className="mt-1 text-sm opacity-90">{profile.email}</p>
          {profile.phone && (
            <p className="mt-1 text-sm opacity-90">📞 {profile.phone}</p>
          )}
          <p className="mt-3 text-sm opacity-90 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {`${profile.city || ""}, ${profile.state || ""}, ${
              profile.country || ""
            }`}
          </p>
        </div>

        {/* Chat button */}
        <button
          onClick={openChat}
          className="absolute bottom-4 right-4 bg-white text-black p-3 rounded-full shadow-lg hover:scale-110 transition flex items-center justify-center"
          aria-label="Chat"
          title={clientId ? "Open chat" : "Login to chat"}
          disabled={chatLoading}
        >
          {chatLoading ? (
            <svg className="w-5 h-5 animate-spin text-black" viewBox="3 3 18 18">
              <path className="fill-black" d="M12 3v3" />
            </svg>
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Profile Details */}
      <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 space-y-6">
        {profile.bio && (
          <div>
            <h3 className="text-lg font-semibold mb-2">About</h3>
            <HtmlPreview htmlContent={profile.bio} wordLimit={50} />
          </div>
        )}

        {(profile.educational_qualification || profile.institutions) && (
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-orange-500" /> Education
            </h3>
            {profile.educational_qualification && (
              <HtmlPreview htmlContent={profile.educational_qualification} />
            )}
            {profile.institutions && (
              <HtmlPreview htmlContent={profile.institutions} />
            )}
          </div>
        )}

        {profile.date_of_birth && (
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" /> Date of Birth
            </h3>
            {profile.show_date_of_birth ? (
              <p className="text-gray-700">{profile.date_of_birth}</p>
            ) : (
              <p className="text-gray-500 italic">Hidden</p>
            )}
          </div>
        )}
      </div>

      {/* Portfolio */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Portfolio</h2>
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-2xl p-8 text-center">
            <p className="text-gray-600 mb-2">No portfolio to show.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden group"
              >
                <div className="relative h-40 w-full overflow-hidden">
                  <img
                    src={project.profile || "/placeholder.png"}
                    alt={project.title}
                    className="h-full w-full object-cover transform group-hover:scale-105 transition duration-500"
                  />
                  <Link
                    href={`/project/${project.id}`}
                    className="absolute top-3 right-3 bg-white/80 backdrop-blur-md rounded-full p-2 shadow hover:bg-white transition"
                  >
                    <Eye className="w-5 h-5 text-gray-700" />
                  </Link>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                    {project.title}
                  </h3>
                  <HtmlPreview htmlContent={project.details} wordLimit={30} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {chatOpen && chatId && (
        <ChatModal
          chatId={chatId}
          userId={clientId}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}
    </motion.div>
  );
}
