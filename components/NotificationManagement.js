'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  Filter,
  Loader2,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  Eye,
  X,
  ChevronDown,
  Megaphone,
  Calendar,
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

/* ------------------------------------------------------------
   Group individual notification rows into "broadcasts"
   Two rows belong to the same broadcast if their title,
   message, link, and metadata are identical AND their
   created_at is within 60 seconds of each other.
------------------------------------------------------------ */
function groupIntoBroadcasts(rows) {
  const sorted = [...rows].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const groups = [];

  for (const row of sorted) {
    const metaStr = JSON.stringify(row.metadata || {});
    const found = groups.find((g) => {
      if (g.title !== row.title) return false;
      if (g.message !== row.message) return false;
      if ((g.link || '') !== (row.link || '')) return false;
      if (JSON.stringify(g.metadata || {}) !== metaStr) return false;

      const diff = Math.abs(
        new Date(g.created_at).getTime() - new Date(row.created_at).getTime()
      );
      return diff < 60 * 1000; // within 60 seconds
    });

    if (found) {
      found.recipients.push(row);
      found.total += 1;
      if (row.is_read) found.read += 1;
    } else {
      groups.push({
        id: row.id, // representative id
        title: row.title,
        message: row.message,
        link: row.link,
        metadata: row.metadata || {},
        created_at: row.created_at,
        recipients: [row],
        total: 1,
        read: row.is_read ? 1 : 0,
      });
    }
  }

  return groups;
}

export default function NotificationManagement() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [broadcasts, setBroadcasts] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month'

  // Expanded broadcast (show recipients)
  const [expandedId, setExpandedId] = useState(null);

  // Deleting states
  const [deleting, setDeleting] = useState(false);

  /* ------------------------------------------------------------
     Load notifications
  ------------------------------------------------------------ */
  const loadNotifications = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'admin_announcement')
      .order('created_at', { ascending: false })
      .limit(2000);

    if (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setBroadcasts(groupIntoBroadcasts(data || []));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  /* ------------------------------------------------------------
     Realtime subscription — auto-refresh on new/updated rows
  ------------------------------------------------------------ */
  useEffect(() => {
    const channel = supabase
      .channel('admin-notification-management')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: 'type=eq.admin_announcement',
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications]);

  /* ------------------------------------------------------------
     Filtered broadcasts
  ------------------------------------------------------------ */
  const filteredBroadcasts = useMemo(() => {
    let list = broadcasts;

    if (dateFilter !== 'all') {
      const now = Date.now();
      const cutoffMs =
        dateFilter === 'today'
          ? 24 * 60 * 60 * 1000
          : dateFilter === 'week'
          ? 7 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;

      list = list.filter(
        (b) => now - new Date(b.created_at).getTime() <= cutoffMs
      );
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          (b.title || '').toLowerCase().includes(q) ||
          (b.message || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [broadcasts, search, dateFilter]);

  /* ------------------------------------------------------------
     Stats
  ------------------------------------------------------------ */
  const stats = useMemo(() => {
    const totalBroadcasts = broadcasts.length;
    const totalDelivered = broadcasts.reduce((sum, b) => sum + b.total, 0);
    const totalRead = broadcasts.reduce((sum, b) => sum + b.read, 0);
    const readRate = totalDelivered
      ? Math.round((totalRead / totalDelivered) * 100)
      : 0;

    return { totalBroadcasts, totalDelivered, totalRead, readRate };
  }, [broadcasts]);

  /* ------------------------------------------------------------
     Delete handlers
  ------------------------------------------------------------ */
  const deleteBroadcast = async (broadcast) => {
    if (
      !confirm(
        `Delete this notification for all ${broadcast.total} recipient(s)? This cannot be undone.`
      )
    )
      return;

    setDeleting(true);

    const ids = broadcast.recipients.map((r) => r.id);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', ids);

    setDeleting(false);

    if (error) {
      alert('Failed to delete: ' + error.message);
      return;
    }

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
    setBroadcasts((prev) => prev.filter((b) => b.id !== broadcast.id));
  };

  const deleteRecipient = async (broadcast, recipientId) => {
    if (!confirm('Remove this notification for this recipient only?')) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', recipientId);

    if (error) {
      alert('Failed to delete: ' + error.message);
      return;
    }

    // Update local state
    setBroadcasts((prev) =>
      prev.map((b) => {
        if (b.id !== broadcast.id) return b;
        const removed = b.recipients.find((r) => r.id === recipientId);
        const newRecipients = b.recipients.filter((r) => r.id !== recipientId);
        return {
          ...b,
          recipients: newRecipients,
          total: newRecipients.length,
          read: newRecipients.filter((r) => r.is_read).length,
        };
      })
    );
  };

  /* ------------------------------------------------------------
     Helpers
  ------------------------------------------------------------ */
  const formatFullDate = (d) =>
    new Date(d).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const timeAgo = (d) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(d).toLocaleDateString();
  };

  /* ------------------------------------------------------------
     Render
  ------------------------------------------------------------ */
  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Megaphone}
          label="Broadcasts"
          value={stats.totalBroadcasts}
          color="purple"
        />
        <StatCard
          icon={Users}
          label="Delivered"
          value={stats.totalDelivered}
          color="blue"
        />
        <StatCard
          icon={CheckCircle2}
          label="Read"
          value={stats.totalRead}
          color="green"
        />
        <StatCard
          icon={Eye}
          label="Read Rate"
          value={`${stats.readRate}%`}
          color="orange"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or message"
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none bg-white"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none bg-white appearance-none min-w-[160px]"
          >
            <option value="all">All time</option>
            <option value="today">Last 24 hours</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
        </div>

        <button
          onClick={loadNotifications}
          disabled={loading}
          className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2 justify-center"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Clock className="w-4 h-4" />
          )}
          Refresh
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : filteredBroadcasts.length === 0 ? (
        <div className="p-12 text-center">
          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">
            No broadcasts found
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {search || dateFilter !== 'all'
              ? 'Try clearing your filters.'
              : 'Notifications sent by admins will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredBroadcasts.map((broadcast) => {
            const isExpanded = expandedId === broadcast.id;
            const readPercent = broadcast.total
              ? Math.round((broadcast.read / broadcast.total) * 100)
              : 0;

            return (
              <motion.div
                key={broadcast.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border bg-white overflow-hidden transition-all ${
                  isExpanded
                    ? 'border-purple-300 ring-2 ring-purple-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Compact row */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : broadcast.id)
                  }
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                      <Megaphone className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {broadcast.title}
                          </p>
                          <p
                            className={`text-xs text-gray-600 mt-0.5 ${
                              isExpanded ? '' : 'line-clamp-1'
                            }`}
                          >
                            {broadcast.message}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[10px] text-gray-400">
                            {timeAgo(broadcast.created_at)}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {broadcast.total} recipient
                            {broadcast.total === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        {/* Read progress bar */}
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${readPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-gray-500 shrink-0">
                          {broadcast.read}/{broadcast.total} read
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded details */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-gray-100"
                    >
                      <div className="p-4 bg-gray-50/50">
                        {/* Full message + meta */}
                        <div className="bg-white rounded-xl border border-gray-200 p-3 mb-3">
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                            Full message
                          </p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {broadcast.message}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatFullDate(broadcast.created_at)}
                            </span>
                            {broadcast.link && (
                              <span className="flex items-center gap-1">
                                🔗 {broadcast.link}
                              </span>
                            )}
                            {broadcast.metadata?.cta_label && (
                              <span className="px-2 py-0.5 rounded-full bg-black text-white font-medium">
                                CTA: {broadcast.metadata.cta_label}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Recipients header */}
                        <div className="flex items-center justify-between mb-2 px-1">
                          <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                            Recipients ({broadcast.recipients.length})
                          </p>

                          <button
                            onClick={() => deleteBroadcast(broadcast)}
                            disabled={deleting}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete broadcast
                          </button>
                        </div>

                        {/* Recipients list */}
                        <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white divide-y divide-gray-50">
                          {broadcast.recipients.map((r) => (
                            <div
                              key={r.id}
                              className="flex items-center justify-between px-3 py-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {r.is_read ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                ) : (
                                  <Clock className="w-4 h-4 text-gray-300 shrink-0" />
                                )}
                                <span className="text-[11px] text-gray-500 font-mono truncate">
                                  {r.user_id}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                    r.is_read
                                      ? 'bg-green-50 text-green-700'
                                      : 'bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  {r.is_read ? 'Read' : 'Unread'}
                                </span>

                                <button
                                  onClick={() =>
                                    deleteRecipient(broadcast, r.id)
                                  }
                                  className="p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                  title="Remove for this recipient"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------
   Small StatCard
------------------------------------------------------------ */
function StatCard({ icon: Icon, label, value, color }) {
  const colorMap = {
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[color]}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
          {label}
        </p>
        <p className="text-base font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}