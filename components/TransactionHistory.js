"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../utils/supabaseClient";
import { History, ArrowUpRight, ArrowDownLeft, Calendar, Filter } from "lucide-react";

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [filter, setFilter] = useState("all"); // "all", "in", "out"

  useEffect(() => {
    fetchUserAndTransactions();
  }, []);

  const fetchUserAndTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchTransactions(user.id);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchTransactions = async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("token_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
        return;
      }

      setTransactions(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDateFull = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === "in") return transaction.tokens_in > 0;
    if (filter === "out") return transaction.tokens_out > 0;
    return true;
  });

  const getTransactionType = (transaction) => {
    if (transaction.tokens_in > 0) return "credit";
    if (transaction.tokens_out > 0) return "debit";
    return "other";
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-black rounded-2xl shadow-lg border border-gray-800 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-yellow-400 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black rounded-2xl shadow-lg border border-gray-800 p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-400 rounded-xl">
              <History className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Transaction History</h2>
              <p className="text-sm text-gray-400">Your token transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-900 text-white text-sm rounded-lg px-3 py-1 border border-gray-700 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
            >
              <option value="all">All</option>
              <option value="in">Token In</option>
              <option value="out">Token Out</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Transactions List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredTransactions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-black rounded-2xl shadow-lg border border-gray-800 p-8 text-center"
            >
              <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Transactions</h3>
              <p className="text-gray-400">You haven't made any transactions yet.</p>
            </motion.div>
          ) : (
            filteredTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-black rounded-2xl shadow-lg border border-gray-800 p-4 hover:border-yellow-400 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  {/* Transaction Details */}
                  <div className="flex items-center gap-3 flex-1">
                    {/* Icon */}
                    <div className={`
                      p-3 rounded-xl flex items-center justify-center
                      ${getTransactionType(transaction) === 'credit' 
                        ? 'bg-green-900/20 border border-green-800' 
                        : 'bg-red-900/20 border border-red-800'
                      }
                    `}>
                      {getTransactionType(transaction) === 'credit' ? (
                        <ArrowDownLeft className="w-5 h-5 text-green-400" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-400" />
                      )}
                    </div>

                    {/* Description and Date */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {transaction.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <p className="text-xs text-gray-400">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    {transaction.tokens_in > 0 ? (
                      <div className="space-y-1">
                        <p className="text-green-400 font-bold text-lg">
                          +{transaction.tokens_in}
                        </p>
                        <p className="text-xs text-gray-400">Tokens</p>
                      </div>
                    ) : transaction.tokens_out > 0 ? (
                      <div className="space-y-1">
                        <p className="text-red-400 font-bold text-lg">
                          -{transaction.tokens_out}
                        </p>
                        <p className="text-xs text-gray-400">Tokens</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-gray-400 font-bold text-lg">-</p>
                        <p className="text-xs text-gray-400">Tokens</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Full Date on Hover (Desktop) */}
                <div className="mt-3 pt-3 border-t border-gray-800 hidden group-hover:block">
                  <p className="text-xs text-gray-500">
                    {formatDateFull(transaction.created_at)}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Summary */}
      {filteredTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-black rounded-2xl shadow-lg border border-gray-800 p-4"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-400">Token In</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span className="text-gray-400">Token Out</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}