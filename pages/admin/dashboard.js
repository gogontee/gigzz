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
  const [isMobile, setIsMobile] = useState(false);
  
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

  // User IDs and share percentages
  const PHILIP_USER_ID = '9d83be2a-de87-4387-87e9-a0e52103a914';
  const PHILIP_SHARE_PERCENTAGE = 20;
  const SIMEON_USER_ID = 'a4509ac3-5f77-48f9-b65c-69c1de21c7fe';
  const SIMEON_SHARE_PERCENTAGE = 80;

  // SIMPLE AUTHORIZATION CHECK - FIXED VERSION
  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log('No user found, redirecting to login');
          router.push('/auth/login');
          return;
        }

        setUser(user);
        console.log('User found:', user.id);

        // SIMPLE CHECK: If user is Philip or Jerry, allow access immediately
        if (user.id === PHILIP_USER_ID || user.id === SIMEON_USER_ID) {
          console.log('Hardcoded director - granting access');
          setIsAuthorized(true);
          loadAllData();
          setLoading(false);
          return;
        }

        // For other users, check directors table with PROPER error handling
        console.log('Checking directors table for user:', user.id);
        const { data: director, error: directorError } = await supabase
          .from('directors')
          .select('user_id')
          .eq('user_id', user.id)
          .eq('code', 'gigzz_1234$')
          .maybeSingle();

        if (directorError) {
          console.log('Directors query error:', directorError);
          setIsAuthorized(false);
        } else if (director) {
          console.log('Director found - granting access');
          setIsAuthorized(true);
          loadAllData();
        } else {
          console.log('No director record found');
          setIsAuthorized(false);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Authorization error:', error);
        setIsAuthorized(false);
        setLoading(false);
      }
    };

    // Check screen size
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    checkAuthorization();

    return () => window.removeEventListener('resize', checkScreenSize);
  }, [router]);

  const loadAllData = useCallback(async () => {
    try {
      console.log('Loading all data...');
      
      // Load ALL token transactions with tokens_in values
      const { data: transactions, error: transactionsError } = await supabase
        .from('token_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (transactionsError) {
        console.error('Error loading transactions:', transactionsError);
        // Continue with empty array instead of returning
        setTokenTransactions([]);
      } else {
        setTokenTransactions(transactions || []);
      }

      // Load applicants
      const { data: applicantsData, error: applicantsError } = await supabase
        .from('applicants')
        .select('*')
        .order('created_at', { ascending: false });

      if (applicantsError) {
        console.error('Error loading applicants:', applicantsError);
        setApplicants([]);
      } else {
        setApplicants(applicantsData || []);
      }

      // Load employers
      const { data: employersData, error: employersError } = await supabase
        .from('employers')
        .select('*')
        .order('created_at', { ascending: false });

      if (employersError) {
        console.error('Error loading employers:', employersError);
        setEmployers([]);
      } else {
        setEmployers(employersData || []);
      }

      // Process transactions with user names - SIMPLIFIED VERSION
      if (transactions && transactions.length > 0) {
        const processedTransactions = await Promise.all(
          transactions.map(async (transaction) => {
            let userName = 'Unknown User';
            
            try {
              // Check applicants table
              const { data: applicant } = await supabase
                .from('applicants')
                .select('full_name')
                .eq('id', transaction.user_id)
                .maybeSingle();

              if (applicant?.full_name) {
                userName = applicant.full_name;
              } else {
                // Check employers table
                const { data: employer } = await supabase
                  .from('employers')
                  .select('name')
                  .eq('id', transaction.user_id)
                  .maybeSingle();

                if (employer?.name) {
                  userName = employer.name;
                }
              }
            } catch (error) {
              console.error('Error fetching user name:', error);
            }

            return {
              ...transaction,
              user_name: userName,
              monetary_value: (transaction.tokens_in || 0) * 250
            };
          })
        );

        setTokenTransactions(processedTransactions);
        
        // Calculate weekly data and stats
        calculateWeeklyData(processedTransactions);
        calculateStats(processedTransactions, applicantsData || [], employersData || []);
      } else {
        // If no transactions, set empty data
        setWeeklyData([]);
        setStats({
          totalRevenue: 0,
          totalTokens: 0,
          totalUsers: (applicantsData?.length || 0) + (employersData?.length || 0),
          weeklyGrowth: 0
        });
      }

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
        t.created_at && t.created_at.split('T')[0] === date
      );
      
      const revenue = dayTransactions.reduce((sum, t) => sum + ((t.tokens_in || 0) * 250), 0);
      const tokens = dayTransactions.reduce((sum, t) => sum + (t.tokens_in || 0), 0);
      
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
    const totalTokens = transactions.reduce((sum, t) => sum + (t.tokens_in || 0), 0);
    const totalRevenue = totalTokens * 250;
    const totalUsers = (applicants?.length || 0) + (employers?.length || 0);
    const thisWeekRevenue = totalRevenue;
    const lastWeekRevenue = totalRevenue * 0.8;
    const weeklyGrowth = lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

    setStats({
      totalRevenue,
      totalTokens,
      totalUsers,
      weeklyGrowth
    });
  };

  // Calculate user shares based on user ID
  const calculateUserShares = () => {
    let userSharePercentage = 0;
    let userName = 'User';

    if (user?.id === PHILIP_USER_ID) {
      userSharePercentage = PHILIP_SHARE_PERCENTAGE;
      userName = 'Philip';
    } else if (user?.id === SIMEON_USER_ID) {
      userSharePercentage = SIMEON_SHARE_PERCENTAGE;
      userName = 'Simeon';
    }

    const userShareAmount = (stats.totalRevenue * userSharePercentage) / 100;
    
    return {
      userName,
      percentage: userSharePercentage,
      amount: userShareAmount,
      formattedAmount: `₦${userShareAmount.toLocaleString()}`,
      totalRevenue: stats.totalRevenue,
      formattedTotalRevenue: `₦${stats.totalRevenue.toLocaleString()}`,
      totalTokens: stats.totalTokens
    };
  };

  const sharesData = calculateUserShares();

  const StatCard = ({ title, value, subtitle, icon }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl p-4 ${isMobile ? 'p-3' : 'p-6'} shadow-lg border border-gray-100 hover:shadow-md transition-shadow duration-200`}
    >
      <div className="flex items-center justify-between">
        <div className={`${isMobile ? 'flex-1' : ''}`}>
          <p className={`text-gray-600 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>{title}</p>
          <p className={`font-bold text-gray-900 ${isMobile ? 'text-lg' : 'text-2xl'}`}>{value}</p>
          {subtitle && (
            <p className={`text-gray-500 mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`text-orange-500 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  const SharesModal = () => {
    const [customTokens, setCustomTokens] = useState(sharesData.totalTokens);
    const [customRevenue, setCustomRevenue] = useState(customTokens * 250);
    const [customShare, setCustomShare] = useState((customRevenue * sharesData.percentage) / 100);

    useEffect(() => {
      const newRevenue = customTokens * 250;
      const newShare = (newRevenue * sharesData.percentage) / 100;
      setCustomRevenue(newRevenue);
      setCustomShare(newShare);
    }, [customTokens, sharesData.percentage]);

    return (
      <AnimatePresence>
        {sharesModalOpen && (user?.id === PHILIP_USER_ID || user?.id === SIMEON_USER_ID) && (
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
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col"
            >
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-2xl p-6 text-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{sharesData.userName}'s Shares</h2>
                    <p className="text-orange-100 mt-1">Revenue Distribution</p>
                  </div>
                  <div className="text-3xl">👑</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {sharesData.formattedAmount}
                    </div>
                    <p className="text-gray-600">Your {sharesData.percentage}% Share of Total Revenue</p>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 text-xl">👑</span>
                      </div>
                      <div>
                        <p className="font-semibold text-orange-900">Hello {sharesData.userName}!</p>
                        <p className="text-sm text-orange-700">
                          As a key partner, you receive {sharesData.percentage}% of all platform revenue.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Calculation Breakdown:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Tokens Purchased:</span>
                        <span className="font-semibold">{sharesData.totalTokens.toLocaleString()} tokens</span>
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
                        <span className="text-gray-600">Your Share ({sharesData.percentage}%):</span>
                        <span className="font-semibold text-green-600">{sharesData.formattedAmount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Platform Revenue ({100 - sharesData.percentage}%)</span>
                      <span>Your Share ({sharesData.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 flex overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${100 - sharesData.percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="bg-gray-400 h-4"
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${sharesData.percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                        className="bg-orange-500 h-4"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{100 - sharesData.percentage}% Platform</span>
                      <span>{sharesData.percentage}% {sharesData.userName}'s Share</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <div className="text-blue-500 text-lg">📊</div>
                      <div className="flex-1">
                        <p className="text-sm text-blue-800 font-medium mb-3">
                          Real-time Calculation Tool
                        </p>
                        
                        <div className="mb-3">
                          <label className="block text-xs text-blue-700 mb-1">
                            Enter token amount to calculate:
                          </label>
                          <input
                            type="number"
                            value={customTokens}
                            onChange={(e) => setCustomTokens(Number(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter token amount"
                          />
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-blue-600">Tokens:</span>
                            <span className="font-semibold">{customTokens.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-600">Revenue:</span>
                            <span className="font-semibold">₦{customRevenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-t border-blue-200 pt-1">
                            <span className="text-blue-600">Your Share ({sharesData.percentage}%):</span>
                            <span className="font-semibold text-green-600">₦{customShare.toLocaleString()}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setCustomTokens(sharesData.totalTokens)}
                          className="mt-3 w-full bg-blue-500 text-white py-2 rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors duration-200"
                        >
                          Reset to Actual Tokens
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 p-4 flex-shrink-0">
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
  };

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
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-sm border-b border-gray-200 pt-4 md:pt-20"
        >
          
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <div className="flex justify-between items-center py-4">
    <div className="flex items-center space-x-3">
      <h1 className="text-lg md:text-xl font-bold text-gray-900">Gigzz Director</h1>
    </div>
    <div className="flex items-center space-x-4">
      <div className="text-xs md:text-sm text-gray-600">
        Welcome, {user?.email}
      </div>
      {(user?.id === PHILIP_USER_ID || user?.id === SIMEON_USER_ID) && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSharesModalOpen(true)}
          className="bg-orange-500 text-white px-4 py-1.5 md:px-6 md:py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors duration-200 shadow-md flex items-center space-x-2 text-sm md:text-base"
        >
          <span className="text-sm md:text-base">👑</span>
          <span>My Shares</span>
        </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.header>

        <main className={`max-w-7xl mx-auto ${isMobile ? 'px-3' : 'px-4 sm:px-6 lg:px-8'} ${isMobile ? 'py-4' : 'py-8'}`}>
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`grid gap-4 mb-6 ${
              isMobile 
                ? 'grid-cols-2' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
            }`}
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

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`gap-6 mb-8 ${
              isMobile 
                ? 'grid grid-cols-1' 
                : 'grid grid-cols-1 lg:grid-cols-2'
            }`}
          >
            <div className={`bg-white rounded-xl p-4 shadow-lg border border-gray-100 ${
              isMobile ? 'p-3' : 'p-6'
            }`}>
              <h3 className={`font-semibold mb-4 ${
                isMobile ? 'text-base' : 'text-lg'
              }`}>Weekly Revenue (₦)</h3>
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={isMobile ? 10 : 12} />
                  <YAxis fontSize={isMobile ? 10 : 12} />
                  <Tooltip formatter={(value) => [`₦${value.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={`bg-white rounded-xl p-4 shadow-lg border border-gray-100 ${
              isMobile ? 'p-3' : 'p-6'
            }`}>
              <h3 className={`font-semibold mb-4 ${
                isMobile ? 'text-base' : 'text-lg'
              }`}>Weekly Token Distribution</h3>
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={isMobile ? 10 : 12} />
                  <YAxis fontSize={isMobile ? 10 : 12} />
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

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8"
          >
            <div className="p-4 border-b border-gray-200">
              <h3 className={`font-semibold ${
                isMobile ? 'text-base' : 'text-lg'
              }`}>Token Transactions (All Top-ups)</h3>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className={`text-left font-medium text-gray-500 uppercase tracking-wider ${
                      isMobile ? 'px-3 py-2 text-xs' : 'px-6 py-3 text-xs'
                    }`}>ID</th>
                    <th className={`text-left font-medium text-gray-500 uppercase tracking-wider ${
                      isMobile ? 'px-3 py-2 text-xs' : 'px-6 py-3 text-xs'
                    }`}>User</th>
                    <th className={`text-left font-medium text-gray-500 uppercase tracking-wider ${
                      isMobile ? 'px-3 py-2 text-xs' : 'px-6 py-3 text-xs'
                    }`}>Tokens</th>
                    <th className={`text-left font-medium text-gray-500 uppercase tracking-wider ${
                      isMobile ? 'px-3 py-2 text-xs' : 'px-6 py-3 text-xs'
                    }`}>Value (₦)</th>
                    <th className={`text-left font-medium text-gray-500 uppercase tracking-wider ${
                      isMobile ? 'px-3 py-2 text-xs' : 'px-6 py-3 text-xs'
                    }`}>Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tokenTransactions.map((transaction, index) => (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className={`text-gray-900 ${
                        isMobile ? 'px-3 py-2 text-xs' : 'px-6 py-4 text-sm'
                      }`}>
                        <span className="truncate max-w-[80px] block">
                          {transaction.id}
                        </span>
                      </td>
                      <td className={`text-gray-900 ${
                        isMobile ? 'px-3 py-2 text-xs' : 'px-6 py-4 text-sm'
                      }`}>
                        <span className="truncate max-w-[100px] block">
                          {transaction.user_name}
                        </span>
                      </td>
                      <td className={`text-gray-900 ${
                        isMobile ? 'px-3 py-2 text-xs' : 'px-6 py-4 text-sm'
                      }`}>
                        {transaction.tokens_in || 0}
                      </td>
                      <td className={`text-gray-900 ${
                        isMobile ? 'px-3 py-2 text-xs' : 'px-6 py-4 text-sm'
                      }`}>
                        ₦{((transaction.tokens_in || 0) * 250).toLocaleString()}
                      </td>
                      <td className={`text-gray-500 ${
                        isMobile ? 'px-3 py-2 text-xs' : 'px-6 py-4 text-sm'
                      }`}>
                        {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`gap-6 ${
              isMobile 
                ? 'grid grid-cols-1' 
                : 'grid grid-cols-1 lg:grid-cols-2 gap-8'
            }`}
          >
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="p-4 border-b border-gray-200">
                <h3 className={`font-semibold ${
                  isMobile ? 'text-base' : 'text-lg'
                }`}>Creatives ({applicants.length})</h3>
              </div>
              <div className="overflow-y-auto max-h-96">
                {applicants.map((applicant, index) => (
                  <motion.div
                    key={applicant.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={applicant.avatar_url || "https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/icon.png"}
                        alt={applicant.full_name}
                        className={`rounded-full object-cover ${
                          isMobile ? 'w-8 h-8' : 'w-10 h-10'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-gray-900 truncate ${
                          isMobile ? 'text-sm' : 'text-sm'
                        }`}>
                          {applicant.full_name}
                        </p>
                        <p className={`text-gray-500 truncate ${
                          isMobile ? 'text-xs' : 'text-sm'
                        }`}>
                          {applicant.specialties}
                        </p>
                        <p className={`text-gray-400 ${
                          isMobile ? 'text-xs' : 'text-xs'
                        }`}>
                          {[applicant.city, applicant.state, applicant.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <div className={`text-gray-500 ${
                        isMobile ? 'text-xs' : 'text-xs'
                      }`}>
                        {applicant.created_at ? new Date(applicant.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="p-4 border-b border-gray-200">
                <h3 className={`font-semibold ${
                  isMobile ? 'text-base' : 'text-lg'
                }`}>Clients ({employers.length})</h3>
              </div>
              <div className="overflow-y-auto max-h-96">
                {employers.map((employer, index) => (
                  <motion.div
                    key={employer.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={employer.avatar || "https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/icon.png"}
                        alt={employer.name}
                        className={`rounded-full object-cover ${
                          isMobile ? 'w-8 h-8' : 'w-10 h-10'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-gray-900 truncate ${
                          isMobile ? 'text-sm' : 'text-sm'
                        }`}>
                          {employer.name}
                        </p>
                        <p className={`text-gray-500 truncate ${
                          isMobile ? 'text-xs' : 'text-sm'
                        }`}>
                          {employer.company}
                        </p>
                        <p className={`text-gray-400 truncate ${
                          isMobile ? 'text-xs' : 'text-xs'
                        }`}>
                          {employer.full_address}
                        </p>
                      </div>
                      <div className={`text-gray-500 ${
                        isMobile ? 'text-xs' : 'text-xs'
                      }`}>
                        {employer.created_at ? new Date(employer.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        </main>

        <SharesModal />
      </div>
    </>
  );
}