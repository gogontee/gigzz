// components/Token.js
'use client';

import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useUser, useSessionContext } from "@supabase/auth-helpers-react";

export default function Token() {
  const { isLoading } = useSessionContext(); // ✅ tells us if Supabase is still restoring session
  const user = useUser();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [transactions, setTransactions] = useState([]);

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

  useEffect(() => {
    if (!userId) return;

    fetchBalance();
    fetchTransactions();

    // Realtime balance
    const balanceSub = supabase
      .channel("wallet-balance")
      .on("postgres_changes", { event: "*", schema: "public", table: "token_wallets" }, payload => {
        if (payload.new && payload.new.user_id === userId) {
          setBalance(payload.new.balance);
        }
      })
      .subscribe();

    // Realtime transactions
    const txSub = supabase
      .channel("wallet-transactions")
      .on("postgres_changes", { event: "*", schema: "public", table: "token_transactions" }, payload => {
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
    const amount = parseInt(prompt("Enter amount (min 5000 NGN):"));
    if (!amount || amount < 5000) return alert("Minimum funding is 5000 NGN");

    try {
      console.log("Funding request:", { amount, userId, email });

      const res = await fetch("/api/paystack/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, userId, email }),
      });

      const data = await res.json();
      console.log("Paystack init response:", data);

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        alert("Payment initialization failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Funding error:", err);
      alert("Failed to initialize payment");
    }
  };

  // ---------------- UI ----------------
  if (isLoading) {
    // ✅ Wait for Supabase to finish restoring session
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
            onClick={handleFundTokens}
            className="bg-white text-black hover:bg-gray-200 text-xs sm:text-sm px-3 py-1.5 rounded-md"
            disabled={funding}
          >
            {funding ? "Processing..." : "Fund Tokens"}
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="mt-6 p-3 sm:p-5 border rounded-xl shadow-sm bg-white">
        <h3 className="text-sm sm:text-lg font-semibold mb-3">Transaction History</h3>
        {transactions.length === 0 ? (
          <p className="text-xs sm:text-sm text-gray-500">No transactions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 text-green-600">In</th>
                  <th className="py-2 px-3 text-red-600">Out</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-2 px-3">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3">{t.description}</td>
                    <td className="py-2 px-3 text-green-600">{t.tokens_in}</td>
                    <td className="py-2 px-3 text-red-600">{t.tokens_out}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
