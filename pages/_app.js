import "../styles/globals.css";
import Layout from "../components/Layout";
import CookieBanner from "../components/CookieBanner";
import { AnimatePresence, motion } from "framer-motion";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { UserProvider } from "../context/UserContext"; // ✅ Added

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [supabaseClient] = useState(() => createPagesBrowserClient());

  // Prevent hydration mismatches
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <Head>
        {/* ✅ Basic SEO */}
        <title>Gigzz — Find Remote, Hybrid & Onsite Jobs</title>
        <meta
          name="description"
          content="Find remote, hybrid, and onsite jobs worldwide on Gigzz. Connect with clients, apply for gigs, and earn money doing what you love."
        />
        <meta
          name="keywords"
          content="remote jobs, hybrid jobs, onsite work, freelance, gig jobs, online work, make money, creative jobs, design jobs, tech jobs, mygigzz, gigzz platform, job opportunities, hire freelancers"
        />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="https://mygigzz.com" />

        {/* ✅ Favicon and App Icons */}
        <link
          rel="icon"
          href="https://mygigzz.com/favicon.ico"
          type="image/x-icon"
        />
        <link
          rel="shortcut icon"
          href="https://mygigzz.com/favicon.ico"
          type="image/x-icon"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="https://mygigzz.com/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="https://mygigzz.com/favicon-16x16.png"
        />
        <link
          rel="apple-touch-icon"
          href="https://mygigzz.com/apple-touch-icon.png"
        />
        <link rel="manifest" href="https://mygigzz.com/site.webmanifest" />
        <meta name="theme-color" content="#f97316" />

        {/* ✅ Open Graph (for social sharing) */}
        <meta
          property="og:title"
          content="Gigzz — Remote, Hybrid & Onsite Jobs"
        />
        <meta
          property="og:description"
          content="Discover and hire top creative professionals for remote, hybrid, and onsite jobs on Gigzz."
        />
        <meta
          property="og:image"
          content="https://mygigzz.com/android-chrome-512x512.png"
        />
        <meta property="og:url" content="https://mygigzz.com" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Gigzz" />

        {/* ✅ Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Gigzz — Remote, Hybrid & Onsite Jobs"
        />
        <meta
          name="twitter:description"
          content="Find and apply for remote, hybrid, and onsite jobs worldwide on Gigzz. Connect with verified clients and get paid for your creativity."
        />
        <meta
          name="twitter:image"
          content="https://mygigzz.com/android-chrome-512x512.png"
        />
        <meta name="twitter:site" content="@GigzzOfficial" />

        {/* ✅ Facebook, Instagram, TikTok Cards */}
        <meta property="og:locale" content="en_US" />
        <meta property="fb:app_id" content="1234567890" />
        <meta
          name="instagram:title"
          content="Gigzz — Creative Jobs & Freelance Gigs"
        />
        <meta
          name="instagram:description"
          content="Explore creative jobs and hire top talents on Gigzz — your go-to platform for remote, hybrid, and onsite opportunities."
        />
        <meta
          name="tiktok:title"
          content="Gigzz — Find Jobs & Earn with Your Skills"
        />
        <meta
          name="tiktok:description"
          content="Discover freelance, remote, and onsite opportunities on Gigzz. Work with verified clients and showcase your talent."
        />

        {/* ✅ Structured Data for Google Rich Results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Gigzz",
              url: "https://mygigzz.com",
              potentialAction: {
                "@type": "SearchAction",
                target:
                  "https://mygigzz.com/job/alljobs?search={search_term_string}",
                "query-input": "required name=search_term_string",
              },
              description:
                "Gigzz connects creative professionals with clients offering remote, hybrid, and onsite jobs worldwide.",
              publisher: {
                "@type": "Organization",
                name: "Gigzz",
                logo: {
                  "@type": "ImageObject",
                  url: "https://mygigzz.com/android-chrome-512x512.png",
                },
              },
            }),
          }}
        />
      </Head>

      {isMounted && (
        <SessionContextProvider supabaseClient={supabaseClient}>
          <UserProvider>
            <Layout>
              <AnimatePresence mode="wait">
                <motion.div
                  key={router.route}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Component {...pageProps} />
                  <CookieBanner />
                </motion.div>
              </AnimatePresence>
            </Layout>

            {/* 🔸 Orange top progress bar */}
            <ProgressBar
              height="3px"
              color="#ffffffff"
              options={{ showSpinner: false }}
              shallowRouting
            />
          </UserProvider>
        </SessionContextProvider>
      )}
    </>
  );
}

export default MyApp;
