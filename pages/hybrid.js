import { useEffect, useState } from 'react';
import { List, Grid3x3, Search } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import JobCard from '../components/JobCard';
import MobileHeader from '../components/MobileHeader';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Hybrid() {
  const [jobs, setJobs] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchHybridJobs = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .ilike('category', '%hybrid%');

      if (error) {
        console.error('Error fetching hybrid jobs:', error);
      } else {
        setJobs(data);
      }
    };

    fetchHybridJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const title = job.title?.toLowerCase() || '';
    const company = job.company || 'Unknown';
    const tags = job.tags || [];

    const matchesSearch =
      title.includes(search.toLowerCase()) ||
      company.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || tags.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const categories = [
    'All',
    'Agile',
    'Leadership',
    'SEO',
    'Strategy',
    'Sales',
    'Office',
    'Logistics',
  ];

  return (
    <div className="relative">
      {/* Sticky mobile header */}
      <div className="md:hidden sticky top-0 z-50 bg-white border-b">
        <MobileHeader />
      </div>

      <div className="pt-4 md:pt-24 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Hybrid Jobs</h1>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            {viewMode === 'grid' ? <List size={18} /> : <Grid3x3 size={18} />}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-1.5 pl-8 pr-3 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <Search className="absolute left-2 top-2 text-gray-400" size={16} />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-sm rounded-full border ${
                selectedCategory === category
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-700 border-gray-300'
              } hover:bg-orange-100 transition`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Job Grid/List */}
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 gap-4'
              : 'space-y-4'
          }
        >
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={{
                id: job.id,
                title: job.title,
                location: job.location,
                type: job.type,
                pay: `${job.price_range || '₦0'} / ${job.price_frequency || 'monthly'}`,
                company: job.company || 'Unknown',
                tags: job.tags || [],
                description:
                  job.description ||
                  'This hybrid role offers both flexibility and in-person collaboration.',
              }}
              viewMode={viewMode}
            />
          ))}
        </div>

        {/* No Jobs */}
        {filteredJobs.length === 0 && (
          <p className="mt-10 text-sm text-center text-gray-500">
            No hybrid jobs found.
          </p>
        )}
      </div>
    </div>
  );
}
