import Head from "next/head";
import Header from "../components/Header";
import MobileHeader from "../components/MobileHeader";
import Footer from "../components/Footer";
import { motion } from "framer-motion";

export default function PricingPage() {
  return (
    <>
      <Head>
        <title>Pricing - Gigzz</title>
        <meta
          name="description"
          content="Transparent pricing for Clients and Creatives on Gigzz."
        />
      </Head>

      <div className="min-h-screen flex flex-col bg-white text-black">
        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header />
        </div>

        {/* Mobile Header */}
        <div className="block md:hidden">
          <MobileHeader />
        </div>

        <main className="flex-grow px-6 py-12 max-w-5xl mx-auto pt-0 md:pt-20">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-3xl font-bold mb-8"
          >
            Pricing
          </motion.h1>

          {/* Clients Section */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-xl md:text-2xl font-semibold mb-6">
              💼 For Clients (Employers)
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Free Listing */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-xl transition duration-300"
              >
                <h3 className="text-lg font-bold mb-2">Job Listing</h3>
                <p className="text-gray-600 mb-2">Post jobs for free anytime</p>
                <p className="text-green-600 font-semibold text-lg">Free</p>
              </motion.div>

              {/* Verification */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-xl transition duration-300"
              >
                <h3 className="text-lg font-bold mb-2">Verification</h3>
                <p className="text-gray-600 mb-2">
                  Get your account verified for trust
                </p>
                <p className="text-green-600 font-semibold text-lg">Free</p>
              </motion.div>

              {/* Silver */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-xl transition duration-300"
              >
                <h3 className="text-lg font-bold mb-2">Silver Promotion</h3>
                <p className="text-gray-600 mb-2">Highlight job post</p>
                <p className="text-black font-semibold text-lg">5 Tokens</p>
              </motion.div>

              {/* Gold */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-xl transition duration-300"
              >
                <h3 className="text-lg font-bold mb-2">Gold Promotion</h3>
                <p className="text-gray-600 mb-2">
                  Boost visibility for faster reach
                </p>
                <p className="text-black font-semibold text-lg">10 Tokens</p>
              </motion.div>

              {/* Premium */}
              <motion.div
  whileHover={{ scale: 1.03 }}
  className="border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-xl transition duration-300 md:col-span-2"
>
  <h3 className="text-lg font-bold mb-2">Premium Promotion</h3>
  <p className="text-gray-600 mb-2">
    Urgent applications • Maximum exposure
  </p>
  <p className="text-black font-semibold text-lg">20 Tokens</p>
</motion.div>
            </div>
          </motion.section>

          {/* Creatives Section */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="text-xl md:text-2xl font-semibold mb-6">
              🎨 For Creatives (Applicants)
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Portfolio Creation */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-xl transition duration-300"
              >
                <h3 className="text-lg font-bold mb-2">Portfolio Creation</h3>
                <p className="text-gray-600 mb-2">Build and showcase your work</p>
                <p className="text-green-600 font-semibold text-lg">Free</p>
              </motion.div>

              {/* Job Application */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-xl transition duration-300"
              >
                <h3 className="text-lg font-bold mb-2">Job Application</h3>
                <p className="text-gray-600 mb-2">Apply to jobs seamlessly</p>
                <p className="text-black font-semibold text-lg">3 Tokens</p>
              </motion.div>

              {/* Portfolio Promotion */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-xl transition duration-300"
              >
                <h3 className="text-lg font-bold mb-2">Portfolio Promotion</h3>
                <p className="text-gray-600 mb-2">Boost portfolio visibility</p>
                <p className="text-black font-semibold text-lg">5 Tokens</p>
              </motion.div>
            </div>
          </motion.section>

          {/* Token Conversion */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-xl md:text-2xl font-semibold mb-6">
              💰 Token Conversion
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-xl transition duration-300"
              >
                <h3 className="text-lg font-bold mb-2">Value</h3>
                <p className="text-gray-600 mb-2">20 Tokens = ₦5,000</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                className="border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-xl transition duration-300"
              >
                <h3 className="text-lg font-bold mb-2">Top-Up</h3>
                <p className="text-gray-600 mb-2">
                  Wallet top-up starts from ₦5,000 and above
                </p>
              </motion.div>
            </div>
          </motion.section>
        </main>

        <Footer />
      </div>
    </>
  );
}
