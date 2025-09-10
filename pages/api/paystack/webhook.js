import { supabase } from "../../../utils/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const hash = req.headers["x-paystack-signature"];
  const secret = process.env.PAYSTACK_SECRET_KEY;

  const crypto = require("crypto");
  const digest = crypto.createHmac("sha512", secret)
                       .update(JSON.stringify(req.body))
                       .digest("hex");

  if (digest !== hash) return res.status(401).end();

  const event = req.body;

  if (event.event === "charge.success") {
    const { metadata, amount } = event.data;
    const { userId } = metadata;

    const tokens = Math.floor(amount / 100 / 250); // amount in NGN

    // Update wallet and log transaction
    const { data: wallet } = await supabase
      .from("token_wallets")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (wallet) {
      await supabase
        .from("token_wallets")
        .update({ balance: wallet.balance + tokens })
        .eq("user_id", userId);
    } else {
      await supabase
        .from("token_wallets")
        .insert({ user_id: userId, balance: tokens });
    }

    await supabase.from("token_transactions").insert([{
      user_id: userId,
      description: "Wallet funding via Paystack",
      tokens_in: tokens,
      tokens_out: 0
    }]);
  }

  res.status(200).end();
}
