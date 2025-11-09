'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function useUnreadMessages() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState(null);

  // Get current user session
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) setUser(session.user);
    };
    getSession();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        // Get all chats the user is part of
        const { data: chats, error: chatsError } = await supabase
          .from('chats')
          .select('id')
          .or(`client_id.eq.${user.id},applicant_id.eq.${user.id}`);

        if (chatsError) {
          console.error('Error fetching chats:', chatsError);
          return;
        }

        const chatIds = chats.map((c) => c.id);

        if (chatIds.length === 0) {
          setCount(0);
          return;
        }

        // Count messages not sent by current user and not read
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('chat_id', chatIds)
          .neq('sender_id', user.id)
          .eq('is_read', false);

        setCount(unreadCount || 0);
      } catch (err) {
        console.error('Error fetching unread messages:', err);
      }
    };

    fetchUnread();

    // Subscribe to new messages
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new;
          // Only increment if the message is NOT sent by current user
          if (newMessage.sender_id !== user.id) {
            setCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return count;
}
