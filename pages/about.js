import Head from "next/head";
import Header from "../components/Header";
import MobileHeader from "../components/MobileHeader";
import Footer from "../components/Footer";

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About - Gigzz</title>
        <meta
          name="description"
          content="Learn about the Gigzz platform – where clients connect with top creative talents across the globe."
        />
      </Head>

      <div className="min-h-screen flex flex-col bg-white text-black">
        {/* Mobile Header */}
        <div className="block md:hidden">
          <MobileHeader />
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header />
        </div>

        <main className="flex-grow px-6 py-12 max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 border-b-4 border-orange-500 inline-block pt-0 md:pt-20">
            About Gigzz
          </h1>

          <p className="text-lg leading-relaxed mb-6">
            <strong>Gigzz</strong> is a next-generation remote talent platform designed to connect{" "}
            <span className="text-orange-600 font-medium">clients</span> with elite{" "}
            <span className="text-orange-600 font-medium">creative professionals</span> across the world.
            Whether you're hiring or looking for exciting projects, Gigzz gives you the tools, visibility,
            and flexibility to succeed.
          </p>

          <p className="text-lg leading-relaxed mb-6">
            Our mission is to empower creatives by providing access to premium job opportunities, and to
            simplify hiring for businesses by offering verified talents with strong portfolios and
            transparent application tokens.
          </p>

          <p className="text-lg leading-relaxed mb-6">
            We believe in <span className="text-orange-600 font-medium">fair access</span>,{" "}
            <span className="text-orange-600 font-medium">authenticity</span>, and{" "}
            <span className="text-orange-600 font-medium">creative freedom</span>. Our system is powered by
            Supabase and built for scalability and trust.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4 text-orange-600">Key Features</h2>
          <ul className="list-disc list-inside space-y-2 text-lg">
            <li>Verified creative profiles with real portfolios</li>
            <li>Token-based gated job applications</li>
            <li>Client dashboards with direct access to applicants</li>
            <li>Secure chat and project discussion system</li>
            <li>Wallet funding and job promotion tools</li>
          </ul>
        </main>

        <Footer />
      </div>
    </>
  );
}
