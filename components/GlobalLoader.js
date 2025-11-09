"use client";

import { motion } from "framer-motion";

export default function GlobalLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]"
    >
      <motion.p
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{
          repeat: Infinity,
          repeatType: "reverse",
          duration: 1.2,
          ease: "easeInOut",
        }}
        className="text-white text-lg md:text-xl tracking-wider font-light animate-pulse"
      >
        Loading...
      </motion.p>
    </motion.div>
  );
}
