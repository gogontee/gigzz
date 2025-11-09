"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, PlusCircle, Coins, TrendingUp, History, CheckCircle, X } from "lucide-react";
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

  // Initialize client-side
  useEffect(() => {
    setIsClient(true);
    fetchUser();
  }, []);

  // Get user data
  const fetchUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
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

      if (error && error.code === 'PGRST116') {
        // Create wallet if doesn't exist
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

  // SIMPLE & RELIABLE PAYSTACK INTEGRATION
  const handleProceedToPay = () => {
    // Basic validation
    if (tokenAmount < 1) {
      alert("Please enter at least 1 token");
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

    // Calculate amount in kobo (1 token = ₦250)
    const amountInKobo = tokenAmount * 250 * 100;
    const reference = `GIGZZ_${userId}_${Date.now()}`;

    console.log("Payment details:", {
      amountInKobo,
      tokenAmount,
      nairaAmount: tokenAmount * 250,
      userEmail,
      reference
    });

    // Method 1: Direct Paystack integration (Most reliable)
    initializePaystackPayment(publicKey, userEmail, amountInKobo, reference);
  };

  const initializePaystackPayment = (publicKey, email, amount, reference) => {
    // Check if Paystack is already loaded
    if (window.PaystackPop) {
      openPaystackModal(publicKey, email, amount, reference);
      return;
    }

    // Load Paystack script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
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
        currency: 'NGN',
        metadata: {
          custom_fields: [
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: userId
            },
            {
              display_name: "Tokens",
              variable_name: "tokens",
              value: tokenAmount
            }
          ]
        },
        callback: (response) => {
          // PAYMENT SUCCESS
          console.log("Payment successful!", response);
          setPaystackLoading(false);
          handleSuccessfulPayment(response.reference);
        },
        onClose: () => {
          // PAYMENT CANCELLED
          console.log("Payment window closed by user");
          setPaystackLoading(false);
          alert("Payment cancelled. You can try again when ready.");
        }
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
      
      // Update wallet balance
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
          last_action: `top up - ${tokenAmount} tokens`
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating wallet:", updateError);
        throw updateError;
      }

      // Update local state
      setBalance(newBalance);
      
      // Show custom success popup
      setSuccessMessage(`Payment successful! ${tokenAmount} tokens added to your wallet. 👍`);
      setShowSuccessPopup(true);
      setTokenAmount(0);
      
      console.log("Payment processing completed successfully");

    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Payment received but there was an error updating your wallet. Please contact support.");
    }
  };

  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
    setSuccessMessage("");
  };

  // Show loading state
  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Balance Card - Always Visible */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Coins className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Token Balance</p>
                <p className="text-2xl font-bold text-orange-400">
                  {loadingBalance ? "Loading..." : `${balance} Tokens`}
                </p>
                <p className="text-sm text-gray-500">
                  ₦{(balance * 250).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 md:p-2">
          <div className="flex space-x-1 md:space-x-2">
            <button
              onClick={() => setActiveTab("wallet")}
              className={`flex-1 py-2 md:py-3 px-2 md:px-4 rounded-lg font-medium flex items-center justify-center gap-1 md:gap-2 transition-colors text-sm md:text-base ${
                activeTab === "wallet"
                  ? "bg-black text-white"
                  : "text-gray-800 hover:bg-orange-400 hover:text-white"
              }`}
            >
              <Wallet className="w-4 h-4 md:w-5 md:h-5" />
              Fund Wallet
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-2 md:py-3 px-2 md:px-4 rounded-lg font-medium flex items-center justify-center gap-1 md:gap-2 transition-colors text-sm md:text-base ${
                activeTab === "history"
                  ? "bg-black text-white"
                  : "text-gray-800 hover:bg-orange-400 hover:text-white"
              }`}
            >
              <History className="w-4 h-4 md:w-5 md:h-5" />
              Transaction History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "wallet" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Fund Wallet Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Fund Wallet</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Tokens (1 token = ₦250)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tokenAmount || ""}
                    onChange={(e) => setTokenAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    placeholder="Enter number of tokens"
                  />
                  {tokenAmount > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Amount: <span className="font-semibold">₦{(tokenAmount * 250).toLocaleString()}</span>
                    </p>
                  )}
                </div>
                
                <button
                  onClick={handleProceedToPay}
                  disabled={paystackLoading || tokenAmount < 1}
                  className="w-full py-3 rounded-lg bg-orange-400 text-white hover:bg-black disabled:bg-gray-300 font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {paystackLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Initializing Payment...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5" />
                      <span>Pay ₦{(tokenAmount * 250).toLocaleString()}</span>
                    </>
                  )}
                </button>
                
                <p className="text-xs text-gray-500 text-center">
                  Secure payment via Paystack
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TransactionHistory />
          </motion.div>
        )}
      </div>

      {/* Custom Success Popup */}
<AnimatePresence>
  {showSuccessPopup && (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl shadow-2xl max-w-xs w-full mx-auto p-4 md:max-w-sm md:p-8 relative"
      >
        {/* Close Button */}
        <button
          onClick={closeSuccessPopup}
          className="absolute top-2 right-2 md:top-4 md:right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        {/* Success Content */}
        <div className="text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4"
          >
            <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
          </motion.div>

          {/* Thumbs Up Emoji */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="text-2xl md:text-4xl mb-3 md:mb-4"
          >
            👍
          </motion.div>

          {/* Title */}
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">
            Payment Successful!
          </h3>

          {/* Message */}
          <p className="text-gray-600 mb-4 md:mb-6 text-xs md:text-base">
            {successMessage}
          </p>

          {/* Continue Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={closeSuccessPopup}
            className="w-full py-2 md:py-3 bg-orange-400 text-white rounded-lg font-semibold hover:bg-black transition-colors text-sm md:text-base"
          >
            Continue
          </motion.button>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
    </>
  );
}