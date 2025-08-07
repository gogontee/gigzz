import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import ApplicantLayout from "../../../components/dashboard/ApplicantLayout";

export default function TokensPage() {
  const user = useUser();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTokenData();
    }
  }, [user]);

  async function fetchTokenData() {
    setLoading(true);
    const { data, error } = await supabase
      .from("token_balances")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching token data:", error);
      return;
    }

    const total = data.reduce((acc, tx) => {
      return tx.type === "in" ? acc + tx.amount : acc - tx.amount;
    }, 0);

    setBalance(total);
    setHistory(data);
    setLoading(false);
  }

  const handleFundToken = async () => {
    const { error } = await supabase.from("tokens").insert([
      {
        user_id: user.id,
        type: "in",
        amount: 5,
        description: "Funded via mock button",
      },
    ]);

    if (error) {
      alert("Error funding tokens.");
    } else {
      fetchTokenData();
    }
  };

  return (
    <ApplicantLayout>
      <div className="max-w-5xl mx-auto px-4 py-10 md:pt-20 md:pb-10">
        <h1 className="text-3xl font-bold mb-4">My Tokens</h1>

        <div className="bg-white shadow p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-2">Token Balance</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <p className="text-4xl font-bold text-green-600">{balance} 🎟️</p>
          )}
          <button
            onClick={handleFundToken}
            className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded transition duration-300"
          >
            Fund Tokens
          </button>
        </div>

        <div className="bg-white shadow p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Token History</h2>
          {history.length === 0 ? (
            <p>No token activity yet.</p>
          ) : (
            <ul className="space-y-4">
              {history.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div className="flex items-center gap-3">
                    {tx.type === "in" ? (
                      <ArrowDownCircle className="text-green-600" />
                    ) : (
                      <ArrowUpCircle className="text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">
                        {tx.description || "No description"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      tx.type === "in" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.type === "in" ? "+" : "-"}
                    {tx.amount}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ApplicantLayout>
  );
}
