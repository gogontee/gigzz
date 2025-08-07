import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '../components/Footer';

const categories = [
  'Design', 'Engineering', 'Marketing', 'Sales',
  'Customer Support', 'Actors', 'Modeling', 'Influencers', 'Vixen', 'Product', 'Finance'
];

export default function OnsiteJobs() {
  return (
    <div className="p-4 pt-20 md:pt-24">
      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-10 text-center shadow"
      >
        <h2 className="text-xl md:text-2xl font-bold mb-2">Contract Jobs Coming Soon 🚧</h2>
        <p className="text-sm md:text-base max-w-xl mx-auto text-gray-700">
          We’re working hard to bring you the best onsite opportunities. Stay tuned!<br />
          In the meantime, explore our exciting <strong>Remote</strong>, <strong>Hybrid</strong>, and <strong>Contract</strong> roles.
        </p>
      </motion.div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10">
        {/* Remote Jobs */}
        <div className="relative rounded-xl overflow-hidden shadow-md group">
          <Image
            src="https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/generalphoto//1.jpg"
            alt="Remote Jobs"
            layout="responsive"
            width={500}
            height={300}
            className="group-hover:scale-105 transition duration-300"
          />
          <div className="absolute inset-0 bg-black/30 flex items-end justify-end p-4">
            <Link href="/remote">
              <button className="bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 hover:text-white transition">
                Find Remote Jobs
              </button>
            </Link>
          </div>
        </div>

        {/* Hybrid Jobs */}
        <div className="relative rounded-xl overflow-hidden shadow-md group">
          <Image
            src="https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/generalphoto//2.jpg"
            alt="Hybrid Jobs"
            layout="responsive"
            width={500}
            height={300}
            className="group-hover:scale-105 transition duration-300"
          />
          <div className="absolute inset-0 bg-black/30 flex items-end justify-end p-4">
            <Link href="/hybrid">
              <button className="bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 hover:text-white transition">
                Explore Hybrid Jobs
              </button>
            </Link>
          </div>
        </div>

        {/* Contract Jobs */}
        <div className="relative rounded-xl overflow-hidden shadow-md group">
          <Image
            src="https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/generalphoto//3.jpg"
            alt="Contract Jobs"
            layout="responsive"
            width={500}
            height={300}
            className="group-hover:scale-105 transition duration-300"
          />
          <div className="absolute inset-0 bg-black/30 flex items-end justify-end p-4">
            <Link href="/contract">
              <button className="bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 hover:text-white transition">
                Contract / Part-time
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Job by Profession Tags */}
      <div className="flex flex-wrap gap-2 mb-16">
        {categories.map((cat) => (
          <span
            key={cat}
            className="px-4 py-2 bg-white shadow text-sm font-medium border border-gray-200 rounded-full hover:bg-orange-600 hover:text-white transition"
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Desktop Only Footer */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
