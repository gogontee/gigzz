'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Briefcase,
  FileCheck,
  Wallet,
  Megaphone,
  CheckCircle2,
  Eye,
  Star,
  Mic,
  XCircle,
  Trophy,
  Info,
  Clock,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../utils/supabaseClient';

/* ------------------------------------------------------------
   Icon + color mapping for every notification type
   produced by our SQL triggers
------------------------------------------------------------ */
const TYPE_CONFIG = {
  // Jobs
  job_approved:            { Icon: Briefcase,    color: 'text-green-400 bg-green-500/20',     label: 'Job' },
  job_rejected:            { Icon: Briefcase,    color: 'text-red-400 bg-red-500/20',         label: 'Job' },
  job_pending:             { Icon: Briefcase,    color: 'text-yellow-400 bg-yellow-500/20',   label: 'Job' },

  // Applications — employer side
  new_application:         { Icon: FileCheck,    color: 'text-orange-400 bg-orange-500/20',   label: 'Application' },

  // Applications — applicant side
  application_viewed:      { Icon: Eye,          color: 'text-blue-400 bg-blue-500/20',       label: 'Application' },
  application_shortlisted: { Icon: Star,         color: 'text-yellow-400 bg-yellow-500/20',   label: 'Application' },
  application_interviewed: { Icon: Mic,          color: 'text-purple-400 bg-purple-500/20',   label: 'Application' },
  application_rejected:    { Icon: XCircle,      color: 'text-red-400 bg-red-500/20',         label: 'Application' },
  application_hired:       { Icon: Trophy,       color: 'text-green-400 bg-green-500/20',     label: 'Application' },
  application_status:      { Icon: FileCheck,    color: 'text-gray-400 bg-gray-500/20',       label: 'Application' },

  // Verification
  verification_approved:   { Icon: CheckCircle2, color: 'text-green-400 bg-green-500/20',     label: 'Verification' },
  verification_rejected:   { Icon: XCircle,      color: 'text-red-400 bg-red-500/20',         label: 'Verification' },

  // Wallet
  wallet_topup:            { Icon: Wallet,       color: 'text-cyan-400 bg-cyan-500/20',       label: 'Wallet' },

  // Admin
  admin_announcement:      { Icon: Megaphone,    color: 'text-purple-400 bg-purple-500/20',   label: 'Announcement' },

  // Fallback
  system:                  { Icon: Info,         color: 'text-gray-400 bg-gray-500/20',       label: 'System' },
};

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.system;
}

/* ------------------------------------------------------------
   Time helpers
------------------------------------------------------------ */
function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function formatFullDate(dateString) {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/* ------------------------------------------------------------
   Main component
------------------------------------------------------------ */
export default function Notification({ isOpen, onClose, userId }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const modalRef = useRef(null);
  const channelRef = useRef(null);

  /* ---------- Fetch initial notifications ---------- */
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to load notifications:', error);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setUnreadCount((data || []).filter((n) => !n.is_read).length);
    setLoading(false);
  }, [userId]);

  /* ---------- Click outside to close ---------- */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      fetchNotifications();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, fetchNotifications, onClose]);

  /* ---------- Reset expanded on close ---------- */
  useEffect(() => {
    if (!isOpen) setExpandedId(null);
  }, [isOpen]);

  /* ---------- Supabase Realtime subscription ---------- */
  useEffect(() => {
    if (!userId) return;

    // Clean up any previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev].slice(0, 50));
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? payload.new : n))
          );
          // Recompute unread safely
          setNotifications((current) => {
            setUnreadCount(current.filter((n) => !n.is_read).length);
            return current;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => {
            const next = prev.filter((n) => n.id !== payload.old.id);
            setUnreadCount(next.filter((n) => !n.is_read).length);
            return next;
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId]);

  /* ---------- Actions ---------- */
  const handleMarkAsRead = async (notificationId) => {
    const target = notifications.find((n) => n.id === notificationId);
    if (!target || target.is_read) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId
          ? { ...n, is_read: true, read_at: new Date().toISOString() }
          : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      // Roll back on failure
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: false } : n
        )
      );
      setUnreadCount((prev) => prev + 1);
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId || unreadCount === 0) return;
    setIsMarkingAll(true);

    const prev = notifications;
    setNotifications((list) =>
      list.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      setNotifications(prev);
      setUnreadCount(prev.filter((n) => !n.is_read).length);
      console.error('Failed to mark all as read:', error);
    }
    setIsMarkingAll(false);
  };

  const handleDelete = async (notificationId) => {
    const removed = notifications.find((n) => n.id === notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (removed && !removed.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (expandedId === notificationId) setExpandedId(null);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      // Restore on failure
      if (removed) setNotifications((prev) => [removed, ...prev]);
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) handleMarkAsRead(notification.id);
    setExpandedId((prev) => (prev === notification.id ? null : notification.id));
  };

  const handleNavigate = (link) => {
    if (!link) return;
    if (typeof window !== 'undefined') {
      window.location.href = link;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-black/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl max-h-[80vh] overflow-hidden"
      >
        {/* ---------- Header ---------- */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[8px] font-medium rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white/60 disabled:opacity-40"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white/60"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ---------- List ---------- */}
        <div className="overflow-y-auto max-h-[calc(80vh-60px)] p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/40">No notifications yet</p>
              <p className="text-[10px] text-white/20 mt-1">
                We'll notify you when something happens
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => {
                const { Icon, color, label } = getTypeConfig(notification.type);
                const isExpanded = expandedId === notification.id;
                const ctaLabel =
                  notification.metadata?.cta_label ||
                  (notification.link ? 'View' : null);

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`group relative rounded-xl mb-1.5 transition-all overflow-hidden ${
                      notification.is_read
                        ? 'hover:bg-white/5'
                        : 'bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/10'
                    } ${isExpanded ? 'bg-white/5 ring-1 ring-white/10' : ''}`}
                  >
                    {/* Compact row */}
                    <div
                      className="p-3 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p
                                className={`text-[11px] font-medium truncate ${
                                  notification.is_read ? 'text-white/60' : 'text-white'
                                }`}
                              >
                                {notification.title}
                              </p>
                              <p
                                className={`text-[10px] text-white/40 mt-0.5 ${
                                  isExpanded ? '' : 'line-clamp-2'
                                }`}
                              >
                                {notification.message}
                              </p>
                            </div>
                            <span className="text-[8px] text-white/20 flex-shrink-0">
                              {formatTime(notification.created_at)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[8px] text-white/20">
                              {label}
                            </span>
                            <div className="flex items-center gap-1">
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-white/30"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </motion.div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notification.is_read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notification.id);
                                    }}
                                    className="p-0.5 hover:bg-white/10 rounded transition-colors text-white/30 hover:text-white/60"
                                    title="Mark as read"
                                  >
                                    <Check className="w-2.5 h-2.5" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(notification.id);
                                  }}
                                  className="p-0.5 hover:bg-red-500/10 rounded transition-colors text-white/20 hover:text-red-400"
                                  title="Delete"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {!notification.is_read && (
                        <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-orange-500" />
                      )}
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-1 border-t border-white/5">
                            <div className="mb-2.5">
                              <p className="text-[8px] uppercase tracking-wider text-white/30 mb-1">
                                Message
                              </p>
                              <p className="text-[10px] text-white/70 leading-relaxed whitespace-pre-wrap">
                                {notification.message}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 mb-3 text-[8px] text-white/30">
                              <span className="flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {formatFullDate(notification.created_at)}
                              </span>
                              <span className="px-1.5 py-0.5 bg-white/5 rounded-full text-white/40">
                                {label}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {notification.link && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigate(notification.link);
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 rounded-lg text-[10px] font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/25"
                                >
                                  {ctaLabel || 'Go to Page'}
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedId(null);
                                }}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-medium text-white/60 hover:text-white/80 transition-colors"
                              >
                                Close
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(notification.id);
                                }}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors ml-auto"
                                title="Delete notification"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}