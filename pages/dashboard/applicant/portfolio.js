'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Plus } from 'lucide-react';
import PortfolioCard from '../../../components/portfolio/PortfolioCard';
import PortfolioModal from '../../../components/portfolio/PortfolioModal';
import EmptyState from '../../../components/portfolio/EmptyState';
import ApplicantLayout from '../../../components/dashboard/ApplicantLayout';

export default function ApplicantPortfolioPage() {
  const [portfolios, setPortfolios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  const fetchUser = useCallback(async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      return null;
    }
    return session?.user || null;
  }, []);

  const fetchPortfolios = useCallback(
    async (userId) => {
      if (!userId) return;
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching portfolios:', fetchError);
        setError('Could not load portfolios.');
      } else {
        setPortfolios(data || []);
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    const init = async () => {
      const u = await fetchUser();
      if (u) {
        setUser(u);
        await fetchPortfolios(u.id);
      }
    };
    init();
  }, [fetchUser, fetchPortfolios]);

  const openNew = () => {
    setSelectedPortfolio(null);
    setShowModal(true);
  };

  const openEdit = (portfolio) => {
    setSelectedPortfolio(portfolio);
    setShowModal(true);
  };

  const handleDelete = async (portfolioId) => {
    if (!portfolioId) return;
    if (!confirm('Are you sure you want to delete this portfolio?')) return;
    try {
      const { error: delError } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', portfolioId);
      if (delError) {
        console.error('Delete failed:', delError);
        return;
      }
      // refresh
      if (user?.id) await fetchPortfolios(user.id);
    } catch (err) {
      console.error('Unexpected delete error:', err);
    }
  };

  return (
    <ApplicantLayout>
      <div className="flex justify-between items-center mb-6 pt-0 lg:pt-20">
        <h2 className="text-2xl font-bold text-black">My Portfolios</h2>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full hover:bg-orange-600 transition"
        >
          <Plus size={18} /> New Portfolio
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading portfolios...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : portfolios.length === 0 ? (
        <EmptyState
          title="No portfolios yet"
          message="Start showcasing your work by creating your first portfolio."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => (
            <PortfolioCard
              key={portfolio.id}
              portfolio={portfolio}
              isOwner={true}
              onView={(p) => openEdit(p)}
              onEdit={(p) => openEdit(p)}
              onDelete={(id) => handleDelete(id)}
            />
          ))}
        </div>
      )}

      <PortfolioModal
        open={showModal}
        setOpen={setShowModal}
        portfolio={selectedPortfolio}
        onSuccess={async () => {
          if (user?.id) {
            await fetchPortfolios(user.id);
          }
          setShowModal(false);
        }}
      />
    </ApplicantLayout>
  );
}
