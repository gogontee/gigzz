// pages/admin/dashboard.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { motion, AnimatePresence } from 'framer-motion';
import Head from 'next/head';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const supabase = createPagesBrowserClient();

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sharesModalOpen, setSharesModalOpen] = useState(false);
  
  // Data states
  const [tokenTransactions, setTokenTransactions] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTokens: 0,
    totalUsers: 0,
    weeklyGrowth: 0
  });

  // Check authorization
  useEffect(() => {
    const checkAuthorization = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);

      // Check if user is director
      const { data: director } = await supabase
        .from('directors')
        .select('*')
        .eq('user_id', user.id)
        .eq('code', 'gigzz_1234$')
        .single();

      if (director) {
        setIsAuthorized(true);
        loadAllData();
      } else {
        setIsAuthorized(false);
      }
      
      setLoading(false);
    };

    checkAuthorization();
  }, [router]);

  const loadAllData = useCallback(async () => {
    try {
      // Load token transactions
      const { data: transactions } = await supabase
        .from('token_transactions')
        .select('*')
        .or('description.eq.Top up from paystack,description.eq.top up from paystack')
        .order('created_at', { ascending: false });

      // Load applicants
      const { data: applicantsData } = await supabase
        .from('applicants')
        .select('*')
        .order('created_at', { ascending: false });

      // Load employers
      const { data: employersData } = await supabase
        .from('employers')
        .select('*')
        .order('created_at', { ascending: false });

      // Process transactions with user names
      const processedTransactions = await Promise.all(
        (transactions || []).map(async (transaction) => {
          let userName = 'Unknown User';
          
          // Check applicants table
          const { data: applicant } = await supabase
            .from('applicants')
            .select('full_name')
            .eq('id', transaction.user_id)
            .single();

          if (applicant?.full_name) {
            userName = applicant.full_name;
          } else {
            // Check employers table
            const { data: employer } = await supabase
              .from('employers')
              .select('name')
              .eq('id', transaction.user_id)
              .single();

            if (employer?.name) {
              userName = employer.name;
            }
          }

          return {
            ...transaction,
            user_name: userName
          };
        })
      );

      setTokenTransactions(processedTransactions);
      setApplicants(applicantsData || []);
      setEmployers(employersData || []);

      // Calculate weekly data
      calculateWeeklyData(processedTransactions);
      calculateStats(processedTransactions, applicantsData, employersData);

    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  const calculateWeeklyData = (transactions) => {
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailyData = last7Days.map(date => {
      const dayTransactions = transactions.filter(t => 
        t.created_at.split('T')[0] === date
      );
      
      // Calculate revenue from token_in (1 token = ₦250)
      const revenue = dayTransactions.reduce((sum, t) => sum + (t.token_in * 250), 0);
      const tokens = dayTransactions.reduce((sum, t) => sum + t.token_in, 0);
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue,
        tokens,
        transactions: dayTransactions.length
      };
    });

    setWeeklyData(dailyData);
  };

  const calculateStats = (transactions, applicants, employers) => {
    // Calculate total tokens from ALL token_transactions.token_in
    const totalTokens = transactions.reduce((sum, t) => sum + t.token_in, 0);
    
    // Calculate total revenue: total tokens * ₦250
    const totalRevenue = totalTokens * 250;
    
    const totalUsers = (applicants?.length || 0) + (employers?.length || 0);
    
    // Calculate weekly growth (simplified)
    const thisWeekRevenue = totalRevenue;
    const lastWeekRevenue = totalRevenue * 0.8; // Mock data for demo
    const weeklyGrowth = ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100;

    setStats({
      totalRevenue,
      totalTokens,
      totalUsers,
      weeklyGrowth
    });
  };

  // Calculate user shares (20% of total revenue)
  const calculateUserShares = () => {
    const userSharePercentage = 20;
    const userShareAmount = (stats.totalRevenue * userSharePercentage) / 100;
    
    return {
      percentage: userSharePercentage,
      amount: userShareAmount,
      formattedAmount: `₦${userShareAmount.toLocaleString()}`,
      totalRevenue: stats.totalRevenue,
      formattedTotalRevenue: `₦${stats.totalRevenue.toLocaleString()}`
    };
  };

  const sharesData = calculateUserShares();

  const StatCard = ({ title, value, subtitle, icon }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="text-3xl text-orange-500">
          {icon}
        </div>
      </div>
    </motion.div>
  );

  const SharesModal = () => (
    <AnimatePresence>
      {sharesModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">My Shares</h2>
                  <p className="text-orange-100 mt-1">Revenue Distribution</p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Share Calculation */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {sharesData.formattedAmount}
                </div>
                <p className="text-gray-600">Your 20% Share of Total Revenue</p>
              </div>

              {/* Calculation Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Calculation Breakdown:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Tokens Purchased:</span>
                    <span className="font-semibold">{stats.totalTokens.toLocaleString()} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Token Value:</span>
                    <span className="font-semibold">₦250 per token</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <span className="text-gray-600">Total Revenue:</span>
                    <span className="font-semibold">{sharesData.formattedTotalRevenue}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <span className="text-gray-600">Your Share (20%):</span>
                    <span className="font-semibold text-green-600">{sharesData.formattedAmount}</span>
                  </div>
                </div>
              </div>

              {/* Progress Visualization */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Platform Revenue</span>
                  <span>Your Share (20%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 flex overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '80%' }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-gray-400 h-4"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '20%' }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                    className="bg-orange-500 h-4"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>80% Platform</span>
                  <span>20% Your Share</span>
                </div>
              </div>

              {/* Example Calculation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-blue-500 text-lg">📊</div>
                  <div>
                    <p className="text-sm text-blue-800 font-medium">
                      Real-time Calculation Example
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Total Revenue: {sharesData.formattedTotalRevenue} × 20% = {sharesData.formattedAmount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={() => setSharesModalOpen(false)}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-black transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - Gigzz</title>
        <meta name="description" content="Gigzz Admin Dashboard" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-sm border-b border-gray-200"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <img
                  src="https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/icon.png"
                  alt="Gigzz Logo"
                  className="w-8 h-8"
                />
                <h1 className="text-xl font-bold text-gray-900">Gigzz Admin</h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Welcome, {user?.email}
                </div>
                {/* My Shares Button - Only show for specific user ID */}
                {user?.id === '1552cf64-4004-404e-ba4a-8b1dd8fd5923' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSharesModalOpen(true)}
                    className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors duration-200 shadow-md flex items-center space-x-2"
                  >
                    <span>💰</span>
                    <span>My Shares</span>
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <StatCard
              title="Total Revenue"
              value={`₦${stats.totalRevenue.toLocaleString()}`}
              subtitle={`From ${stats.totalTokens.toLocaleString()} tokens`}
              icon="💰"
            />
            <StatCard
              title="Total Tokens"
              value={stats.totalTokens.toLocaleString()}
              subtitle="Total tokens purchased"
              icon="🪙"
            />
            <StatCard
              title="Total Users"
              value={stats.totalUsers.toLocaleString()}
              subtitle="Platform users"
              icon="👥"
            />
            <StatCard
              title="Weekly Growth"
              value={`${stats.weeklyGrowth.toFixed(1)}%`}
              subtitle="Revenue growth"
              icon="📈"
            />
          </motion.section>

          {/* Charts Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          >
            {/* Revenue Chart */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">Weekly Revenue (₦)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₦${value.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tokens Chart */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">Weekly Token Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="tokens" 
                    stroke="#f97316" 
                    strokeWidth={3}
                    dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

          {/* Token Transactions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Token Transactions (PayStack Top-ups)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value (₦)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tokenTransactions.map((transaction, index) => (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.user_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.token_in}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₦{(transaction.token_in * 250).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* Users Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Applicants */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Creatives ({applicants.length})</h3>
              </div>
              <div className="overflow-y-auto max-h-96">
                {applicants.map((applicant, index) => (
                  <motion.div
                    key={applicant.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={applicant.avatar_url || "https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/icon.png"}
                        alt={applicant.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {applicant.full_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {applicant.specialties}
                        </p>
                        <p className="text-xs text-gray-400">
                          {[applicant.city, applicant.state, applicant.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(applicant.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Employers */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Clients ({employers.length})</h3>
              </div>
              <div className="overflow-y-auto max-h-96">
                {employers.map((employer, index) => (
                  <motion.div
                    key={employer.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={employer.avatar || "https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/icon.png"}
                        alt={employer.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {employer.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {employer.company}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {employer.full_address}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(employer.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        </main>

        {/* My Shares Modal */}
        <SharesModal />
      </div>
    </>
  );
}