// components/profile/Profile.js
'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  MessageCircle,
  MapPin,
  GraduationCap,
  Calendar,
  Edit3,
  X,
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import WalletComponent from '../components/WalletComponent';
import ChatModal from '../components/ChatModal';
import DOMPurify from 'dompurify';

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

export default function Profile({ userId }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [showWallet, setShowWallet] = useState(false);
  
  // Chat states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);

  // Check if current user is the profile owner
  const isProfileOwner = user?.id === userId;

  // Load token balance for the profile owner - ONLY if profile owner
  const loadTokenBalance = useCallback(async () => {
    if (!userId || !isProfileOwner) {
      setTokenBalance(0);
      return;
    }
    
    try {
      const { data: wallet, error } = await supabase
        .from('token_wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching token balance:', error);
        setTokenBalance(0);
        return;
      }

      setTokenBalance(wallet?.balance || 0);
    } catch (err) {
      console.error('Unexpected error loading token balance:', err);
      setTokenBalance(0);
    }
  }, [userId, isProfileOwner]);

  const loadProfileAndProjects = useCallback(async () => {
    setLoading(true);

    // Get authenticated user
    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser();
    
    if (authUser) {
      setUser(authUser);
    }

    // Determine role and table
    const { data: userMeta } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId || authUser?.id)
      .single();

    const role = userMeta?.role;
    const table = role === 'employer' ? 'employers' : 'applicants';

    // Fetch profile
    const { data: profileData } = await supabase
      .from(table)
      .select('*')
      .eq('id', userId || authUser?.id)
      .single();

    if (profileData) setProfile({ ...profileData, role, table });

    // Fetch projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId || authUser?.id)
      .order('created_at', { ascending: false });

    if (projectsData) setProjects(projectsData);

    // Load token balance only if user is profile owner
    await loadTokenBalance();
    
    setLoading(false);
  }, [userId, loadTokenBalance]);

  useEffect(() => {
    loadProfileAndProjects();
  }, [loadProfileAndProjects]);

  // Toggle DOB visibility
  const toggleDobVisibility = async () => {
    if (!profile) return;

    const updatedValue = !profile.show_date_of_birth;
    const { error } = await supabase
      .from(profile.table)
      .update({ show_date_of_birth: updatedValue })
      .eq('id', profile.id);

    if (!error) {
      setProfile((prev) => ({
        ...prev,
        show_date_of_birth: updatedValue,
      }));
    } else {
      console.error('Error updating DOB visibility:', error.message);
    }
  };

  // Get profile tag based on token balance - ONLY for profile owner
  const getProfileTag = () => {
    if (!isProfileOwner) return null;
    
    if (tokenBalance > 1) {
      return {
        text: "Promoted",
        color: "bg-green-500",
        tooltip: `You have ${tokenBalance} tokens available`
      };
    } else {
      return {
        text: "Your Profile",
        color: "bg-orange-500",
        tooltip: "Earn more tokens to get promoted"
      };
    }
  };

  // Handle chat button click - WITH PROPER AUTH HANDLING
  const handleChatClick = async () => {
    // If user is not logged in, redirect to login
    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    // If current user is the profile owner, redirect to messages page
    if (isProfileOwner) {
      window.location.href = "/messages";
      return;
    }

    // If current user is viewing someone else's profile, open chat modal
    setChatLoading(true);
    try {
      // Look for existing chat
      const { data: existingChats, error: fetchError } = await supabase
        .from("chats")
        .select("id")
        .or(
          `and(client_id.eq.${user.id},applicant_id.eq.${userId}),and(client_id.eq.${userId},applicant_id.eq.${user.id})`
        )
        .limit(1);

      if (fetchError) throw fetchError;

      let cId = existingChats?.[0]?.id;

      // If not found, create one
      if (!cId) {
        const { data: newChat, error: insertError } = await supabase
          .from("chats")
          .insert([{ client_id: user.id, applicant_id: userId }])
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

  // Get chat button tooltip text based on user scenario
  const getChatButtonTooltip = () => {
    if (!user) return "Login to chat";
    if (isProfileOwner) return "View your messages";
    return "Start chat";
  };

  const profileTag = getProfileTag();

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="p-6 text-center text-red-500">Profile not found</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto px-4 py-6 relative min-h-screen"
    >
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-black to-orange-500 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row gap-6 lg:mt-20 relative">
        <div className="flex-shrink-0">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white">
            <img
              src={profile.avatar_url || '/placeholder.png'}
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
            {profile.role && (
              <span className="text-xs uppercase bg-white/20 px-3 py-1 rounded-full">
                {profile.role === 'employer' ? 'Client' : 'Creative'}
              </span>
            )}
            {profileTag && (
              <span 
                className={`text-xs uppercase ${profileTag.color} px-3 py-1 rounded-full text-white`}
                title={profileTag.tooltip}
              >
                {profileTag.text}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm opacity-90">{profile.email}</p>
          {profile.phone && (
            <p className="mt-1 text-sm opacity-90">📞 {profile.phone}</p>
          )}
          <p className="mt-3 text-sm opacity-90 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {`${profile.city || ''}, ${profile.state || ''}, ${profile.country || ''}`}
          </p>
          
          {/* Token balance display for profile owner ONLY */}
          {isProfileOwner && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs bg-black/30 px-2 py-1 rounded-full">
                🪙 Tokens: {tokenBalance}
              </span>
              {tokenBalance <= 1 && (
                <button
                  onClick={() => setShowWallet(true)}
                  className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full hover:bg-yellow-600 transition"
                >
                  Get More Tokens
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions (Edit + Chat) - Smaller on mobile */}
        <div className="absolute bottom-4 right-4 flex gap-2 sm:gap-3">
          {isProfileOwner && (
            <Link
              href="/dashboard/applicant/edit"
              className="bg-white text-black p-2 sm:p-3 rounded-full shadow-lg hover:scale-110 transition transform duration-200 focus:outline-none group"
              aria-label="Edit Profile"
            >
              <Edit3 className="w-4 h-4 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" />
            </Link>
          )}
          
          {/* Chat button - VISIBLE TO EVERYONE */}
          <button
            onClick={handleChatClick}
            className="bg-white text-black p-2 sm:p-3 rounded-full shadow-lg hover:scale-110 transition flex items-center justify-center"
            aria-label="Chat"
            title={getChatButtonTooltip()}
            disabled={chatLoading}
          >
            {chatLoading ? (
              <svg className="w-4 h-4 sm:w-6 sm:h-6 animate-spin text-black" viewBox="3 3 18 18">
                <path className="fill-black" d="M12 3v3" />
              </svg>
            ) : (
              <MessageCircle className="w-4 h-4 sm:w-6 sm:h-6" />
            )}
          </button>
        </div>
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
            {isProfileOwner && (
              <button
                onClick={toggleDobVisibility}
                className="mt-2 flex items-center gap-2 text-sm text-orange-600 hover:underline"
              >
                {profile.show_date_of_birth ? (
                  <>
                    <EyeOff className="w-4 h-4" /> Hide DOB
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" /> Show DOB
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Projects */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Portfolio</h2>
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-2xl p-8 text-center">
            <p className="text-gray-600 mb-2">No portfolio to show.</p>
            {isProfileOwner && (
              <Link
                href="/dashboard/projects"
                className="text-orange-500 hover:underline font-medium"
              >
                Add your first project
              </Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, idx) => {
              // Truncate description to first 15 words
              const truncateHTML = (html, wordLimit = 15) => {
                if (!html) return "";
                // Remove HTML tags for counting words
                const text = html.replace(/<[^>]+>/g, "");
                const words = text.split(" ").slice(0, wordLimit).join(" ");
                const truncated = words + (text.split(" ").length > wordLimit ? "..." : "");
                return truncated;
              };

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden group"
                >
                  <div className="relative h-40 w-full overflow-hidden">
                    <img
                      src={project.profile || '/placeholder.png'}
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
                    <p
                      className="text-gray-600 text-sm"
                      dangerouslySetInnerHTML={{
                        __html: truncateHTML(project.details, 15),
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Wallet Modal */}
      {showWallet && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto relative"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowWallet(false)}
              className="absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors duration-200"
              aria-label="Close wallet"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Wallet Component */}
            <WalletComponent onClose={() => setShowWallet(false)} />
          </motion.div>
        </motion.div>
      )}

      {/* Chat Modal - Only show when viewing someone else's profile AND user is authenticated */}
      {chatOpen && chatId && !isProfileOwner && user && (
        <ChatModal
          chatId={chatId}
          userId={user.id}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}
    </motion.div>
  );
}