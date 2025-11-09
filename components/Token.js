'use client';

import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useUser, useSessionContext } from "@supabase/auth-helpers-react";

export default function Token() {
  const { isLoading } = useSessionContext();
  const user = useUser();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  const userId = user?.id || null;
  const email = user?.email || null;

  // ---------------- Fetch Wallet ----------------
  const fetchBalance = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("token_wallets")
        .select("balance, user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching wallet:", error.message);
        setBalance(0);
        return;
      }

      if (!data) {
        const { data: inserted, error: insertError } = await supabase
          .from("token_wallets")
          .insert([{ user_id: userId, balance: 0 }])
          .select()
          .single();

        if (insertError) {
          console.error("Error creating wallet:", insertError.message);
          setBalance(0);
        } else {
          setBalance(inserted.balance ?? 0);
        }
      } else {
        setBalance(data.balance ?? 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("token_transactions")
      .select("id, created_at, description, tokens_in, tokens_out")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error.message);
    } else {
      setTransactions(data || []);
    }
  };

  // Check for successful payment and redirect
  useEffect(() => {
    const checkPaymentAndRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get('reference');
      const trxref = urlParams.get('trxref');
      
      if (reference || trxref) {
        setAlertMsg("✅ Payment successful! Tokens will be added shortly...");
        
        try {
          // Wait a moment for webhook to process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Refresh balance to show updated tokens
          await fetchBalance();
          await fetchTransactions();
          
          // Get user role from database
          const { data: userData, error } = await supabase
            .from("users")
            .select("role")
            .eq("id", userId)
            .single();

          if (error) {
            console.error("Error fetching user role:", error);
            // Fallback: try to get role from profile tables
            let role = null;
            
            // Check applicant table
            const { data: applicantData } = await supabase
              .from("applicants")
              .select("id")
              .eq("id", userId)
              .single();
              
            if (applicantData) role = 'applicant';
            
            // Check employer table  
            const { data: employerData } = await supabase
              .from("employers")
              .select("id")
              .eq("id", userId)
              .single();
              
            if (employerData) role = 'employer';

            // Remove success parameters from URL
            window.history.replaceState({}, '', window.location.pathname);

            if (role === 'applicant') {
              window.location.href = `/dashboard/applicant/${userId}`;
            } else if (role === 'employer') {
              window.location.href = `/dashboard/employer/${userId}`;
            } else {
              window.location.href = '/dashboard';
            }
            return;
          }

          // Remove success parameters from URL
          window.history.replaceState({}, '', window.location.pathname);

          // Redirect based on actual role
          if (userData?.role === 'applicant') {
            window.location.href = `/dashboard/applicant/${userId}`;
          } else if (userData?.role === 'employer') {
            window.location.href = `/dashboard/employer/${userId}`;
          } else {
            window.location.href = '/dashboard';
          }
          
        } catch (error) {
          console.error("Redirect error:", error);
          window.location.href = '/dashboard';
        }
      }
    };

    if (userId) {
      fetchBalance();
      fetchTransactions();
      checkPaymentAndRedirect();
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    fetchBalance();
    fetchTransactions();

    // Realtime balance
    const balanceSub = supabase
      .channel("wallet-balance")
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "token_wallets",
        filter: `user_id=eq.${userId}`
      }, payload => {
        if (payload.new && payload.new.user_id === userId) {
          setBalance(payload.new.balance);
        }
      })
      .subscribe();

    // Realtime transactions
    const txSub = supabase
      .channel("wallet-transactions")
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "token_transactions",
        filter: `user_id=eq.${userId}`
      }, payload => {
        if (payload.new && payload.new.user_id === userId) {
          if (payload.eventType === "INSERT") {
            setTransactions(prev => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setTransactions(prev =>
              prev.map(tx => (tx.id === payload.new.id ? payload.new : tx))
            );
          } else if (payload.eventType === "DELETE") {
            setTransactions(prev => prev.filter(tx => tx.id !== payload.old.id));
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(balanceSub);
      supabase.removeChannel(txSub);
    };
  }, [userId]);

  // ---------------- Paystack Funding ----------------
  const handleFundTokens = async () => {
    if (!amount || parseInt(amount) < 500) {
      setAlertMsg("❌ Minimum funding is 500 NGN");
      return;
    }

    setFunding(true);
    try {
      // Get current path for callback
      const currentPath = window.location.pathname;

      // Initiate Paystack payment
      const res = await fetch("/api/paystack/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseInt(amount),
          email,
          userId,
          currentPath,
        }),
      });

      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        setAlertMsg("⚠️ Payment initialization failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Funding error:", err);
      setAlertMsg("❌ Failed to initialize payment");
    } finally {
      setFunding(false);
      setShowModal(false);
    }
  };

  // ---------------- UI ----------------
  if (isLoading) {
    return <p className="text-center p-4">Restoring your session...</p>;
  }

  if (!user) {
    return <p className="text-center p-4">Please log in to view your tokens.</p>;
  }

  return (
    <div className="px-4">
      <h2 className="text-xl font-bold text-gray-900 pt-8 md:pt-20 mb-6">My Tokens</h2>

      {/* Balance Card */}
      <div className="p-3 sm:p-5 border rounded-xl shadow-sm bg-gradient-to-r from-orange-500 to-red-500 text-white text-center">
        <h3 className="text-sm sm:text-lg font-semibold mb-2">Token Balance</h3>
        {loading ? (
          <p className="text-xs sm:text-base">Loading...</p>
        ) : (
          <p className="text-2xl sm:text-3xl font-extrabold mb-3">{balance} 🎟️</p>
        )}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-black hover:bg-gray-200 text-xs sm:text-sm px-3 py-1.5 rounded-md"
            disabled={funding}
          >
            Fund Tokens
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="mt-6 p-3 sm:p-5 border rounded-xl shadow-sm bg-white">
        <h3 className="text-sm sm:text-lg font-semibold mb-3">Transaction History</h3>

        {transactions.length === 0 ? (
          <p className="text-xs sm:text-sm text-gray-500">No transactions yet</p>
        ) : (
          <>
            {/* Mobile stacked layout */}
            <div className="space-y-3 sm:hidden">
              {transactions.map((t) => (
                <div key={t.id} className="border rounded-lg p-3 bg-gray-50">
                  <p className="text-xs text-gray-500">
                    {new Date(t.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-medium">{t.description}</p>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-green-600">In: {t.tokens_in}</span>
                    <span className="text-red-600">Out: {t.tokens_out}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full table-fixed text-sm border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-3 text-left w-1/4">Date</th>
                    <th className="py-2 px-3 text-left w-1/2">Description</th>
                    <th className="py-2 px-3 text-right text-green-600 w-1/8">In</th>
                    <th className="py-2 px-3 text-right text-red-600 w-1/8">Out</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-2 px-3 text-left">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3 text-left">{t.description}</td>
                      <td className="py-2 px-3 text-right text-green-600">{t.tokens_in}</td>
                      <td className="py-2 px-3 text-right text-red-600">{t.tokens_out}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal for Funding */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">💳 Fund Tokens</h3>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount (NGN)"
              className="w-full border rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500"
              min="500"
            />
            <p className="text-sm text-gray-600 mb-4">Minimum: 500 NGN (2 tokens)</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleFundTokens}
                disabled={funding}
                className="px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {funding ? "Processing..." : "Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Message */}
      {alertMsg && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-lg z-50 flex items-center">
          {alertMsg}
          <button
            className="ml-2 text-gray-500 hover:text-gray-700"
            onClick={() => setAlertMsg("")}
          >
            ✖
          </button>
        </div>
      )}
    </div>
  );
}