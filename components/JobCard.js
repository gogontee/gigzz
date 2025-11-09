import { useRouter } from "next/router";
import { motion } from "framer-motion";

export default function JobCard({ job, viewMode }) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/job/${job.id}`);
  };

  const avatarUrl =
    job?.avatar_url && job.avatar_url.trim() !== ""
      ? job.avatar_url
      : "https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/icon.png";

  const formattedPay =
    job.min_price && job.max_price
      ? `₦${Number(job.min_price).toLocaleString()} - ₦${Number(
          job.max_price
        ).toLocaleString()}`
      : job.min_price
      ? `₦${Number(job.min_price).toLocaleString()}`
      : job.max_price
      ? `₦${Number(job.max_price).toLocaleString()}`
      : "N/A";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.08 }} // ✅ Hover scale
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      onClick={handleCardClick}
      className={`relative bg-white rounded-xl border border-gray-200 p-4 shadow-sm transition duration-200 cursor-pointer group
        ${viewMode === "list" ? "flex flex-col" : ""}
        hover:shadow-xl hover:border-gray-300`}
    >
      {/* Top Section: avatar, title, pay */}
      <div className="flex flex-col items-start md:flex-row md:justify-between md:items-center mb-2">
        {/* Avatar */}
        <img
          src={avatarUrl}
          alt="Poster Avatar"
          className="w-6 h-6 md:w-6 md:h-6 rounded-full object-cover mb-3 md:mb-0"
        />

        <div className="flex flex-col md:flex-row md:items-center md:ml-3 w-full md:w-auto">
          {/* Job Title */}
          <h2 className="font-semibold text-lg">{job.title}</h2>

          {/* Pay */}
          <div className="flex flex-col items-start md:items-end md:ml-4 mt-1 md:mt-0">
            <span className="text-sm text-orange-500 font-medium">
              {formattedPay}
            </span>
            {job.price_frequency && (
              <span className="text-xs text-gray-400">
                {job.price_frequency}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <p className="text-sm text-gray-400">
        {job.location} • {job.type}
      </p>

      {/* Description */}
      <p className="text-sm text-gray-600 mt-2 leading-snug line-clamp-2">
        {job.description}
      </p>
    </motion.div>
  );
}
