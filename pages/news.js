import Head from "next/head";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import MobileHeader to prevent SSR issues
const MobileHeader = dynamic(() => import("../components/MobileHeader"), {
  ssr: false,
});

export default function News() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <Head>
        <title>News – Gigzz</title>
        <meta name="description" content="Stay updated with the latest news from Gigzz." />
      </Head>

      {isMobile && <MobileHeader />}

      <main className={`min-h-screen bg-white text-black px-4 py-8 ${!isMobile ? "pt-20" : ""}`}>
        <h1 className="text-3xl font-bold mb-6 text-center">Latest News</h1>

        <div className="space-y-6 max-w-3xl mx-auto">
          <article className="border rounded-xl p-5 shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">Gigzz partners with top African tech hubs</h2>
            <p className="text-sm text-gray-700">
              August 2025 – In a move to boost remote hiring across the continent...
            </p>
          </article>

          <article className="border rounded-xl p-5 shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">Premium token discounts now live!</h2>
            <p className="text-sm text-gray-700">
              July 2025 – Users can now enjoy 20% discount on premium job tokens...
            </p>
          </article>

          <article className="border rounded-xl p-5 shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">Gigzz launches mobile dashboard experience</h2>
            <p className="text-sm text-gray-700">
              June 2025 – Our updated mobile interface makes it easier than ever to apply...
            </p>
          </article>
        </div>
      </main>
    </>
  );
}
