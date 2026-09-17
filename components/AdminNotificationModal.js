'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Users,
  UserCheck,
  Briefcase,
  Search,
  Check,
  Megaphone,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Filter,
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const AUDIENCES = [
  { id: 'all',        label: 'All Users',      Icon: Users },
  { id: 'applicants', label: 'All Applicants', Icon: UserCheck },
  { id: 'employers',  label: 'All Employers',  Icon: Briefcase },
  { id: 'specific',   label: 'Specific Users', Icon: Search },
];

const ROLE_BADGE = {
  applicant: 'bg-orange-100 text-orange-700',
  employer:  'bg-blue-100 text-blue-700',
  admin:     'bg-purple-100 text-purple-700',
};

export default function AdminNotificationModal({ isOpen, onClose, onSent }) {
  // Data
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Audience
  const [audience, setAudience] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Filters (specific mode)
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'applicant' | 'employer'
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  // Compose
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');

  // Status
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const modalRef = useRef(null);

  /* ------------------------------------------------------------
     Load + merge users / applicants / employers
  ------------------------------------------------------------ */
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    const loadAll = async () => {
      setLoadingUsers(true);

      const [usersRes, applicantsRes, employersRes] = await Promise.all([
        supabase.from('users').select('id, role'),
        supabase.from('applicants').select('id, full_name, email, state, city'),
        supabase.from('employers').select('id, name'),
      ]);

      if (!mounted) return;

      if (usersRes.error) console.error('users:', usersRes.error);
      if (applicantsRes.error) console.error('applicants:', applicantsRes.error);
      if (employersRes.error) console.error('employers:', employersRes.error);

      const applicantMap = new Map(
        (applicantsRes.data || []).map((a) => [a.id, a])
      );
      const employerMap = new Map(
        (employersRes.data || []).map((e) => [e.id, e])
      );

      const merged = (usersRes.data || []).map((u) => {
        if (u.role === 'applicant') {
          const a = applicantMap.get(u.id) || {};
          return {
            id: u.id,
            role: 'applicant',
            display_name: a.full_name || 'Unnamed applicant',
            email: a.email || null,
            state: a.state || null,
            city: a.city || null,
          };
        }
        if (u.role === 'employer') {
          const e = employerMap.get(u.id) || {};
          return {
            id: u.id,
            role: 'employer',
            display_name: e.name || 'Unnamed employer',
            email: null,
            state: null,
            city: null,
          };
        }
        return {
          id: u.id,
          role: u.role || 'unknown',
          display_name: 'Admin',
          email: null,
          state: null,
          city: null,
        };
      });

      setUsers(merged);
      setLoadingUsers(false);
    };

    loadAll();

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  /* ------------------------------------------------------------
     Reset on close
  ------------------------------------------------------------ */
  useEffect(() => {
    if (!isOpen) {
      setAudience('all');
      setSelectedIds(new Set());
      setSearch('');
      setRoleFilter('all');
      setStateFilter('');
      setCityFilter('');
      setTitle('');
      setMessage('');
      setLink('');
      setCtaLabel('');
      setFeedback(null);
      setSending(false);
    }
  }, [isOpen]);

  /* ------------------------------------------------------------
     Click outside to close
  ------------------------------------------------------------ */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        if (!sending) onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, sending]);

  /* ------------------------------------------------------------
     Derived lists
  ------------------------------------------------------------ */
  const applicantsOnly = useMemo(
    () => users.filter((u) => u.role === 'applicant'),
    [users]
  );

  const availableStates = useMemo(() => {
    const set = new Set();
    applicantsOnly.forEach((u) => {
      if (u.state) set.add(u.state);
    });
    return Array.from(set).sort();
  }, [applicantsOnly]);

  const availableCities = useMemo(() => {
    const set = new Set();
    applicantsOnly.forEach((u) => {
      if (stateFilter && u.state !== stateFilter) return;
      if (u.city) set.add(u.city);
    });
    return Array.from(set).sort();
  }, [applicantsOnly, stateFilter]);

  useEffect(() => {
    if (cityFilter && !availableCities.includes(cityFilter)) {
      setCityFilter('');
    }
  }, [availableCities, cityFilter]);

  const showLocationFilters =
    roleFilter === 'applicant' || roleFilter === 'all';

  const filteredUsers = useMemo(() => {
    let list = users.filter((u) => u.role !== 'admin');

    if (roleFilter !== 'all') {
      list = list.filter((u) => u.role === roleFilter);
    }
    if (stateFilter) {
      list = list.filter((u) => u.role === 'applicant' && u.state === stateFilter);
    }
    if (cityFilter) {
      list = list.filter((u) => u.role === 'applicant' && u.city === cityFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((u) => {
        const name = (u.display_name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }

    return list;
  }, [users, roleFilter, stateFilter, cityFilter, search]);

  /* ------------------------------------------------------------
     Selection helpers
  ------------------------------------------------------------ */
  const toggleUser = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredUsers.forEach((u) => next.add(u.id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  /* ------------------------------------------------------------
     Audience count preview
  ------------------------------------------------------------ */
  const audienceCount = useMemo(() => {
    if (audience === 'all') {
      return users.filter((u) => u.role !== 'admin').length;
    }
    if (audience === 'applicants') {
      return users.filter((u) => u.role === 'applicant').length;
    }
    if (audience === 'employers') {
      return users.filter((u) => u.role === 'employer').length;
    }
    if (audience === 'specific') {
      return selectedIds.size;
    }
    return 0;
  }, [audience, users, selectedIds]);

  /* ------------------------------------------------------------
     Send
  ------------------------------------------------------------ */
  const handleSend = async () => {
    setFeedback(null);

    if (!title.trim()) {
      setFeedback({ type: 'error', text: 'Please add a title.' });
      return;
    }
    if (!message.trim()) {
      setFeedback({ type: 'error', text: 'Please add a message.' });
      return;
    }
    if (audience === 'specific' && selectedIds.size === 0) {
      setFeedback({ type: 'error', text: 'Select at least one user.' });
      return;
    }

    setSending(true);

    let targetIds = null;
    if (audience === 'applicants') {
      targetIds = users.filter((u) => u.role === 'applicant').map((u) => u.id);
    } else if (audience === 'employers') {
      targetIds = users.filter((u) => u.role === 'employer').map((u) => u.id);
    } else if (audience === 'specific') {
      targetIds = Array.from(selectedIds);
    }

    const metadata = {};
    if (ctaLabel.trim()) metadata.cta_label = ctaLabel.trim();

    const { data, error } = await supabase.rpc('admin_send_notification', {
      p_target_user_ids: targetIds,
      p_type: 'admin_announcement',
      p_title: title.trim(),
      p_message: message.trim(),
      p_link: link.trim() || null,
      p_metadata: metadata,
    });

    setSending(false);

    if (error) {
      console.error('Send failed:', error);
      setFeedback({ type: 'error', text: error.message || 'Failed to send.' });
      return;
    }

    setFeedback({
      type: 'success',
      text: `Sent to ${data ?? audienceCount} user(s). 🎉`,
    });

    setTimeout(() => {
      onSent?.();
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 pb-10 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, y: -20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Send Notification
              </h2>
              <p className="text-xs text-gray-500">
                Broadcast a message to selected users
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={sending}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Audience */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Audience
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AUDIENCES.map(({ id, label, Icon }) => {
                const active = audience === id;
                return (
                  <button
                    key={id}
                    onClick={() => setAudience(id)}
                    className={`relative flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                      active
                        ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-100'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        active ? 'text-orange-500' : 'text-gray-500'
                      }`}
                    />
                    <span
                      className={`text-xs font-semibold ${
                        active ? 'text-orange-700' : 'text-gray-800'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specific user picker */}
          <AnimatePresence>
            {audience === 'specific' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 space-y-3">
                  {/* Search + role */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none bg-white"
                      />
                    </div>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none bg-white"
                    >
                      <option value="all">All roles</option>
                      <option value="applicant">Applicants</option>
                      <option value="employer">Employers</option>
                    </select>
                  </div>

                  {/* Location */}
                  {showLocationFilters && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <select
                          value={stateFilter}
                          onChange={(e) => setStateFilter(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none bg-white appearance-none"
                        >
                          <option value="">All states</option>
                          {availableStates.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="relative flex-1">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <select
                          value={cityFilter}
                          onChange={(e) => setCityFilter(e.target.value)}
                          disabled={!stateFilter && availableCities.length === 0}
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none bg-white appearance-none disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <option value="">All cities</option>
                          {availableCities.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {(stateFilter || cityFilter) && (
                        <button
                          onClick={() => {
                            setStateFilter('');
                            setCityFilter('');
                          }}
                          className="text-xs text-gray-500 hover:text-orange-600 font-medium px-2 self-start sm:self-center whitespace-nowrap"
                        >
                          Reset location
                        </button>
                      )}
                    </div>
                  )}

                  {/* Selection controls */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {selectedIds.size} selected
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={selectAllFiltered}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Select all shown
                      </button>
                      <span className="text-gray-300">·</span>
                      <button
                        onClick={clearSelection}
                        className="text-gray-500 hover:text-gray-700 font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* User list */}
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white divide-y divide-gray-50">
                    {loadingUsers ? (
                      <div className="p-6 flex justify-center">
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-400">
                        No users match your filters.
                      </div>
                    ) : (
                      filteredUsers.map((u) => {
                        const selected = selectedIds.has(u.id);
                        return (
                          <button
                            key={u.id}
                            onClick={() => toggleUser(u.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                              selected ? 'bg-orange-50/60' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                selected
                                  ? 'bg-orange-500 border-orange-500'
                                  : 'border-gray-300'
                              }`}
                            >
                              {selected && (
                                <Check
                                  className="w-3 h-3 text-white"
                                  strokeWidth={3}
                                />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {u.display_name}
                              </p>
                              <p className="text-[11px] text-gray-500 truncate">
                                {u.email || '—'}
                                {u.city && u.state && (
                                  <> · {u.city}, {u.state}</>
                                )}
                              </p>
                            </div>

                            {u.role && (
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                                  ROLE_BADGE[u.role] ||
                                  'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {u.role}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="e.g. New feature: Portfolios are live 🎨"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
            />
            <p className="text-[10px] text-gray-400 mt-1 text-right">
              {title.length}/80
            </p>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Write a short message users will see in their notifications."
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-1 text-right">
              {message.length}/300
            </p>
          </div>

          {/* Link + CTA */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Link (optional)
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="/news/v2-launch"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                CTA Label (optional)
              </label>
              <input
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                maxLength={24}
                placeholder="e.g. Read More"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
              />
            </div>
          </div>

          {/* Preview */}
          {(title || message) && (
            <div className="rounded-xl border border-dashed border-gray-300 p-3 bg-gray-50/60">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
                Preview
              </p>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-purple-100 text-purple-600">
                  <Megaphone className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {title || 'Notification title'}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                    {message || 'Your message will appear here.'}
                  </p>
                  {link && ctaLabel && (
                    <span className="inline-block mt-2 text-[10px] font-semibold px-2.5 py-1 rounded-md bg-black text-white">
                      {ctaLabel} →
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium ${
                  feedback.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                {feedback.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/60">
          <p className="text-xs text-gray-500">
            Will send to{' '}
            <span className="font-semibold text-gray-800">{audienceCount}</span>{' '}
            user{audienceCount === 1 ? '' : 's'}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <motion.button
              whileHover={!sending ? { scale: 1.02 } : {}}
              whileTap={!sending ? { scale: 0.98 } : {}}
              onClick={handleSend}
              disabled={sending || audienceCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {sending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send Notification
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}