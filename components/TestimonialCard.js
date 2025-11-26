// components/TestimonialCard.js
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function TestimonialCard() {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("testimonial_id, full_name, avatar_url, testimony")
          .eq("approved", true) // Only fetch approved testimonials
          .order("created_at", { ascending: false });

        if (error) throw error;

        setTestimonials(data || []);
      } catch (err) {
        console.error("Error fetching testimonials:", err.message);
      }
    };

    fetchTestimonials();
  }, []);

  if (testimonials.length === 0) return null;

  // Function to extract first name only
  const getFirstName = (fullName) => {
    return fullName ? fullName.split(' ')[0] : 'User';
  };

  const fallbackAvatar =
    "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff&size=128";

  return (
    <div className="w-full">
      {/* 📱 Mobile horizontal scroll */}
      <div className="md:hidden flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {testimonials.map((t) => (
          <div
            key={t.testimonial_id}
            className="flex-shrink-0 bg-white shadow-lg rounded-lg p-4 text-center w-72"
          >
            <img
              src={t.avatar_url || fallbackAvatar}
              alt={getFirstName(t.full_name)}
              className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
            />
            <h3 className="font-semibold text-gray-800">{getFirstName(t.full_name)}</h3>
            <p className="text-gray-600 text-sm mt-2">{t.testimony}</p>
          </div>
        ))}
      </div>

      {/* 💻 Desktop static grid */}
      <div className="hidden md:grid grid-cols-3 gap-4">
        {testimonials.map((t) => (
          <div
            key={t.testimonial_id}
            className="bg-white shadow-lg rounded-lg p-4 text-center"
          >
            <img
              src={t.avatar_url || fallbackAvatar}
              alt={getFirstName(t.full_name)}
              className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
            />
            <h3 className="font-semibold text-gray-800">{getFirstName(t.full_name)}</h3>
            <p className="text-gray-600 text-sm mt-2">{t.testimony}</p>
          </div>
        ))}
      </div>
    </div>
  );
}