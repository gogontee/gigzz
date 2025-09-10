'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import Webcam from 'react-webcam';
import {
  CheckCircle2,
  XCircle,
  Upload,
  Loader2,
  CreditCard as IdCard,
  Camera,
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

export default function Verify() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState(null);

  const [idCardFile, setIdCardFile] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState('');

  const [selfie, setSelfie] = useState('');
  const webcamRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  const [tab, setTab] = useState('idcard'); // toggle state

  const canEdit = useMemo(() => {
    if (!verification) return true;
    return verification.approved !== 'verified';
  }, [verification]);

  // Load user & verification record
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

        // check employer
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
            text: 'No matching profile found. click setting on your dashboard and updated your profile first.',
          });
          setLoading(false);
          return;
        }

        setRole(detectedRole);
        setProfileName(name);

        const { data: existing, error: verErr } = await supabase
          .from('verifications')
          .select('*')
          .eq('user_id', uid)
          .maybeSingle();

        if (verErr) {
          console.error('Fetch verifications error:', verErr);
        }
        if (existing) {
          setVerification(existing);
          setIdCardPreview(existing.id_card_url || '');
          setSelfie(existing.selfie_url || '');
        }
      } catch (e) {
        console.error(e);
        setStatus({ type: 'error', text: 'Unexpected error. Please refresh.' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Pick ID card
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

  // Folder logic for verify bucket
  const getFolder = (kind, userRole) => {
    if (userRole === 'client') {
      return kind === 'id' ? 'client_id' : 'client_selfi';
    } else {
      return kind === 'id' ? 'applicant_id' : 'applicant_selfi';
    }
  };

  // Upload helper
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

    const { data } = await supabase.storage.from('verify').getPublicUrl(path);
    return data.publicUrl;
  };

  // Capture selfie
  const onCaptureSelfie = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setSelfie(imageSrc);
    }
  };

  // Submit form
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user || !role) return;

    if (!verification && (!idCardFile || !selfie)) {
      setStatus({ type: 'error', text: 'Both ID card and selfie are required.' });
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
        setStatus({ type: 'error', text: 'Both ID card and selfie are required.' });
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
    } catch (err) {
      console.error('Submission failed:', err.message || err);
      setStatus({ type: 'error', text: 'Submission failed. try agan or contact our support team for help.' });
    } finally {
      setSubmitting(false);
    }
  };

  // UI
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Identity Verification</h1>
          <p className="text-gray-600 mt-1">
            Hi <span className="font-medium">{profileName || 'there'}</span>, please upload a valid ID card and a live selfie, make sure your face is clearly shown.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Role detected: <span className="font-medium">{role}</span>
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab('idcard')}
          type="button"
          className={`flex-1 py-2 text-center font-medium ${
            tab === 'idcard'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-500'
          }`}
        >
          Upload Valid ID
        </button>
        <button
          onClick={() => setTab('selfie')}
          type="button"
          className={`flex-1 py-2 text-center font-medium ${
            tab === 'selfie'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-500'
          }`}
        >
          Take Selfie
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* ID CARD TAB */}
        {tab === 'idcard' && (
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <IdCard size={18} />
              <h3 className="font-semibold">Valid ID Card</h3>
            </div>
            <div className="aspect-[3/2] max-w-xs mx-auto rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
              {idCardPreview ? (
                <img
                  src={idCardPreview}
                  alt="ID Card preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-gray-400 text-sm flex flex-col items-center gap-2 p-4 text-center">
                  <Upload size={20} />
                  Upload PNG or JPEG
                </div>
              )}
            </div>
            <label
              className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-white ${
                canEdit
                  ? 'bg-black hover:bg-orange-600 cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={onPickIdCard}
                disabled={!canEdit}
              />
              Choose ID Image
            </label>
          </div>
        )}

        {/* SELFIE TAB */}
        {tab === 'selfie' && (
          <div className="rounded-xl border border-gray-200 p-4 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera size={18} />
              <h3 className="font-semibold">Take a Selfie</h3>
            </div>
            {!selfie ? (
              <>
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="rounded-lg border w-full max-w-sm"
                />
                <button
                  type="button"
                  onClick={onCaptureSelfie}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                  Capture Selfie
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <img
                  src={selfie}
                  alt="Selfie preview"
                  className="rounded-lg border w-full max-w-sm"
                />
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setSelfie('')}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                  >
                    Retake
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            type="submit"
            disabled={submitting || !canEdit}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm sm:px-6 sm:py-2 sm:text-base text-white transition w-full sm:w-auto ${
              verification?.approved === 'verified'
                ? 'bg-green-600'
                : verification?.approved === 'pending'
                ? 'bg-amber-500'
                : submitting || !canEdit
                ? 'bg-gray-400'
                : 'bg-black hover:bg-orange-600'
            }`}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : verification?.approved === 'verified' ? (
              <CheckCircle2 size={16} />
            ) : (
              <IdCard size={16} />
            )}
            {verification?.approved === 'verified'
              ? 'Verified'
              : verification?.approved === 'pending'
              ? 'Pending Verification'
              : verification
              ? 'Update Submission'
              : 'Submit for Review'}
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
