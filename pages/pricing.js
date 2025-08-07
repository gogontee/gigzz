import Head from "next/head";
import Header from "../components/Header";
import MobileHeader from "../components/MobileHeader";
import Footer from "../components/Footer";

export default function PricingPage() {
  return (
    <>
      <Head>
        <title>Pricing - Gigzz</title>
        <meta
          name="description"
          content="View pricing for token plans and post promotions on Gigzz."
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
          <h1 className="text-4xl font-bold mb-8 border-b-4 border-orange-500 inline-block">
            Pricing
          </h1>

          {/* Token Purchase Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">🎯 Token Purchase (For Creatives)</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Standard Token */}
              <div className="border border-black rounded-lg p-6 hover:shadow-lg transition duration-300">
                <h3 className="text-xl font-bold mb-2">Standard Token</h3>
                <p className="text-gray-700 mb-2">20 Tokens • Access Standard Jobs</p>
                <p className="text-black font-semibold text-lg">₦5,000</p>
              </div>

              {/* Premium Token */}
              <div className="border border-black rounded-lg p-6 hover:shadow-lg transition duration-300">
                <h3 className="text-xl font-bold mb-2">Premium Token</h3>
                <p className="text-gray-700 mb-2">50 Tokens • Access All Jobs</p>
                <p className="text-black font-semibold text-lg">₦10,000</p>
              </div>
            </div>
          </section>

          {/* Promotion Category Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">🚀 Job Post Promotion (For Clients)</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Featured Post */}
              <div className="border border-black rounded-lg p-6 hover:shadow-lg transition duration-300">
                <h3 className="text-xl font-bold mb-2">Featured Post</h3>
                <p className="text-gray-700 mb-2">Highlighted post for 7 days</p>
                <p className="text-black font-semibold text-lg">₦3,000</p>
              </div>

              {/* Top of List */}
              <div className="border border-black rounded-lg p-6 hover:shadow-lg transition duration-300">
                <h3 className="text-xl font-bold mb-2">Top of List</h3>
                <p className="text-gray-700 mb-2">Pinned job listing for 5 days</p>
                <p className="text-black font-semibold text-lg">₦5,000</p>
              </div>

              {/* Spotlight */}
              <div className="border border-black rounded-lg p-6 hover:shadow-lg transition duration-300">
                <h3 className="text-xl font-bold mb-2">Spotlight</h3>
                <p className="text-gray-700 mb-2">Special badge and homepage display</p>
                <p className="text-black font-semibold text-lg">₦7,000</p>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
