import Link from "next/link";
import { motion } from "framer-motion";

export default function FeatureTab({ icon, title, href }) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex flex-col items-center justify-center border border-black hover:border-orange-600 p-4 rounded-lg transition cursor-pointer text-center"
      >
        <div className="text-2xl mb-2">{icon}</div>
        <span className="text-sm font-medium">{title}</span>
      </motion.div>
    </Link>
  );
}
