import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '../components/Footer';
import MobileHeader from '../components/MobileHeader';
import ContractJobs from '../components/Contract'; // ✅ Correct import for the contract jobs section

const categories = [
  'Design & Creative', 'Engineering', 'Marketing & Sales', 'Development & IT',
  'Customer Support', 'Legal Services', 'Finance & Accounting', 'Acting & Modelling', 'Writing & Translation',
  'Influencers and PR', 'Finance'
];

export default function ContractPage() { // ✅ Give a unique name for the page component
  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="block md:hidden">
        <MobileHeader />
      </div>

      <div className="p-4 pt-6 md:pt-24 max-w-6xl mx-auto">
        {/* Contract Jobs Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <ContractJobs /> {/* 🔥 Displays contract jobs */}
        </motion.div>

        {/* Image Grid Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
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
              alt="Onsite Jobs"
              layout="responsive"
              width={500}
              height={300}
              className="group-hover:scale-105 transition duration-300"
            />
            <div className="absolute inset-0 bg-black/30 flex items-end justify-end p-4">
              <Link href="/hybrid">
                <button className="bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 hover:text-white transition">
                  View Hybrid Jobs
                </button>
              </Link>
            </div>
          </div>

          {/* Onsite Jobs */}
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
              <Link href="/onsite">
                <button className="bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 hover:text-white transition">
                  Onsite Jobs
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Category Tags */}
        <h3 className="text-lg font-semibold mb-4">Browse by Profession</h3>
        <div className="flex flex-wrap gap-2 mb-20">
          {categories.map((cat) => (
            <Link href={`/job/alljobs?category=${encodeURIComponent(cat)}`} key={cat}>
              <span className="cursor-pointer px-4 py-2 bg-white shadow text-sm font-medium border border-gray-200 rounded-full hover:bg-orange-600 hover:text-white transition">
                {cat}
              </span>
            </Link>
          ))}
        </div>

        {/* Desktop Only Footer */}
        <div className="hidden md:block">
          <Footer />
        </div>
      </div>
    </div>
  );
}
