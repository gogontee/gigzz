import '../styles/globals.css'
import Layout from '../components/Layout'
import CookieBanner from '../components/CookieBanner'
import { AnimatePresence, motion } from 'framer-motion'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  // ✅ Create Supabase client
  const [supabaseClient] = useState(() => createPagesBrowserClient())

  // Prevent hydration mismatches
  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <>
      <Head>
        <title>Gigzz — Remote Work. Real Talent.</title>
        <meta
          name="description"
          content="Gigzz connects clients with creative professionals through a remote, hybrid, and onsite job marketplace."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {isMounted && (
        <SessionContextProvider supabaseClient={supabaseClient}>
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
                {/* ✅ Cookie Banner always visible across pages */}
                <CookieBanner />
              </motion.div>
            </AnimatePresence>
          </Layout>
        </SessionContextProvider>
      )}
    </>
  )
}

export default MyApp
