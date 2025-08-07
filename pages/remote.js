import { useEffect, useState } from 'react';
import { List, Grid3x3, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import JobCard from '../components/JobCard';
import MobileHeader from '../components/MobileHeader';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const categories = [
  'All',
  'Frontend',
  'Backend',
  'Design',
  'DevOps',
  'Writing',
  'Marketing',
  'Product',
];

export default function Remote() {
  const [jobs, setJobs] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetchRemoteJobs();
  }, []);

  const fetchRemoteJobs = async () => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .ilike('category', '%remote%')  // checks 'category' not 'location'
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching remote jobs:', error);
  } else {
    setJobs(data);
  }
};

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === 'All'
        ? true
        : job.tags?.some((tag) =>
            tag.toLowerCase().includes(activeCategory.toLowerCase())
          );

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      {/* Header */}
      <div className="md:hidden sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-gray-200">
        <MobileHeader />
      </div>

      <div className="pt-4 md:pt-24 px-4 max-w-6xl mx-auto">
        {/* Top Controls */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-extrabold text-black">Remote Jobs</h1>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 rounded-full bg-gray-100 hover:bg-orange-100 transition"
          >
            {viewMode === 'grid' ? <List size={18} /> : <Grid3x3 size={18} />}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <input
            type="text"
            placeholder="Search job titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2 pl-10 pr-3 rounded-lg text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>

        {/* Category Tabs */}
        <div className="overflow-x-auto no-scrollbar mb-6">
          <div className="flex gap-3">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <motion.button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-1.5 whitespace-nowrap rounded-full text-sm font-medium transition ${
                    isActive
                      ? 'bg-orange-500 text-white shadow'
                      : 'bg-white text-black hover:bg-orange-100'
                  }`}
                >
                  {cat}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Job Cards */}
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 gap-4'
              : 'space-y-4'
          }
        >
          <AnimatePresence>
            {filteredJobs.map((job) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <JobCard
                  job={{
                    id: job.id,
                    title: job.title,
                    location: job.location,
                    type: job.type,
                    pay: `${job.price_range} / ${job.price_frequency}`,
                    tags: job.tags || [],
                    description: job.description || '',
                  }}
                  viewMode={viewMode}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* No Jobs */}
        {filteredJobs.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 text-sm text-center text-gray-500"
          >
            No jobs found.
          </motion.p>
        )}
      </div>
    </>
  );
}
