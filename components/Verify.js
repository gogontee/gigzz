// components/Verify.js
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  XCircle,
  Upload,
  Loader2,
  CreditCard as IdCard,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Verify() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState(null);

  const [idCardFile, setIdCardFile] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState('');

  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  // Camera refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  const canEdit = useMemo(() => {
    if (!verification) return true;
    return verification.approved !== 'verified';
  }, [verification]);

  // Bootstrap user + verification
  useEffect(() => {
    (async () => {
      try {
        const { data: { user: authedUser }, error: authErr } = await supabase.auth.getUser();
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
          setStatus({ type: 'error', text: 'No matching profile found. Complete your profile first.' });
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
          setSelfiePreview(existing.selfie_url || '');
        }
      } catch (e) {
        console.error(e);
        setStatus({ type: 'error', text: 'Unexpected error. Please refresh.' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Handlers
  const onPickIdCard = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpeg|jpg)$/.test(f.type)) {
      setStatus({ type: 'error', text: 'ID card must be PNG or JPEG.' });
      return;
    }
    setIdCardFile(f);
    setIdCardPreview(URL.createObjectURL(f));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', text: 'Camera access denied. Please allow camera permissions.' });
    }
  };

  const takeSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Generate preview (base64 string)
    const dataUrl = canvas.toDataURL('image/jpeg');
    setSelfiePreview(dataUrl);

    // Also create File for upload
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelfieFile(file);
      }
    }, 'image/jpeg');

    setCameraActive(false);

    // Stop stream
    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
  };

  const uploadToVerifyBucket = async (file, kind, uid, userRole) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const fileName = `${uid}-${Date.now()}.${safeExt}`;
    const path = `${userRole === 'client' ? 'clients' : 'applicants'}/${kind}/${fileName}`;

    const { error: upErr } = await supabase.storage
      .from('verify')
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });

    if (upErr) throw upErr;

    const { data } = await supabase.storage.from('verify').getPublicUrl(path);
    return data.publicUrl;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user || !role) return;

    if (!verification && (!idCardFile || !selfieFile)) {
      setStatus({ type: 'error', text: 'Please upload ID and take a selfie.' });
      return;
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
        id_card_url = await uploadToVerifyBucket(idCardFile, 'idcards', uid, role);
      }
      if (selfieFile) {
        selfie_url = await uploadToVerifyBucket(selfieFile, 'selfies', uid, role);
      }

      if (!id_card_url || !selfie_url) {
        setStatus({ type: 'error', text: 'Both ID and selfie required.' });
        setSubmitting(false);
        return;
      }

      if (!verification) {
        const { data, error } = await supabase
          .from('verifications')
          .insert({
            user_id: uid,
            role,
            id_card_url,
            selfie_url,
            approved: 'unverified',
          })
          .select()
          .maybeSingle();
        if (error) throw error;
        setVerification(data);
      } else {
        const { data, error } = await supabase
          .from('verifications')
          .update({ id_card_url, selfie_url })
          .eq('id', verification.id)
          .eq('user_id', uid)
          .eq('approved', 'unverified')
          .select()
          .maybeSingle();
        if (error) throw error;
        setVerification(data || verification);
      }

      setStatus({ type: 'success', text: 'Submitted! Pending review.' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', text: 'Submission failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }
  if (!user || !role) {
    return (
      <div className="max-w-xl mx-auto p-6 rounded-xl border bg-white">
        <p className="text-red-600">Unable to load verification. Please log in and complete your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Identity Verification</h1>
          <p className="text-gray-600 mt-1">
            Hi <span className="font-medium">{profileName || 'there'}</span>, please upload a valid ID card and take a selfie.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Role detected: <span className="font-medium">{role}</span>
          </p>
        </div>
        {verification?.approved === 'verified' ? (
          <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
            <CheckCircle2 size={16} /> Verified
          </span>
        ) : verification ? (
          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            <IdCard size={16} /> Pending review
          </span>
        ) : null}
      </header>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ID Card */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <IdCard size={18} />
              <h3 className="font-semibold">Valid ID Card</h3>
            </div>
            <div className="aspect-[4/3] rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
              {idCardPreview ? (
                <img src={idCardPreview} alt="ID Card preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400 text-sm flex flex-col items-center gap-2 p-4 text-center">
                  <Upload size={20} />
                  Upload PNG or JPEG
                </div>
              )}
            </div>
            <label className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-white ${canEdit ? 'bg-black hover:bg-orange-600 cursor-pointer' : 'bg-gray-400 cursor-not-allowed'}`}>
              <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={onPickIdCard} disabled={!canEdit} />
              Choose ID Image
            </label>
          </div>

          {/* Selfie */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera size={18} />
              <h3 className="font-semibold">Headshot Selfie</h3>
            </div>

            <div className="aspect-square rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden relative">
              {cameraActive ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : selfiePreview ? (
                <img src={selfiePreview} alt="Selfie preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400 text-sm flex flex-col items-center gap-2 p-4 text-center">
                  <Camera size={20} />
                  Click "Open Camera" to take your selfie.
                  <p className="text-xs text-gray-500 mt-1">Make sure there is enough light for better image quality.</p>
                </div>
              )}
            </div>

            {cameraActive ? (
              <button
                type="button"
                onClick={takeSelfie}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-white bg-black hover:bg-orange-600"
              >
                Capture Selfie
              </button>
            ) : (
              <button
                type="button"
                onClick={startCamera}
                disabled={!canEdit}
                className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-white ${
                  canEdit ? 'bg-black hover:bg-orange-600' : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Open Camera
              </button>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting || !canEdit}
            className={`inline-flex items-center gap-2 rounded-full px-6 py-2 text-white ${submitting || !canEdit ? 'bg-gray-400' : 'bg-black hover:bg-orange-600'} transition`}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 size={16} />}
            {verification ? 'Update Submission' : 'Submit for Review'}
          </button>
          {status.text && (
            <div
              className={`text-sm inline-flex items-center gap-1 ${
                status.type === 'success'
                  ? 'text-green-700'
                  : status.type === 'error'
                  ? 'text-red-700'
                  : 'text-gray-700'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 size={16} />
              ) : status.type === 'error' ? (
                <XCircle size={16} />
              ) : (
                <IdCard size={16} />
              )}
              <span>{status.text}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
