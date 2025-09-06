// components/Token.js
import { useEffect, useState } from "react";
import { supabase } from '../utils/supabaseClient';

export default function Token() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showPackages, setShowPackages] = useState(false);

  // Fetch wallet balance
  const fetchBalance = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("token_wallets")
        .select("balance")
        .maybeSingle();

      if (error) {
        console.error("Error fetching wallet:", error.message);
        setBalance(0);
        return;
      }

      if (!data) {
        const { data: inserted, error: insertError } = await supabase
          .from("token_wallets")
          .insert([{ balance: 0 }])
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

  // Fetch transactions
  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from("token_transactions")
      .select("id, created_at, description, tokens_in, tokens_out")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error.message);
    } else {
      setTransactions(data || []);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions();

    // Realtime balance
    const balanceSub = supabase
      .channel("wallet-balance")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "token_wallets" },
        (payload) => {
          if (payload.new) {
            setBalance(payload.new.balance);
          }
        }
      )
      .subscribe();

    // Realtime transactions
    const txSub = supabase
      .channel("wallet-transactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "token_transactions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTransactions((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setTransactions((prev) =>
              prev.map((tx) => (tx.id === payload.new.id ? payload.new : tx))
            );
          } else if (payload.eventType === "DELETE") {
            setTransactions((prev) =>
              prev.filter((tx) => tx.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(balanceSub);
      supabase.removeChannel(txSub);
    };
  }, []);

  // Handle token purchase
  const handlePurchase = async (tokens, description) => {
    setFunding(true);
    try {
      const { data, error } = await supabase
        .from("token_wallets")
        .update({ balance: balance + tokens })
        .select()
        .maybeSingle();

      if (error) {
        console.error("Error funding wallet:", error.message);
      } else {
        setBalance(data.balance);

        // Log transaction
        await supabase.from("token_transactions").insert([
          {
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

 return (
    <div className="px-4">
      {/* Title */}
      <h2 className="text-xl font-bold text-gray-900 pt-8 md:pt-20 mb-6">
        My Tokens
      </h2>

      {/* Balance Card */}
      <div className="p-3 sm:p-5 border rounded-xl shadow-sm bg-gradient-to-r from-orange-500 to-red-500 text-white text-center">
        <h3 className="text-sm sm:text-lg font-semibold mb-2">Token Balance</h3>
        {loading ? (
          <p className="text-xs sm:text-base">Loading...</p>
        ) : (
          <p className="text-2xl sm:text-3xl font-extrabold mb-3">
            {balance} 🎟️
          </p>
        )}
        <button className="bg-white text-black hover:bg-gray-200 text-xs sm:text-sm px-3 py-1.5 rounded-md">
          Fund Tokens
        </button>
      </div>

      {/* Transaction History */}
      <div className="mt-6 p-3 sm:p-5 border rounded-xl shadow-sm bg-white">
        <h3 className="text-sm sm:text-lg font-semibold mb-3">
          Transaction History
        </h3>
        {transactions.length === 0 ? (
          <p className="text-xs sm:text-sm text-gray-500">
            No transactions yet
          </p>
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