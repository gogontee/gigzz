"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Coins,
  TrendingUp,
  History,
  CheckCircle,
  X,
  ArrowRight,
} from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import TransactionHistory from "./TransactionHistory";

export default function WalletComponent() {
  const [tokenAmount, setTokenAmount] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("wallet");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [inputError, setInputError] = useState("");

  const TOKEN_PRICE = 250; // 1 token = ₦250
  const MINIMUM_AMOUNT = 5000; // Minimum funding amount in Naira
  const MINIMUM_TOKENS = 20; // 20 tokens = ₦5000

  // Initialize client-side
  useEffect(() => {
    setIsClient(true);
    fetchUser();
  }, []);

  // Get user data
  const fetchUser = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || "");
        fetchBalance(user.id);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  // Fetch balance
  const fetchBalance = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("token_wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (error && error.code === "PGRST116") {
        const { data: newWallet } = await supabase
          .from("token_wallets")
          .insert({ user_id: userId, balance: 0 })
          .select()
          .single();

        setBalance(newWallet?.balance || 0);
      } else if (data) {
        setBalance(data.balance);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setLoadingBalance(false);
    }
  };

  // Calculate Naira amount
  const calculateNairaAmount = (tokens) => tokens * TOKEN_PRICE;

  // Handle input change with validation
  const handleTokenAmountChange = (value) => {
    const numValue = parseInt(value) || 0;
    setTokenAmount(numValue);

    if (numValue > 0 && numValue < MINIMUM_TOKENS) {
      setInputError(
        `Minimum funding is ${MINIMUM_TOKENS} tokens (₦${MINIMUM_AMOUNT.toLocaleString()})`
      );
    } else {
      setInputError("");
    }
  };

  // Handle input arrow clicks
  const handleIncrement = () => {
    if (tokenAmount === 0) {
      setTokenAmount(MINIMUM_TOKENS);
      setInputError("");
    } else {
      setTokenAmount((prev) => prev + 1);
      setInputError("");
    }
  };

  const handleDecrement = () => {
    if (tokenAmount > MINIMUM_TOKENS) {
      setTokenAmount((prev) => prev - 1);
      setInputError("");
    } else if (tokenAmount === MINIMUM_TOKENS) {
      setInputError(
        `Minimum funding is ${MINIMUM_TOKENS} tokens (₦${MINIMUM_AMOUNT.toLocaleString()})`
      );
    }
  };

  // SIMPLE & RELIABLE PAYSTACK INTEGRATION
  const handleProceedToPay = () => {
    const nairaAmount = calculateNairaAmount(tokenAmount);

    if (tokenAmount < MINIMUM_TOKENS) {
      setInputError(
        `Minimum funding is ${MINIMUM_TOKENS} tokens (₦${MINIMUM_AMOUNT.toLocaleString()})`
      );
      return;
    }

    if (!userEmail) {
      alert("Please login to make payments");
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      alert("Payment system not configured");
      console.error("Paystack public key missing");
      return;
    }

    console.log("Starting payment process...");
    setPaystackLoading(true);

    const amountInKobo = nairaAmount * 100;
    const reference = `GIGZZ_${userId}_${Date.now()}`;

    console.log("Payment details:", {
      amountInKobo,
      tokenAmount,
      nairaAmount,
      userEmail,
      reference,
    });

    initializePaystackPayment(publicKey, userEmail, amountInKobo, reference);
  };

  const initializePaystackPayment = (publicKey, email, amount, reference) => {
    if (window.PaystackPop) {
      openPaystackModal(publicKey, email, amount, reference);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;

    script.onload = () => {
      console.log("Paystack script loaded successfully");
      openPaystackModal(publicKey, email, amount, reference);
    };

    script.onerror = () => {
      console.error("Failed to load Paystack script");
      setPaystackLoading(false);
      alert("Failed to load payment system. Please check your internet connection.");
    };

    document.head.appendChild(script);
  };

  const openPaystackModal = (publicKey, email, amount, reference) => {
    try {
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: email,
        amount: amount,
        ref: reference,
        currency: "NGN",
        metadata: {
          custom_fields: [
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: userId,
            },
            {
              display_name: "Tokens",
              variable_name: "tokens",
              value: tokenAmount,
            },
          ],
        },
        callback: (response) => {
          console.log("Payment successful!", response);
          setPaystackLoading(false);
          handleSuccessfulPayment(response.reference);
        },
        onClose: () => {
          console.log("Payment window closed by user");
          setPaystackLoading(false);
          alert("Payment cancelled. You can try again when ready.");
        },
      });

      handler.openIframe();
    } catch (error) {
      console.error("Error opening Paystack:", error);
      setPaystackLoading(false);
      alert("Error starting payment. Please try again.");
    }
  };

  const handleSuccessfulPayment = async (reference) => {
    try {
      console.log("Processing successful payment...");

      const { data: currentWallet } = await supabase
        .from("token_wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      const currentBalance = currentWallet?.balance || 0;
      const newBalance = currentBalance + tokenAmount;

      const { error: updateError } = await supabase
        .from("token_wallets")
        .update({
          balance: newBalance,
          last_action: `top up - ${tokenAmount} tokens`,
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating wallet:", updateError);
        throw updateError;
      }

      setBalance(newBalance);

      setSuccessMessage(
        `Payment successful! ${tokenAmount} tokens added to your wallet. 👍`
      );
      setShowSuccessPopup(true);
      setTokenAmount(0);
      setInputError("");

      console.log("Payment processing completed successfully");
    } catch (error) {
      console.error("Error processing payment:", error);
      alert(
        "Payment received but there was an error updating your wallet. Please contact support."
      );
    }
  };

  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
    setSuccessMessage("");
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  const nairaAmount = calculateNairaAmount(tokenAmount);
  const canPay =
    !paystackLoading && tokenAmount >= MINIMUM_TOKENS && !inputError;

  return (
    <>
      <div className="w-full max-w-2xl mx-auto space-y-4 md:space-y-5">
        {/* ---------------- Balance Card (App-style) ---------------- */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-black via-gray-900 to-gray-800 p-5 md:p-6 text-white shadow-md"
        >
          {/* subtle decorative glow */}
          <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-orange-400/20 blur-3xl" />

          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-white/70 text-xs font-medium mb-1">
                <Wallet className="w-3.5 h-3.5" />
                <span>Token Balance</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-bold tracking-tight">
                  {loadingBalance ? "—" : balance}
                </span>
                <span className="text-sm text-white/60 font-medium">tokens</span>
              </div>
              {!loadingBalance && (
                <p className="text-xs text-white/50 mt-1">
                  ≈ ₦{(balance * TOKEN_PRICE).toLocaleString()}
                </p>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <Coins className="w-5 h-5 text-orange-400" />
            </div>
          </div>
        </motion.div>

        {/* ---------------- Segmented Tabs ---------------- */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-1.5">
          <div className="relative flex">
            {[
              { id: "wallet", label: "Fund Wallet", icon: Wallet },
              { id: "history", label: "History", icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-gray-700 hover:text-black"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="wallet-tab-pill"
                      className="absolute inset-0 bg-black rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-orange-400" : "text-gray-500"
                      }`}
                    />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---------------- Tab Content ---------------- */}
        <AnimatePresence mode="wait">
          {activeTab === "wallet" && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5 md:p-6"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-orange-50 border border-orange-100">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    Fund Wallet
                  </h3>
                  <p className="text-xs text-gray-500">
                    Min {MINIMUM_TOKENS} tokens = ₦
                    {MINIMUM_AMOUNT.toLocaleString()}
                  </p>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                    Rate
                  </p>
                  <p className="text-xs font-semibold text-gray-700">
                    ₦{TOKEN_PRICE}/token
                  </p>
                </div>
              </div>

              {/* Token input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700">
                  Number of tokens
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min={MINIMUM_TOKENS}
                    value={tokenAmount || ""}
                    onChange={(e) => handleTokenAmountChange(e.target.value)}
                    className="w-full h-12 pl-4 pr-14 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-base font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal transition-all"
                    placeholder={`${MINIMUM_TOKENS} or more`}
                  />

                  {/* Stepper */}
                  <div className="absolute right-1.5 top-1.5 bottom-1.5 flex flex-col w-8 rounded-lg overflow-hidden border border-gray-200 bg-white">
                    <button
                      type="button"
                      onClick={handleIncrement}
                      className="flex-1 flex items-center justify-center text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                      aria-label="Increase tokens"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M5 1L5 9M1 5H9"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                    <div className="h-px bg-gray-200" />
                    <button
                      type="button"
                      onClick={handleDecrement}
                      className="flex-1 flex items-center justify-center text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                      aria-label="Decrease tokens"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M1 5H9"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {inputError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-[12px] text-red-600 font-medium"
                    >
                      {inputError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Summary strip */}
              <AnimatePresence>
                {tokenAmount >= MINIMUM_TOKENS && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 divide-y divide-gray-100">
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-xs text-gray-500 font-medium">
                          Tokens
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {tokenAmount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-xs text-gray-500 font-medium">
                          You pay
                        </span>
                        <span className="text-sm font-bold text-orange-500">
                          ₦{nairaAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CTA */}
              <motion.button
                whileHover={canPay ? { scale: 1.01 } : {}}
                whileTap={canPay ? { scale: 0.98 } : {}}
                onClick={handleProceedToPay}
                disabled={!canPay}
                className="mt-5 w-full h-12 rounded-xl bg-orange-400 text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-sm"
              >
                {paystackLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Initializing...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {tokenAmount >= MINIMUM_TOKENS
                        ? `Pay ₦${nairaAmount.toLocaleString()}`
                        : "Proceed to Pay"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              <p className="text-[11px] text-gray-400 text-center mt-3">
                🔒 Secure payment via Paystack
              </p>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 md:p-5"
            >
              <TransactionHistory />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---------------- Success Modal ---------------- */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              className="bg-white rounded-2xl shadow-2xl max-w-xs w-full p-6 relative"
            >
              <button
                onClick={closeSuccessPopup}
                className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 220 }}
                  className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="w-7 h-7 text-green-500" />
                </motion.div>

                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Payment Successful
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  {successMessage}
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={closeSuccessPopup}
                  className="w-full py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-black transition-colors"
                >
                  Continue
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}