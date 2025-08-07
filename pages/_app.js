import '../styles/globals.css'
import Layout from '../components/Layout'
import { AnimatePresence, motion } from 'framer-motion'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function App({ Component, pageProps }) {
  const router = useRouter(); // ✅ fix: get router via useRouter()

  return (
    <>
      <Head>
        <title>Gigzz — Remote Work. Real Talent.</title>
        <meta name="description" content="Gigzz connects remote employers with top applicants using a token-based job marketplace." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

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
          </motion.div>
        </AnimatePresence>
      </Layout>
    </>
  )
}
