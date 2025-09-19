// pages/profile.js
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Eye,
  EyeOff,
  MessageCircle,
  MapPin,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import DOMPurify from 'dompurify';

// AboutPreview component: truncates text but keeps HTML formatting
function AboutPreview({ htmlContent }) {
  const [expanded, setExpanded] = useState(false);

  // Clean HTML (strip editor metadata but keep formatting)
  const cleanHtml = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br'],
    ALLOWED_ATTR: [],
  });

  // For preview, strip HTML to count words
  const textContent = cleanHtml.replace(/<[^>]+>/g, '');
  const words = textContent.trim().split(/\s+/);
  const isLong = words.length > 30;
  const previewText = words.slice(0, 30).join(' ');

  const displayContent = expanded ? cleanHtml : `<p>${previewText}${isLong ? '...' : ''}</p>`;

  return (
    <div>
      <div
        className="prose prose-sm text-gray-700 max-w-none"
        dangerouslySetInnerHTML={{ __html: displayContent }}
      />
      {isLong && (
        <button
          className="text-orange-600 mt-2 text-sm font-medium hover:underline"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const user = useUser();
  const supabase = useSupabaseClient();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  const loadProfileAndProjects = useCallback(async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);

    // Get user role
    const { data: userMeta } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = userMeta?.role;
    const table = role === 'employer' ? 'employers' : 'applicants';

    // Fetch profile
    const { data: profileData } = await supabase
      .from(table)
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) setProfile({ ...profileData, role, table });

    // Fetch projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (projectsData) setProjects(projectsData);

    setLoading(false);
  }, [user, router, supabase]);

  useEffect(() => {
    loadProfileAndProjects();
  }, [loadProfileAndProjects]);

  const toggleDobVisibility = async () => {
    if (!profile) return;

    const updatedValue = !profile.show_date_of_birth;
    const { error } = await supabase
      .from(profile.table)
      .update({ show_date_of_birth: updatedValue })
      .eq('id', profile.id);

    if (!error) {
      setProfile((prev) => ({ ...prev, show_date_of_birth: updatedValue }));
    } else {
      console.error('Error updating DOB visibility:', error.message);
    }
  };

  if (!user) return <div className="p-6 text-center text-gray-500">Redirecting...</div>;
  if (loading) return <div className="p-6 text-center text-gray-500">Loading profile...</div>;
  if (!profile) return <div className="p-6 text-center text-red-500">Profile not found</div>;

  const aboutHtml = profile.about || profile.bio || '';

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
              src={profile.avatar_url || '/placeholder.png'}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold leading-tight">{profile.full_name || profile.name}</h1>
            {profile.role && (
              <span className="text-xs uppercase bg-white/20 px-3 py-1 rounded-full">
                {profile.role === 'employer' ? 'Client' : 'Creative'}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm opacity-90">{profile.email}</p>
          {profile.phone && <p className="mt-1 text-sm opacity-90">📞 {profile.phone}</p>}
          <p className="mt-3 text-sm opacity-90 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {`${profile.city || ''}${profile.city || profile.state || profile.country ? ', ' : ''}${profile.state || ''}${profile.state && profile.country ? ', ' : ''}${profile.country || ''}`}
          </p>
        </div>

        {user?.id === profile.id && (
          <Link
            href="/messages"
            className="absolute bottom-4 right-4 bg-white text-black p-3 rounded-full shadow-lg hover:scale-110 transition transform duration-200 focus:outline-none group"
          >
            <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          </Link>
        )}
      </div>

      {/* Profile Details */}
      <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 space-y-6">
        {aboutHtml && (
          <div>
            <h3 className="text-lg font-semibold mb-2">About</h3>
            <AboutPreview htmlContent={aboutHtml} />
          </div>
        )}

        {(profile.educational_qualification || profile.institutions) && (
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-orange-500" /> Education
            </h3>
            {profile.educational_qualification && (
              <div
                className="text-gray-700 prose prose-sm max-w-none mb-2"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(profile.educational_qualification, {
                    ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br'],
                    ALLOWED_ATTR: [],
                  }),
                }}
              />
            )}
            {profile.institutions && (
              <div
                className="text-gray-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(profile.institutions, {
                    ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br'],
                    ALLOWED_ATTR: [],
                  }),
                }}
              />
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
            {user?.id === profile.id && (
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
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">{project.title}</h3>
                  <div
                    className="text-sm text-gray-600 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(project.details || '', {
                        ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br'],
                        ALLOWED_ATTR: [],
                      }),
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
