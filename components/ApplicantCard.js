import { motion } from "framer-motion";

export default function ApplicantCard({ applicant, onView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl shadow p-4 flex flex-col items-start gap-3 hover:shadow-md transition cursor-pointer"
      onClick={() => onView(applicant)}
    >
      {/* Avatar + Name */}
      <div className="flex items-center gap-3">
        <img
          src={applicant.avatar_url || "/placeholder-user.png"}
          alt={applicant.full_name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <h3 className="text-lg font-semibold">{applicant.full_name}</h3>
          <p className="text-sm text-gray-500">{applicant.specialties}</p>
        </div>
      </div>

      {/* Bio Preview */}
      <p className="text-sm text-gray-600 line-clamp-3">{applicant.bio}</p>

      {/* View Button */}
      <button className="mt-2 ml-auto text-xs bg-black hover:bg-green-800 text-white px-3 py-1.5 rounded-full transition">
        View Profile
      </button>
    </motion.div>
  );
}
