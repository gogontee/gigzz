import Head from "next/head";
import Header from "../components/Header";
import MobileHeader from "../components/MobileHeader";
import Footer from "../components/Footer";

export default function ContactPage() {
  return (
    <>
      <Head>
        <title>Contact Us - Gigzz</title>
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
          <h1 className="text-4xl font-bold mb-6 border-b-4 border-orange-500 inline-block">
            Contact Us
          </h1>

          <p className="text-lg mb-6">
            Whether you're a client, creative, or curious visitor, we’d love to hear from you. Reach out to us using the form below or email us directly.
          </p>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Your Name
              </label>
              <input
                type="text"
                required
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
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              ></textarea>
            </div>

            <button
              type="submit"
              className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 transition"
            >
              Send Message
            </button>
          </form>

          <div className="mt-10 text-sm text-gray-600">
            Or email us at{" "}
            <a
              href="mailto:support@gigzz.com"
              className="text-orange-600 underline"
            >
              support@gigzz.com
            </a>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
