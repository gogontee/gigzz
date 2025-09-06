'use client';

import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function Token() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showPackages, setShowPackages] = useState(false);
  const [userId, setUserId] = useState(null);

  // ✅ Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: authData, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Auth error:", error.message);
        setLoading(false);
        return;
      }
      if (authData?.user) {
        setUserId(authData.user.id);
      } else {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  // ✅ Fetch wallet balance
  const fetchBalance = async (uid) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("token_wallets")
        .select("balance")
        .eq("user_id", uid)
        .maybeSingle();

      if (error) {
        console.error("Error fetching wallet:", error.message);
        setBalance(0);
        return;
      }

      if (!data) {
        // Create wallet for new user
        const { data: inserted, error: insertError } = await supabase
          .from("token_wallets")
          .insert([{ user_id: uid, balance: 0 }])
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

  // ✅ Fetch user transactions
  const fetchTransactions = async (uid) => {
    const { data, error } = await supabase
      .from("token_transactions")
      .select("id, created_at, description, tokens_in, tokens_out")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error.message);
    } else {
      setTransactions(data || []);
    }
  };

  // ✅ Subscribe to realtime changes
  useEffect(() => {
    if (!userId) return;

    fetchBalance(userId);
    fetchTransactions(userId);

    const balanceSub = supabase
      .channel("wallet-balance")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "token_wallets",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) setBalance(payload.new.balance);
        }
      )
      .subscribe();

    const txSub = supabase
      .channel("wallet-transactions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "token_transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTransactions((prev) => [payload.new, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(balanceSub);
      supabase.removeChannel(txSub);
    };
  }, [userId]);

  // ✅ Handle token purchase
  const handlePurchase = async (tokens, description) => {
    if (!userId) return;
    setFunding(true);
    try {
      const { data, error } = await supabase
        .from("token_wallets")
        .update({ balance: balance + tokens })
        .eq("user_id", userId)
        .select()
        .maybeSingle();

      if (error) {
        console.error("Error funding wallet:", error.message);
      } else if (data) {
        setBalance(data.balance);

        // Log transaction
        await supabase.from("token_transactions").insert([
          {
            user_id: userId,
            description,
            tokens_in: tokens,
            tokens_out: 0,
          },
        ]);
      }
    } finally {
      setFunding(false);
      setShowPackages(false);
    }
  };

  // ✅ Render
  if (!userId && !loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Please log in to view your token wallet.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10 md:pt-20 md:pb-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">My Tokens</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 shadow-lg p-6 sm:p-8 rounded-2xl mb-8 text-white text-center">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          Token Balance
        </h2>
        {loading ? (
          <p className="text-base sm:text-lg">Loading...</p>
        ) : (
          <p className="text-4xl sm:text-5xl font-extrabold mb-6 flex items-center justify-center gap-2">
            <span>{balance}</span> 🎟️
          </p>
        )}
        <button
          onClick={() => setShowPackages(true)}
          disabled={funding}
          className="bg-white text-black hover:bg-gray-200 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition duration-300 text-sm sm:text-base disabled:opacity-50"
        >
          {funding ? "Processing..." : "Fund Tokens"}
        </button>
      </div>

      {/* Transaction History */}
      <div className="bg-white shadow-md rounded-xl p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          Transaction History
        </h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-xs sm:text-sm">
            No transactions yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="py-2 px-3 sm:px-4">Date/Time</th>
                  <th className="py-2 px-3 sm:px-4">Description</th>
                  <th className="py-2 px-3 sm:px-4 text-green-600">In</th>
                  <th className="py-2 px-3 sm:px-4 text-red-600">Out</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 px-3 sm:px-4 whitespace-nowrap">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 sm:px-4">{t.description}</td>
                    <td className="py-2 px-3 sm:px-4 text-green-600 font-medium">
                      {t.tokens_in || "-"}
                    </td>
                    <td className="py-2 px-3 sm:px-4 text-red-600 font-medium">
                      {t.tokens_out || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Packages Modal */}
      {showPackages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-2 sm:px-4">
          <div className="bg-white rounded-xl shadow-lg max-w-xs sm:max-w-sm w-full p-3 sm:p-4 md:p-6 relative">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-center mb-3 sm:mb-4 md:mb-6">
              Choose a Token Package
            </h2>
            <div className="grid gap-2 sm:gap-3 md:gap-4">
              <div
                className="border rounded-lg p-2 sm:p-3 md:p-4 text-center cursor-pointer hover:bg-gray-100 transition"
                onClick={() => handlePurchase(10, "Purchased Seeker Package (₦5,000)")}
              >
                <h3 className="text-sm sm:text-base md:text-lg font-semibold">⚡ Seeker</h3>
                <p className="mt-1 text-gray-600">10 Tokens</p>
                <p className="mt-1 font-bold">₦5,000</p>
              </div>
              <div
                className="border rounded-lg p-2 sm:p-3 md:p-4 text-center cursor-pointer hover:bg-gray-100 transition"
                onClick={() => handlePurchase(20, "Purchased Titan Package (₦8,000)")}
              >
                <h3 className="text-sm sm:text-base md:text-lg font-semibold">🔥 Titan</h3>
                <p className="mt-1 text-gray-600">20 Tokens</p>
                <p className="mt-1 font-bold">₦8,000</p>
              </div>
            </div>
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setShowPackages(false)}
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
