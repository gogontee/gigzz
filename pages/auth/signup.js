'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../utils/supabaseClient';
import {
  Eye,
  EyeOff,
  MailCheck,
  AlertCircle,
  Upload,
  X,
  ChevronDown,
  Search,
  Check,
  Loader2,
} from 'lucide-react';

/* ------------------------------------------------------------------
   Password input with show/hide toggle
------------------------------------------------------------------ */
function PasswordInput({ value, onChange }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        name="password"
        placeholder="Password (8 or more characters)"
        required
        value={value}
        onChange={onChange}
        className="w-full p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500 pr-10"
      />
      <div
        className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 hover:text-orange-600"
        onClick={() => setShowPassword((prev) => !prev)}
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Searchable dropdown — used for State (single value) and
   City (value + lga). Renders a text input that opens a filtered list.
------------------------------------------------------------------ */
function SearchableSelect({
  id,
  label,
  placeholder,
  options,          // array of { value, label, meta? }
  value,            // current value
  onChange,         // (value, meta) => void
  disabled,
  loading,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 200);
    return options
      .filter((o) => o.label.toLowerCase().includes(q))
      .slice(0, 200);
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  const handleSelect = (opt) => {
    onChange(opt.value, opt.meta);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef} data-field-id={id}>
      <label className="block text-sm text-gray-700 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          id={id}
          type="text"
          disabled={disabled}
          value={open ? query : selected?.label || ''}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery('');
            setOpen(true);
          }}
          className="w-full p-3 pl-9 pr-10 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          autoComplete="off"
        />

        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        ) : (
          <ChevronDown
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        )}

        {/* Clear button when a value is selected */}
        {value && !open && (
          <button
            type="button"
            onClick={() => {
              onChange('', null);
              setQuery('');
            }}
            className="absolute right-9 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
            aria-label={`Clear ${label}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && !disabled && (
        <div className="absolute z-30 mt-1 left-0 right-0 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-gray-500 text-center">
              No matches
            </div>
          ) : (
            filtered.map((opt, idx) => (
              <button
                key={`${opt.value}-${idx}`}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-50 transition-colors flex items-center justify-between ${
                  opt.value === value ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-700'
                }`}
              >
                <span>{opt.label}</span>
                {opt.value === value && <Check className="w-3.5 h-3.5" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Main signup component
------------------------------------------------------------------ */
export default function Signup() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    country: '',
    state: '',
    city: '',
    role: '',
  });

  // Silent LGA — captured from city selection, sent to server but never shown
  const [lga, setLga] = useState(null);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [fileError, setFileError] = useState('');

  // Locations data from Supabase
  const [locations, setLocations] = useState([]);          // raw rows
  const [locationsLoading, setLocationsLoading] = useState(false);

  const isNigeria = form.country.trim().toLowerCase() === 'nigeria';

  /* ---------- Load locations once ---------- */
  useEffect(() => {
    const fetchLocations = async () => {
      setLocationsLoading(true);
      const { data, error } = await supabase
        .from('locations')
        .select('state, cities')
        .order('state', { ascending: true });

      if (error) {
        console.error('Failed to load locations:', error);
      } else {
        setLocations(data || []);
      }
      setLocationsLoading(false);
    };
    fetchLocations();
  }, []);

  /* ---------- Derived dropdown options ---------- */
  const stateOptions = useMemo(
    () => locations.map((l) => ({ value: l.state, label: l.state })),
    [locations]
  );

  const cityOptions = useMemo(() => {
    if (!form.state) return [];
    const row = locations.find((l) => l.state === form.state);
    if (!row || !Array.isArray(row.cities)) return [];

    // Each entry: { lga, name, slug }
    // De-duplicate by name (some cities appear under multiple LGAs)
    const seen = new Set();
    const options = [];
    for (const c of row.cities) {
      if (!c?.name) continue;
      const key = c.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      options.push({
        value: c.name,
        label: c.name,
        meta: { lga: c.lga || null },
      });
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [locations, form.state]);

  /* ---------- Reset city when state changes ---------- */
  useEffect(() => {
    if (isNigeria) {
      // If switching states, clear city since options differ
      setForm((prev) => ({ ...prev, city: '' }));
      setLga(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.state]);

  /* ---------- Reset location fields when country changes ---------- */
  useEffect(() => {
    setForm((prev) => ({ ...prev, state: '', city: '' }));
    setLga(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.country]);

  /* ---------- Basic input handler ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ---------- File handling ---------- */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setFileError('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
      setAvatarFile(null);
      setAvatarPreview('');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size must be less than 5MB');
      setAvatarFile(null);
      setAvatarPreview('');
      return;
    }

    setAvatarFile(file);
    setFileError('');

    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setFileError('');
  };

  /* ---------- Validation + scroll-to-missing ---------- */
  const fieldRefs = {
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
    password: 'password',
    country: 'country',
    state: isNigeria ? 'state-select' : 'state',
    city: isNigeria ? 'city-select' : 'city',
    role: 'role',
    avatar: 'avatar',
    terms: 'terms',
  };

  const scrollToField = (fieldName) => {
    const id = fieldRefs[fieldName];
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Small highlight flash
    el.classList.add('ring-2', 'ring-red-400');
    setTimeout(() => el.classList.remove('ring-2', 'ring-red-400'), 1500);
  };

  const validate = () => {
    const required = [
      ['firstName', form.firstName.trim()],
      ['lastName', form.lastName.trim()],
      ['email', form.email.trim()],
      ['password', form.password.length >= 8],
      ['country', form.country.trim()],
      ['state', form.state.trim()],
      ['city', form.city.trim()],
      ['role', form.role],
      ['avatar', avatarFile],
      ['terms', agreedToTerms],
    ];

    for (const [name, ok] of required) {
      if (!ok) {
        let msg;
        switch (name) {
          case 'firstName': msg = 'Please enter your first name.'; break;
          case 'lastName':  msg = 'Please enter your last name.'; break;
          case 'email':     msg = 'Please enter your email.'; break;
          case 'password':  msg = 'Password must be at least 8 characters long.'; break;
          case 'country':   msg = 'Please enter your country.'; break;
          case 'state':     msg = isNigeria ? 'Please select your state.' : 'Please enter your state / region.'; break;
          case 'city':      msg = isNigeria ? 'Please select your city.' : 'Please enter your city.'; break;
          case 'role':      msg = 'Please choose an account type.'; break;
          case 'avatar':    msg = 'Profile picture is required.'; break;
          case 'terms':     msg = 'You must agree to the Terms of Service to continue.'; break;
          default:          msg = 'Please fill in all required fields.';
        }
        setErrorMsg(msg);
        scrollToField(name);
        return false;
      }
    }

    setErrorMsg('');
    return true;
  };

  /* ---------- Submit ---------- */
  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setVerificationSent(false);

    if (!validate()) return;

    setLoading(true);

    try {
      // Persist avatar in sessionStorage so it can be uploaded post-verification
      const reader = new FileReader();
      reader.onload = () => {
        const pendingPhotoData = {
          fileData: reader.result,
          fileName: avatarFile.name,
          fileType: avatarFile.type,
          folder: 'avatars',
        };
        sessionStorage.setItem('pending_photo', JSON.stringify(pendingPhotoData));
      };
      reader.readAsDataURL(avatarFile);

      // Send everything to our custom signup API
      const payload = {
        ...form,
        lga: lga || null,
        termsAgreement: agreedToTerms, // API will persist as terms_agreement
      };

      const response = await fetch('/api/custom-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Signup failed. Please try again.');
      }

      // If API returned a user id, store the pending photo under that id
      if (result.userId) {
        const pendingPhoto = sessionStorage.getItem('pending_photo');
        if (pendingPhoto) {
          localStorage.setItem(`pending_photo_${result.userId}`, pendingPhoto);
          sessionStorage.removeItem('pending_photo');
        }
      }

      setVerificationSent(true);
      setSuccessMsg(result.message);
    } catch (err) {
      console.error('Signup error:', err);
      setErrorMsg(err.message);
      sessionStorage.removeItem('pending_photo');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Success screen (verification sent) ---------- */
if (verificationSent) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-white px-4 pt-20 pb-10">
      <div className="mb-8">
        <Image
          src="https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/icon.png"
          alt="Gigzz Logo"
          width={50}
          height={50}
          style={{ width: 'auto', height: 'auto' }}
          priority
        />
      </div>

      <div className="w-full max-w-md bg-white border rounded-xl shadow p-8 space-y-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <MailCheck className="w-10 h-10 text-green-500" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>

        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We've sent a verification email to <strong>{form.email}</strong>.
            Please check your inbox and click the verification link to activate your account.
          </p>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-orange-800 text-sm">
              💡 <strong>Can't find the email?</strong> Check your spam folder.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full p-3 rounded-lg bg-black text-white hover:bg-gray-800 transition font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}

  /* ---------- Main form ---------- */
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-white px-4 pt-20 pb-10">
      <div className="mb-8">
        <Image
          src="https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/icon.png"
          alt="Gigzz Logo"
          width={50}
          height={50}
          style={{ width: 'auto', height: 'auto' }}
          priority
        />
      </div>

      <form
        onSubmit={handleSignup}
        className="w-full max-w-md bg-white border rounded-xl shadow p-6 space-y-5"
      >
        <h2 className="text-2xl font-bold text-black text-center">
          Create your Account
        </h2>

        {/* First + Last name */}
        <div className="flex justify-between space-x-2">
          <input
            id="firstName"
            type="text"
            name="firstName"
            placeholder="First name"
            required
            value={form.firstName}
            onChange={handleChange}
            className="w-1/2 p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500 transition-all"
          />
          <input
            id="lastName"
            type="text"
            name="lastName"
            placeholder="Last name"
            required
            value={form.lastName}
            onChange={handleChange}
            className="w-1/2 p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500 transition-all"
          />
        </div>

        {/* Email */}
        <input
          id="email"
          type="email"
          name="email"
          placeholder="example@gmail.com"
          required
          value={form.email}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500 transition-all"
        />

        {/* Password */}
        <div id="password">
          <PasswordInput value={form.password} onChange={handleChange} />
        </div>

        {/* ---------- Avatar Upload with Preview ---------- */}
        <div id="avatar" className="transition-all rounded-lg">
          <label className="block text-sm text-gray-700 mb-2">
            Profile Picture <span className="text-red-500">*</span>
          </label>

          {avatarPreview ? (
            <div className="flex items-center gap-4 p-3 border rounded-lg bg-gray-50">
              <div className="relative">
                <img
                  src={avatarPreview}
                  alt="Profile preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-orange-400"
                />
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition"
                  aria-label="Remove photo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {avatarFile?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {avatarFile ? (avatarFile.size / 1024).toFixed(0) : 0} KB
                </p>
              </div>
              <label className="cursor-pointer text-xs text-orange-600 hover:text-orange-700 font-medium">
                Change
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
                className="w-full p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          )}

          {fileError && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {fileError}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB
          </p>
        </div>

        {/* ---------- Country ---------- */}
        <input
          id="country"
          type="text"
          name="country"
          placeholder="Country"
          value={form.country}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500 transition-all"
          required
        />

        {/* ---------- State — searchable dropdown if Nigeria ---------- */}
        {isNigeria ? (
          <SearchableSelect
            id="state-select"
            label="State"
            placeholder="Search your state"
            options={stateOptions}
            value={form.state}
            onChange={(value) => {
              setForm((prev) => ({ ...prev, state: value }));
              setLga(null);
            }}
            loading={locationsLoading}
          />
        ) : (
          <input
            id="state"
            type="text"
            name="state"
            placeholder="State / Region"
            value={form.state}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500 transition-all"
            required
          />
        )}

        {/* ---------- City — searchable dropdown if Nigeria ---------- */}
        {isNigeria ? (
          <SearchableSelect
            id="city-select"
            label="City"
            placeholder={form.state ? 'Search your city' : 'Select a state first'}
            options={cityOptions}
            value={form.city}
            disabled={!form.state}
            onChange={(value, meta) => {
              setForm((prev) => ({ ...prev, city: value }));
              setLga(meta?.lga || null);
            }}
          />
        ) : (
          <input
            id="city"
            type="text"
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500 transition-all"
            required
          />
        )}

        {/* ---------- Role ---------- */}
        <select
          id="role"
          name="role"
          value={form.role}
          onChange={handleChange}
          required
          className="w-full p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500 transition-all"
        >
          <option value="">Choose account type</option>
          <option value="client">I'm here to list Jobs</option>
          <option value="creative">I'm an Applicant/Creative</option>
        </select>

        {/* ---------- Terms ---------- */}
        <div id="terms" className="flex items-start space-x-2 text-sm rounded transition-all">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 accent-orange-600"
            required
          />
          <label className="text-gray-700">
            Yes, I understand and agree to Gigzz&nbsp;
            <Link
              href="/terms"
              className="text-orange-600 hover:text-black underline"
            >
              Terms of Service
            </Link>
          </label>
        </div>

        {/* ---------- Error ---------- */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </p>
          </div>
        )}

        {/* ---------- Submit ---------- */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading}
          className="w-full p-3 rounded-lg bg-black text-white hover:bg-orange-600 transition disabled:opacity-50 font-medium"
        >
          {loading ? 'Creating Account...' : 'Create my account'}
        </motion.button>

        <div className="text-sm text-center text-gray-600">
          If you have an account,{' '}
          <Link
            href="/auth/login"
            className="text-orange-600 hover:text-black font-semibold"
          >
            login
          </Link>
        </div>
      </form>
    </div>
  );
}