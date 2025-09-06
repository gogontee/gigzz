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
    <div className="px-3 py-4 space-y-4 sm:px-4 sm:py-6 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold">My Tokens</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 shadow p-3 sm:p-6 rounded-lg sm:rounded-xl text-white text-center">
        <h2 className="text-sm sm:text-lg font-semibold mb-2">Token Balance</h2>

        {loading ? (
          <p className="text-xs sm:text-base">Loading...</p>
        ) : (
          <p className="text-2xl sm:text-4xl font-extrabold mb-3 sm:mb-4 flex items-center justify-center gap-1 sm:gap-2">
            <span>{balance}</span> 🎟️
          </p>
        )}

        <button
          onClick={() => setShowPackages(true)}
          disabled={funding}
          className="bg-white text-black hover:bg-gray-200 font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-lg transition text-xs sm:text-sm"
        >
          {funding ? "Processing..." : "Fund Tokens"}
        </button>
      </div>

      {/* Transaction History */}
      <div className="bg-white shadow rounded-lg sm:rounded-xl p-3 sm:p-4">
        <h2 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-3">Transaction History</h2>

        {transactions.length === 0 ? (
          <p className="text-gray-500 text-xs sm:text-sm">No transactions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="py-1.5 px-2 sm:py-2 sm:px-3">Date/Time</th>
                  <th className="py-1.5 px-2 sm:py-2 sm:px-3">Description</th>
                  <th className="py-1.5 px-2 sm:py-2 sm:px-3 text-green-600">In</th>
                  <th className="py-1.5 px-2 sm:py-2 sm:px-3 text-red-600">Out</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="py-1.5 px-2 whitespace-nowrap">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td className="py-1.5 px-2 break-words max-w-[100px] sm:max-w-none">
                      {t.description}
                    </td>
                    <td className="py-1.5 px-2 text-green-600 font-medium">
                      {t.tokens_in || "-"}
                    </td>
                    <td className="py-1.5 px-2 text-red-600 font-medium">
                      {t.tokens_out || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Token Packages Modal */}
      {showPackages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-3">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg max-w-xs w-full p-3 sm:p-4 relative">
            <h2 className="text-base sm:text-lg font-bold text-center mb-3 sm:mb-4">
              Choose a Package
            </h2>
            <div className="grid gap-2 sm:gap-3">
              <div
                className="border rounded-md sm:rounded-lg p-2 sm:p-3 text-center cursor-pointer hover:bg-gray-100 transition"
                onClick={() =>
                  handlePurchase(10, "Purchased Seeker Package (₦5,000)")
                }
              >
                <h3 className="text-sm sm:text-base font-semibold">⚡ Seeker</h3>
                <p className="mt-0.5 text-gray-600 text-xs sm:text-sm">10 Tokens</p>
                <p className="mt-0.5 font-bold text-xs sm:text-sm">₦5,000</p>
              </div>

              <div
                className="border rounded-md sm:rounded-lg p-2 sm:p-3 text-center cursor-pointer hover:bg-gray-100 transition"
                onClick={() =>
                  handlePurchase(20, "Purchased Titan Package (₦8,000)")
                }
              >
                <h3 className="text-sm sm:text-base font-semibold">🔥 Titan</h3>
                <p className="mt-0.5 text-gray-600 text-xs sm:text-sm">20 Tokens</p>
                <p className="mt-0.5 font-bold text-xs sm:text-sm">₦8,000</p>
              </div>
            </div>

            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black text-xs sm:text-sm"
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
