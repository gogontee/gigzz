// pages/dashboard/profile.js
'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import PortfolioCard from '../components/portfolio/PortfolioCard';
import PortfolioModal from '../components/portfolio/PortfolioModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [portfolios, setPortfolios] = useState([]);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);

  const loadProfileAndPortfolios = useCallback(async () => {
    setLoading(true);

    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !authUser) {
      setLoading(false);
      return;
    }
    setUser(authUser);

    // Get role
    const { data: userMeta, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();
    const role = userMeta?.role;

    const table = role === 'employer' ? 'employers' : 'applicants';

    const { data: profileData, error: profileError } = await supabase
      .from(table)
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!profileError) {
      setProfile({ ...profileData, role });
    }

    // Fetch portfolios owned by this user
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false });

    if (!portfolioError) {
      setPortfolios(portfolioData || []);
    } else {
      console.error('Error fetching portfolios:', portfolioError);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfileAndPortfolios();
  }, [loadProfileAndPortfolios]);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center text-red-500">Profile not found</div>
    );
  }

  const handleViewPortfolio = (p) => {
    setSelectedPortfolio(p);
    setShowPortfolioModal(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto px-4 py-6"
      >
        {/* Header card */}
        <div className="bg-gradient-to-r from-indigo-600 to-orange-500 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row gap-6 lg:mt-20">
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
            {profile.bio && (
              <p className="mt-3 text-sm max-w-prose">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Portfolios section */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Portfolios</h2>
          </div>

          {portfolios.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-2xl p-8 text-center">
              <p className="text-gray-600 mb-2">No portfolios to show.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {portfolios.map((p) => (
                <PortfolioCard
                  key={p.id}
                  portfolio={p}
                  isOwner={false}
                  onView={(portfolio) => handleViewPortfolio(portfolio)}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {selectedPortfolio && (
        <PortfolioModal
          open={showPortfolioModal}
          setOpen={setShowPortfolioModal}
          portfolio={selectedPortfolio}
          onSuccess={() => {
            setShowPortfolioModal(false);
          }}
        />
      )}
    </>
  );
}
