// pages/about.js
import Head from "next/head";
import Header from "../components/Header";
import MobileHeader from "../components/MobileHeader";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>Why Gigzz - Gigzz</title>
        <meta
          name="description"
          content="Learn about Gigzz, our mission, key features, and how we empower Creatives and Clients."
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
          {/* Page Title */}
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-3xl font-bold mb-10"
          >
            Why Gigzz
          </motion.h1>

          {/* About Section */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-xl md:text-2xl font-semibold mb-4">About Gigzz</h2>
            <p className="text-gray-700 leading-relaxed">
              Gigzz is a next-gen talent platform connecting Clients with Creatives seamlessly. 
              We empower both parties with transparency, instant communication, and tools to scale their projects efficiently.
            </p>
          </motion.section>

          {/* Mission Section */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-xl md:text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              Our mission is to bridge the gap between talent and opportunity. Gigzz makes finding the right Creative or project faster, safer, and more rewarding for everyone.
            </p>
          </motion.section>

          {/* Key Features */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-xl md:text-2xl font-semibold mb-6">Key Features</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { title: "Seamless Connections", desc: "Find the right talent or project fast." },
                { title: "Secure Payments", desc: "Wallet-based transactions for safety." },
                { title: "Portfolio Showcase", desc: "Creatives can display and promote their work professionally." },
                { title: "Job Promotions", desc: "Clients can highlight urgent jobs." },
                { title: "Token System", desc: "Simple token-based access to features." },
                { title: "Mobile Friendly", desc: "Access Gigzz anytime, anywhere." },
                { title: "In-App Messaging", desc: "Clients can initiate converation with their prefered applicants securely." },
                { title: "User Friendly Dashboard", desc: "Users, both Clients and Applicants are powered with simple to navigate dashboard." },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.03 }}
                  className="border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-xl transition duration-300"
                >
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Discover More */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="text-center mt-12"
          >
            <Link
              href="/learnmore"
              className="inline-block px-6 py-3 bg-black text-white rounded-xl hover:bg-orange-500 transition font-semibold"
            >
              Discover More
            </Link>
          </motion.section>
        </main>

        <Footer />
      </div>
    </>
  );
}
