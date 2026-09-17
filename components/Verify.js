'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Upload,
  Loader2,
  CreditCard as IdCard,
  Camera,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Fingerprint,
  Car,
  Vote,
  BookOpen,
  Sun,
  Eye,
  Ban,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

/* --------------------------------------------------------------
   ID types
-------------------------------------------------------------- */
const ID_TYPES = [
  { id: 'nin', label: 'NIN', sub: 'National Identity Number', Icon: Fingerprint },
  { id: 'drivers_license', label: "Driver's License", sub: 'Issued by FRSC', Icon: Car },
  { id: 'voters_card', label: "Voter's Card", sub: 'Permanent Voter Card', Icon: Vote },
  { id: 'international_passport', label: 'International Passport', sub: 'Nigerian passport booklet', Icon: BookOpen },
];

/* --------------------------------------------------------------
   Progress dots
-------------------------------------------------------------- */
function ProgressDots({ step, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{
            width: i < step ? 22 : 6,
            backgroundColor: i < step ? '#f97316' : '#e5e7eb',
          }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="h-1.5 rounded-full"
        />
      ))}
    </div>
  );
}

/* --------------------------------------------------------------
   Main component
-------------------------------------------------------------- */
export default function Verify() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState(null);

  const [idCardFile, setIdCardFile] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState('');
  const [idType, setIdType] = useState(null);

  const [selfie, setSelfie] = useState('');
  const webcamRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  // flow
  const [step, setStep] = useState(1); // 1 selfie, 2 id type, 3 upload, 4 review, 5 done
  const [cameraOpen, setCameraOpen] = useState(false);
  const TOTAL_STEPS = 4;

  const canEdit = useMemo(() => {
    if (!verification) return true;
    return verification.approved !== 'verified';
  }, [verification]);

  /* ---------- Load user & verification record ---------- */
  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user: authedUser },
          error: authErr,
        } = await supabase.auth.getUser();

        if (authErr || !authedUser) {
          setStatus({ type: 'error', text: 'Please log in to continue.' });
          setLoading(false);
          return;
        }
        setUser(authedUser);
        const uid = authedUser.id;

        let detectedRole = null;
        let name = '';

        const { data: emp } = await supabase
          .from('employers')
          .select('id, name')
          .eq('id', uid)
          .maybeSingle();

        if (emp) {
          detectedRole = 'client';
          name = emp.name || '';
        } else {
          const { data: app } = await supabase
            .from('applicants')
            .select('id, full_name')
            .eq('id', uid)
            .maybeSingle();
          if (app) {
            detectedRole = 'applicant';
            name = app.full_name || '';
          }
        }

        if (!detectedRole) {
          setStatus({
            type: 'error',
            text: 'Complete your profile in Settings first.',
          });
          setLoading(false);
          return;
        }

        setRole(detectedRole);
        setProfileName(name);

        const { data: existing } = await supabase
          .from('verifications')
          .select('*')
          .eq('user_id', uid)
          .maybeSingle();

        if (existing) {
          setVerification(existing);
          setIdCardPreview(existing.id_card_url || '');
          setSelfie(existing.selfie_url || '');
          if (
            existing.approved === 'verified' ||
            existing.approved === 'pending'
          ) {
            setStep(5);
          }
        }
      } catch (e) {
        console.error(e);
        setStatus({
          type: 'error',
          text: 'Unexpected error. Please refresh.',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- ID card picker ---------- */
  const onPickIdCard = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpeg|jpg)$/.test(f.type)) {
      setStatus({ type: 'error', text: 'ID card must be PNG or JPEG.' });
      return;
    }
    setIdCardFile(f);
    setIdCardPreview(URL.createObjectURL(f));
    setStatus({ type: '', text: '' });
  };

  /* ---------- Selfie ---------- */
  const onCaptureSelfie = () => {
    const src = webcamRef.current?.getScreenshot();
    if (src) {
      setSelfie(src);
      setCameraOpen(false);
    }
  };

  const retakeSelfie = () => {
    setSelfie('');
    setCameraOpen(true);
  };

  /* ---------- Upload helper ---------- */
  const getFolder = (kind, userRole) => {
    if (userRole === 'client') {
      return kind === 'id' ? 'client_id' : 'client_selfi';
    }
    return kind === 'id' ? 'applicant_id' : 'applicant_selfi';
  };

  const uploadToVerifyBucket = async (file, kind, uid, userRole) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const fileName = `${uid}-${Date.now()}.${safeExt}`;
    const folder = getFolder(kind, userRole);
    const path = `${folder}/${fileName}`;

    const { error: upErr } = await supabase.storage
      .from('verify')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (upErr) throw upErr;

    const { data } = supabase.storage.from('verify').getPublicUrl(path);
    return data.publicUrl;
  };

  /* ---------- Submit ---------- */
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user || !role) return;

    if (!verification) {
      if (!selfie) {
        setStatus({ type: 'error', text: 'Please capture a selfie first.' });
        return;
      }
      if (!idType) {
        setStatus({ type: 'error', text: 'Please select an ID type.' });
        return;
      }
      if (!idCardFile) {
        setStatus({ type: 'error', text: 'Please upload your ID card.' });
        return;
      }
    }

    if (!canEdit) {
      setStatus({ type: 'info', text: 'Already verified.' });
      return;
    }

    setSubmitting(true);
    try {
      const uid = user.id;
      let id_card_url = verification?.id_card_url || '';
      let selfie_url = verification?.selfie_url || '';

      if (idCardFile) {
        id_card_url = await uploadToVerifyBucket(idCardFile, 'id', uid, role);
      }

      if (selfie && selfie.startsWith('data:image')) {
        const res = await fetch(selfie);
        const blob = await res.blob();
        const file = new File([blob], `${uid}-selfie.jpg`, {
          type: 'image/jpeg',
        });
        selfie_url = await uploadToVerifyBucket(file, 'selfi', uid, role);
      }

      if (!id_card_url || !selfie_url) {
        setStatus({
          type: 'error',
          text: 'Both ID card and selfie are required.',
        });
        setSubmitting(false);
        return;
      }

      let result;
      if (!verification) {
        const { data, error } = await supabase
          .from('verifications')
          .insert([
            {
              user_id: uid,
              role,
              id_card_url,
              selfie_url,
              approved: 'pending',
            },
          ])
          .select()
          .maybeSingle();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('verifications')
          .update({
            id_card_url,
            selfie_url,
            approved: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', verification.id)
          .eq('user_id', uid)
          .select()
          .maybeSingle();
        if (error) throw error;
        result = data || verification;
      }

      setVerification(result);
      setStatus({ type: 'success', text: 'Submitted! Pending review.' });
      setStep(5);
    } catch (err) {
      console.error('Submission failed:', err.message || err);
      setStatus({
        type: 'error',
        text: 'Submission failed. Try again or contact support.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => setStep((s) => Math.min(s + 1, 4));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  /* ---------- Blocked ---------- */
  if (!role) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <div className="w-11 h-11 rounded-xl bg-red-50 mx-auto flex items-center justify-center mb-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
        <h2 className="text-sm font-semibold text-gray-900">
          Verification unavailable
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {status.text || 'Please complete your profile settings first.'}
        </p>
      </div>
    );
  }

  const selectedIdType = ID_TYPES.find((t) => t.id === idType);

  /* ==============================================================
     RENDER
  ============================================================== */
  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-500">
                Identity Verification
              </p>
              <p className="text-xs text-gray-500 truncate">
                {profileName ? `For ${profileName}` : 'Verify your identity'}
              </p>
            </div>
            {step < 5 && <ProgressDots step={step} total={TOTAL_STEPS} />}
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <AnimatePresence mode="wait">
            {/* ---------- STEP 1 — SELFIE ---------- */}
            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {!selfie && !cameraOpen && (
                  /* Consent prompt */
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Ready to take a selfie?
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        We'll open your camera for one photo. It'll only be used
                        for identity verification.
                      </p>
                    </div>

                    <ul className="space-y-2.5">
                      {[
                        { Icon: Sun, text: 'Good lighting on your face' },
                        { Icon: Eye, text: 'Look straight at the camera' },
                        { Icon: Ban, text: 'No hats, sunglasses, or filters' },
                      ].map(({ Icon, text }, i) => (
                        <li key={i} className="flex items-center gap-2.5">
                          <div className="shrink-0 w-6 h-6 rounded-md bg-orange-50 border border-orange-100 flex items-center justify-center">
                            <Icon className="w-3 h-3 text-orange-500" />
                          </div>
                          <p className="text-xs text-gray-700">{text}</p>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => setCameraOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-orange-500 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      I'm ready
                    </button>
                  </div>
                )}

                {!selfie && cameraOpen && (
                  /* Camera active — small circular viewport */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Center your face
                      </h3>
                      <button
                        type="button"
                        onClick={() => setCameraOpen(false)}
                        className="text-xs text-gray-500 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Circular camera viewport */}
                    <div className="flex justify-center">
                      <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full overflow-hidden bg-black ring-1 ring-gray-200 shadow-inner">
                        <Webcam
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          className="absolute inset-0 w-full h-full object-cover"
                          mirrored
                          videoConstraints={{
                            facingMode: 'user',
                            width: 640,
                            height: 640,
                          }}
                        />

                        {/* Dashed face-guide ring */}
                        <div
                          className="absolute inset-3 rounded-full border-2 border-dashed border-white/50 pointer-events-none"
                          aria-hidden="true"
                        />

                        {/* Soft inner vignette */}
                        <div
                          className="absolute inset-0 rounded-full pointer-events-none"
                          style={{
                            boxShadow: 'inset 0 0 24px 12px rgba(0,0,0,0.35)',
                          }}
                          aria-hidden="true"
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-center text-gray-500">
                      Keep your face inside the circle
                    </p>

                    <button
                      type="button"
                      onClick={onCaptureSelfie}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Capture
                    </button>
                  </div>
                )}

                {selfie && (
                  /* Captured */
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <p className="text-sm font-medium text-gray-900">
                        Selfie captured
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-full overflow-hidden bg-gray-50 ring-1 ring-gray-200">
                        <img
                          src={selfie}
                          alt="Selfie"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={retakeSelfie}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Retake
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ---------- STEP 2 — ID TYPE ---------- */}
            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Choose your ID type
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Which government-issued ID will you upload?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {ID_TYPES.map(({ id, label, sub, Icon }) => {
                    const active = idType === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setIdType(id)}
                        className={`flex flex-col items-start gap-2 text-left p-3 rounded-xl border transition-all ${
                          active
                            ? 'border-orange-400 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            active
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-semibold leading-tight ${
                              active ? 'text-orange-700' : 'text-gray-900'
                            }`}
                          >
                            {label}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                            {sub}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ---------- STEP 3 — UPLOAD ---------- */}
            {step === 3 && (
              <motion.div
                key="s3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Upload your {selectedIdType?.label || 'ID'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    All four corners visible, no blur, text legible.
                  </p>
                </div>

                <label
                  className={`block relative rounded-xl border-2 border-dashed bg-gray-50 overflow-hidden cursor-pointer transition-colors ${
                    idCardPreview
                      ? 'border-green-300'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={onPickIdCard}
                    disabled={!canEdit}
                  />
                  <div className="aspect-[3/2] flex items-center justify-center">
                    {idCardPreview ? (
                      <img
                        src={idCardPreview}
                        alt="ID"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-400 text-xs flex flex-col items-center gap-1.5">
                        <Upload size={18} />
                        <span>PNG or JPEG</span>
                      </div>
                    )}
                  </div>
                </label>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 truncate max-w-[60%]">
                    {idCardFile ? (
                      <span className="inline-flex items-center gap-1 text-green-700">
                        <CheckCircle2 className="w-3 h-3" />
                        {idCardFile.name}
                      </span>
                    ) : (
                      'No file selected'
                    )}
                  </span>
                  <span className="text-orange-600 hover:text-orange-700 font-semibold cursor-pointer">
                    {idCardPreview ? 'Change' : 'Choose'}
                  </span>
                </div>
              </motion.div>
            )}

            {/* ---------- STEP 4 — REVIEW ---------- */}
            {step === 4 && (
              <motion.div
                key="s4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Review before submitting
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Double-check everything looks right.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-2.5 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        Selfie
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-[10px] text-orange-600 hover:text-orange-700 font-semibold"
                      >
                        Change
                      </button>
                    </div>
                    <div className="aspect-square bg-gray-100 flex items-center justify-center p-2">
                      {selfie ? (
                        <div className="w-24 h-24 rounded-full overflow-hidden ring-1 ring-gray-200">
                          <img
                            src={selfie}
                            alt="Selfie"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400">
                          No selfie
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-2.5 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 truncate">
                        {selectedIdType?.label || 'ID'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="text-[10px] text-orange-600 hover:text-orange-700 font-semibold"
                      >
                        Change
                      </button>
                    </div>
                    <div className="aspect-square bg-gray-100 flex items-center justify-center p-2">
                      {idCardPreview ? (
                        <img
                          src={idCardPreview}
                          alt="ID"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-gray-400">No ID</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-orange-50 border border-orange-100 px-3 py-2">
                  <p className="text-[11px] text-orange-800 leading-relaxed">
                    Encrypted and only visible to our review team.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ---------- STEP 5 — DONE ---------- */}
            {step === 5 && (
              <motion.div
                key="s5"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 240 }}
                  className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
                    verification?.approved === 'verified'
                      ? 'bg-green-100'
                      : 'bg-orange-100'
                  }`}
                >
                  {verification?.approved === 'verified' ? (
                    <CheckCircle2 className="w-7 h-7 text-green-600" />
                  ) : (
                    <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
                  )}
                </motion.div>

                <h3 className="text-base font-bold text-gray-900 mt-3">
                  {verification?.approved === 'verified'
                    ? 'Verification complete'
                    : 'Under review'}
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  {verification?.approved === 'verified'
                    ? 'A verified badge now appears on your profile.'
                    : 'We\u2019ll notify you once the review is done. Usually 24–48h.'}
                </p>

                {verification?.approved === 'pending' && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="mt-4 text-xs text-gray-500 hover:text-gray-800 underline"
                  >
                    Update submission
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---------- Footer nav ---------- */}
          {step < 5 && (
            <div className="flex items-center justify-between gap-2 mt-5 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1}
                className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  step === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>

              {status.text && (
                <div
                  className={`hidden sm:flex items-center gap-1 text-[11px] ${
                    status.type === 'success'
                      ? 'text-green-700'
                      : status.type === 'error'
                      ? 'text-red-700'
                      : 'text-gray-600'
                  }`}
                >
                  {status.type === 'success' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : status.type === 'error' ? (
                    <XCircle className="w-3 h-3" />
                  ) : null}
                  <span className="truncate max-w-[180px]">{status.text}</span>
                </div>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={
                    (step === 1 && !selfie) ||
                    (step === 2 && !idType) ||
                    (step === 3 && !idCardPreview)
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white text-xs font-semibold hover:bg-orange-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={submitting || !canEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white text-xs font-semibold hover:bg-orange-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Submit
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Mobile status */}
          {step < 5 && status.text && (
            <div
              className={`sm:hidden mt-3 text-[11px] text-center ${
                status.type === 'success'
                  ? 'text-green-700'
                  : status.type === 'error'
                  ? 'text-red-700'
                  : 'text-gray-600'
              }`}
            >
              {status.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}