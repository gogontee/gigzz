// pages/api/paystack/init.js

export default async function handler(req, res) {
  console.log("🔥 /api/paystack/init called");

  // ✅ Method check
  if (req.method !== "POST") {
    console.warn("⚠️ Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount, userId, email } = req.body;

  console.log("Request body:", req.body);

  // ✅ Validate inputs
  if (!amount || !email || !userId) {
    console.error("❌ Missing required fields:", { amount, userId, email });
    return res.status(400).json({ error: "Missing required fields" });
  }

  // ✅ Ensure PAYSTACK_SECRET_KEY exists
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    console.error("❌ PAYSTACK_SECRET_KEY not set in environment variables");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    console.log(`Initializing Paystack transaction: ${amount} NGN for user ${userId}`);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // 👇 Force Paystack to redirect back to /wallet page
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // convert NGN to kobo
        metadata: { userId },
        callback_url: `${baseUrl}/wallet`, // 👈 Always redirect here after success/cancel
      }),
    });

    // ✅ Log raw response for debugging
    const text = await paystackRes.text();
    console.log("Raw Paystack response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (jsonErr) {
      console.error("❌ Failed to parse Paystack response:", jsonErr);
      return res.status(500).json({ error: "Invalid response from Paystack" });
    }

    // ✅ Check status
    if (!data.status) {
      console.error("❌ Paystack returned an error:", data);
      return res.status(400).json({ error: data.message || "Paystack initialization failed" });
    }

    console.log("✅ Paystack transaction initialized successfully:", data.data);
    return res.status(200).json(data.data);

  } catch (err) {
    console.error("💥 Paystack init error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
