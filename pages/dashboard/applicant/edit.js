import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../../utils/supabaseClient";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

export default function EditApplicantProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    full_name: "",
    phone: "", // full phone including country code
    full_address: "",
    bio: "", // 👈 still store as bio in DB
    specialties: "",
    educational_qualification: "",
    institutions: "",
    country: "",
    state: "",
    city: "",
    date_of_birth: "",
    tags: [],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const bioRef = useRef(null); // 👈 contentEditable ref

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("applicants")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        setError("Failed to load profile.");
        console.error(error);
      } else {
        setForm({
          full_name: data.full_name || "",
          phone: data.phone || "",
          full_address: data.full_address || "",
          bio: data.bio || "", // load bio as HTML
          specialties: data.specialties || "",
          educational_qualification: data.educational_qualification || "",
          institutions: data.institutions || "",
          country: data.country || "",
          state: data.state || "",
          city: data.city || "",
          date_of_birth: data.date_of_birth || "",
          tags: data.tags || [],
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Format phone: replace leading zero with selected country code
  const handlePhoneChange = (value, country) => {
    let formatted = value;

    // ensure "+" prefix
    if (!formatted.startsWith("+")) {
      formatted = `+${formatted}`;
    }

    // Remove leading 0 after the country code
    const dialCode = `+${country.dialCode}`;
    if (formatted.startsWith(dialCode + "0")) {
      formatted = dialCode + formatted.substring(dialCode.length + 1);
    }

    setForm((prev) => ({
      ...prev,
      phone: formatted,
    }));
  };

  const handleBioChange = (e) => {
    setForm((prev) => ({
      ...prev,
      bio: e.currentTarget.innerHTML, // store full HTML
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("applicants").upsert(
      {
        id: user.id,
        full_name: form.full_name,
        phone: form.phone,
        full_address: form.full_address,
        bio: form.bio, // 👈 save formatted HTML
        specialties: form.specialties,
        educational_qualification: form.educational_qualification,
        institutions: form.institutions,
        country: form.country,
        state: form.state,
        city: form.city,
        date_of_birth: form.date_of_birth || null,
        tags: form.tags,
      },
      { onConflict: ["id"] }
    );

    if (error) {
      console.error(error);
      setError("Failed to update profile.");
    } else {
      setSuccess("Profile updated successfully!");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 md:pt-20 bg-white shadow p-6 rounded-xl">
  <h2 className="text-2xl font-bold mb-4 text-center">Edit Profile</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium">Full Name</label>
          <input
            type="text"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2"
            required
          />
        </div>

        {/* Phone with Country Code */}
        <div>
          <label className="block text-sm font-medium">Phone</label>
          <PhoneInput
            country={"ng"} // default Nigeria
            value={form.phone}
            onChange={handlePhoneChange}
            inputClass="w-full border px-4 py-2 rounded"
            containerClass="rounded"
            buttonClass="rounded-l"
            enableSearch={true}
          />
        </div>

        {/* Full Address */}
        <div>
          <label className="block text-sm font-medium">Full Address</label>
          <input
            type="text"
            name="full_address"
            value={form.full_address}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        {/* About Me (Rich Text) */}
<div>
  <label className="block text-sm font-medium">About Me</label>
  <div
  contentEditable
  suppressContentEditableWarning={true}
  className="w-full min-h-[120px] border rounded-lg px-4 py-2 focus:outline-none"
  onInput={(e) => {
    const value = e.currentTarget.innerHTML;
    setForm((prev) => ({ ...prev, bio: value }));
  }}
  // ✅ set initial text only once
  ref={(el) => {
    if (el && !el.innerHTML && form.bio) {
      el.innerHTML = form.bio;
    }
  }}
/>

  <p className="text-xs text-gray-500 mt-1">
    You can use bold, italic, bullet points etc. (Rich text supported)
  </p>
</div>


        {/* Specialties */}
        <div>
          <label className="block text-sm font-medium">Specialties</label>
          <input
            type="text"
            name="specialties"
            value={form.specialties}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="e.g., Full Stack Developer"
          />
        </div>

        {/* Educational Qualification */}
        <div>
          <label className="block text-sm font-medium">
            Educational Qualification
          </label>
          <input
            type="text"
            name="educational_qualification"
            value={form.educational_qualification}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="e.g., B.Sc. Computer Science"
          />
        </div>

        {/* Institutions */}
        <div>
          <label className="block text-sm font-medium">Institutions</label>
          <input
            type="text"
            name="institutions"
            value={form.institutions}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="e.g., Harvard University"
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium">Country</label>
          <input
            type="text"
            name="country"
            value={form.country}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="Country you are currently located"
            required
          />
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-medium">State</label>
          <input
            type="text"
            name="state"
            value={form.state}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="Lagos"
            required
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium">City</label>
          <input
            type="text"
            name="city"
            value={form.city}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="Lekki"
            required
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium">Date of Birth</label>
          <input
            type="date"
            name="date_of_birth"
            value={form.date_of_birth || ""}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium">Tags</label>
          <input
            type="text"
            name="tags"
            value={form.tags.join(", ")}
            onChange={(e) =>
              setForm({
                ...form,
                tags: e.target.value.split(",").map((t) => t.trim()),
              })
            }
            className="w-full border rounded-lg px-4 py-2"
            placeholder="e.g., marketing, branding, multimedia"
          />
        </div>

        {/* Submit + Success message */}
        <div className="flex flex-col items-center space-y-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          {success && <p className="text-green-600">{success}</p>}
        </div>
      </form>
    </div>
  );
}
