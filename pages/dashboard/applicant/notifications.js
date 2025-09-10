import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import ApplicantLayout from '../../../components/dashboard/ApplicantLayout';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const userId = userData.user.id;

      // ✅ Fetch general + personal notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${userId},is_general.eq.true`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      if (data && data.length > 0) {
        // ✅ Mark personal unread notifications as read in DB
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', userId)
          .eq('is_read', false);

        // ✅ Update local state so UI reflects read status immediately
        const updated = data.map((n) =>
          n.user_id === userId ? { ...n, is_read: true } : n
        );

        setNotifications(updated);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <ApplicantLayout>
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Notifications</h2>
        {notifications.length === 0 ? (
          <p className="text-gray-500">No notifications yet.</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-lg shadow ${
                n.is_read ? 'bg-white' : 'bg-orange-50'
              }`}
            >
              <h3 className="font-medium">{n.title}</h3>
              <p className="text-sm text-gray-600">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </ApplicantLayout>
  );
}
