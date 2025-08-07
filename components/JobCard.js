import { useRouter } from "next/router";
import { motion } from "framer-motion";

export default function JobCard({ job, viewMode }) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/job/${job.id}`);
  };

  const handleApplyClick = (e) => {
    e.stopPropagation(); // Prevent triggering card click
    router.push(`/job/${job.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      onClick={handleCardClick}
      className={`relative bg-white rounded-xl p-4 shadow-sm transition duration-200 cursor-pointer group
        ${viewMode === "list" ? "flex flex-col" : ""}
        hover:border-black hover:ring-1 hover:ring-black hover:shadow-md`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <h2 className="font-semibold text-lg">{job.title}</h2>
        <span className="text-xs text-orange-500 font-medium">{job.pay}</span>
      </div>

      {/* Poster Avatar */}
      <div className="flex items-center gap-2 mb-1">
        <img
          src={job.poster_avatar || "https://i.pravatar.cc/32?img=5"}
          alt="Poster Avatar"
          className="w-7 h-7 rounded-full object-cover"
        />
      </div>

      {/* Meta Info */}
      <p className="text-sm text-gray-400">
        {job.location} • {job.type}
      </p>

      {/* Description */}
      <p className="text-sm text-gray-600 mt-2 leading-snug line-clamp-2">
        {job.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-3 mb-10">
        {Array.isArray(job.tags) &&
          job.tags.map((tag, i) => (
            <span
              key={i}
              className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700"
            >
              {tag}
            </span>
          ))}
      </div>

      {/* Floating Apply Button */}
      <button
        onClick={handleApplyClick}
        className="absolute bottom-2 right-3 bg-black hover:bg-orange-400 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow transition"
      >
        Apply
      </button>
    </motion.div>
  );
}
