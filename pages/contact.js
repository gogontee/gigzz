// pages/contact.js
import Head from "next/head";
import Header from "../components/Header";
import MobileHeader from "../components/MobileHeader";
import Footer from "../components/Footer";
import { useState } from "react";
import { supabase } from "../utils/supabaseClient"; // make sure you have this client

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");

    try {
      const { error } = await supabase.from("contact_us").insert([
        {
          name,
          email,
          message,
        },
      ]);

      if (error) throw error;

      setSuccess("Message sent successfully!");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error("Error submitting message:", err);
      alert("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Contact - Gigzz</title>
        <meta
          name="description"
          content="Get in touch with the Gigzz team for support, partnerships, or general inquiries."
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

        <main className="flex-grow px-6 py-12 max-w-3xl mx-auto pt-0 md:pt-20">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">
            Contact Us
          </h1>

          <p className="text-lg mb-6">
            Whether you're a client, creative, or curious visitor, we’d love to hear from you. Reach out to us using the form below or email us directly.
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                rows="5"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>

          {success && <p className="mt-4 text-green-600 font-medium">{success}</p>}

          <div className="mt-10 text-sm text-gray-600">
            Or email us at{" "}
            <a
              href="mailto:support@gigzz.com"
              className="text-orange-600 underline"
            >
              gigzzafrica@gmail.com
            </a>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
