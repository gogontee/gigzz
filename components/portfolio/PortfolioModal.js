// components/portfolio/PortfolioModal.js
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

// ⬇️ If your file is named `emptyState.js` (lowercase e), change this to: './emptyState'
import EmptyState from './EmptyState';
import PortfolioCard from './PortfolioCard';

export default function PortfolioModal({ onClose }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('User not found:', userError);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
      } else {
        const mapped = (data || []).map((p) => ({
          id: p.id,
          title: p.title,
          details: p.details,
          profile: p.profile, // image/banner
        }));
        setProjects(mapped);
      }

      setLoading(false);
    };

    fetchProjects();
  }, []);

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base md:text-lg font-semibold">My Projects</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-black text-lg"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading projects...</p>
      ) : projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {projects.map((project) => (
            <PortfolioCard key={project.id} projectData={project} />
          ))}
        </div>
      )}
    </div>
  );
}
