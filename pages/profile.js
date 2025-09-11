// pages/profile.js
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Eye,
  MessageCircle,
  MapPin,
  GraduationCap,
  Calendar,
  EyeOff,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const user = useUser(); // ✅ already gives you the logged-in user
  const supabase = useSupabaseClient(); // ✅ the client, no need to recreate

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [showFullBio, setShowFullBio] = useState(false);

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

    // Get profile
    const { data: profileData } = await supabase
      .from(table)
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile({ ...profileData, role, table });
    }

    // Get projects
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

  // 🔄 Toggle DOB visibility
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

  if (!user) {
    return <div className="p-6 text-center text-gray-500">Redirecting...</div>;
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="p-6 text-center text-red-500">Profile not found</div>;
  }

  // Helper to trim project details
  const getPreview = (text) => {
    if (!text) return '';
    const words = text.split(' ');
    return words.slice(0, 20).join(' ') + (words.length > 20 ? '...' : '');
  };

  const renderBio = (text) => {
    if (!text) return null;
    const words = text.split(' ');
    if (words.length <= 50) return text;
    return showFullBio ? text : words.slice(0, 50).join(' ') + '...';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto px-4 py-6 relative"
    >
      {/* Profile Header Card */}
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
          </div>
          <p className="mt-1 text-sm opacity-90">{profile.email}</p>
          {profile.phone && (
            <p className="mt-1 text-sm opacity-90">📞 {profile.phone}</p>
          )}
          <p className="mt-3 text-sm opacity-90 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {`${profile.city || ''}, ${profile.state || ''}, ${profile.country || ''}`}
          </p>
        </div>

        {/* 🔔 Messages Button - Only for profile owner */}
        {user?.id === profile.id && (
          <Link
            href="/messages"
            className="absolute bottom-4 right-4 bg-white text-black p-3 rounded-full shadow-lg hover:scale-110 transition transform duration-200 focus:outline-none group"
            aria-label="View Messages"
          >
            <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          </Link>
        )}
      </div>

      {/* Profile Details Section */}
      <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 space-y-6">
        {/* Bio */}
        {profile.bio && (
          <div>
            <h3 className="text-lg font-semibold mb-2">About</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {renderBio(profile.bio)}
            </p>
            {profile.bio.split(' ').length > 50 && (
              <button
                onClick={() => setShowFullBio(!showFullBio)}
                className="text-orange-600 text-sm font-medium mt-2 hover:underline"
              >
                {showFullBio ? 'Read less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Education */}
        {(profile.educational_qualification || profile.institutions) && (
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-orange-500" /> Education
            </h3>
            {profile.educational_qualification && (
              <p className="text-gray-700">
                Qualification: {profile.educational_qualification}
              </p>
            )}
            {profile.institutions && (
              <p className="text-gray-700">Institution: {profile.institutions}</p>
            )}
          </div>
        )}

        {/* Date of Birth */}
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
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getPreview(project.details)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Back button */}
        <div className="hidden md:flex justify-end mt-8">
          <Link
            href="/dashboard/applicant"
            className="px-6 py-3 rounded-xl bg-black text-white font-medium shadow hover:bg-orange-600 transition"
          >
            Go Back to Dashboard
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
