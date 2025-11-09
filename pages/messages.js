// pages/messages.js
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/navigation';
import ChatModal from '../components/ChatModal';

// ✅ utility to mark messages as read
async function markMessagesAsRead(chat, currentUserId) {
  // Mark all messages in this chat where sender is NOT current user as read
  const { data, error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('chat_id', chat.chatId)
    .neq('sender_id', currentUserId);

  if (error) {
    console.error('Error marking messages as read:', error);
  } else {
    console.log('Marked as read:', data);
  }
}

export default function MessagesInbox() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [role, setRole] = useState(null);
  const [employer, setEmployer] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) return console.error('Error getting session:', error.message);
      if (!session?.user) return router.replace('/auth/login');

      const authUser = session.user;
      setUser(authUser);

      // fetch role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle();

      if (userError) console.error('Error fetching role:', userError.message);
      else setRole(userData?.role);

      // fetch employer details if role is employer
      if (userData?.role === 'employer') {
        const { data: employerData } = await supabase
          .from('employers')
          .select('id, name, avatar_url')
          .eq('id', authUser.id)
          .maybeSingle();
        setEmployer(employerData);
      }

      await loadInbox(authUser);

      const { data: subscription } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          if (event === 'SIGNED_OUT') router.replace('/auth/login');
          else if (newSession?.user) {
            setUser(newSession.user);
            loadInbox(newSession.user);
          }
        }
      );

      return () => subscription?.subscription.unsubscribe();
    };

    const loadInbox = async (authUser) => {
      try {
        const { data: userChats, error: chatsError } = await supabase
          .from('chats')
          .select('id, client_id, applicant_id, created_at')
          .or(`client_id.eq.${authUser.id},applicant_id.eq.${authUser.id}`);

        if (chatsError) return console.error('Error fetching chats:', chatsError.message);
        if (!userChats?.length) return setChats([]);

        const chatData = await Promise.all(
          userChats.map(async (chat) => {
            const receiverId =
              chat.client_id === authUser.id ? chat.applicant_id : chat.client_id;

            if (!receiverId) return null;

            let receiver = null;

            // Lookup employer
            const { data: receiverEmployer } = await supabase
              .from('employers')
              .select('id, name, avatar_url')
              .eq('id', receiverId)
              .maybeSingle();

            if (receiverEmployer) receiver = receiverEmployer;
            else {
              const { data: receiverApplicant } = await supabase
                .from('applicants')
                .select('id, full_name, avatar_url')
                .eq('id', receiverId)
                .maybeSingle();
              if (receiverApplicant)
                receiver = {
                  id: receiverApplicant.id,
                  name: receiverApplicant.full_name,
                  avatar_url: receiverApplicant.avatar_url,
                };
            }

            // Last message
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('id, content, created_at, is_read, sender_id')
              .eq('chat_id', chat.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Unread messages: sender != current user && is_read = false
            const { count: unreadCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_id', chat.id)
              .neq('sender_id', authUser.id)
              .eq('is_read', false);

            return {
              chatId: chat.id,
              fullName: receiver?.name || 'Unknown User',
              avatar: receiver?.avatar_url || '/placeholder.png',
              lastMessage: lastMsg?.content || 'No messages yet',
              lastMessageTime: lastMsg?.created_at || chat.created_at,
              receiver,
              unreadCount: unreadCount || 0,
              client_id: chat.client_id,
              applicant_id: chat.applicant_id,
            };
          })
        );

        const validChats = chatData.filter(Boolean);
        validChats.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        setChats(validChats);
      } catch (err) {
        console.error('Error loading inbox:', err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [router]);

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-inbox')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new;

          setChats((prevChats) => {
            const idx = prevChats.findIndex((c) => c.chatId === newMessage.chat_id);
            if (idx === -1) return prevChats;

            const isFromMe = newMessage.sender_id === user.id;

            const updatedChat = {
              ...prevChats[idx],
              lastMessage: newMessage.content,
              lastMessageTime: newMessage.created_at,
              unreadCount: !isFromMe
                ? (prevChats[idx].unreadCount || 0) + 1
                : prevChats[idx].unreadCount,
            };

            const newChats = [...prevChats];
            newChats[idx] = updatedChat;
            newChats.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
            return newChats;
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  // Open chat: mark as read
  const handleOpenChat = async (chat) => {
    setActiveChat(chat);

    if (user) {
      await markMessagesAsRead(chat, user.id);

      setChats((prev) =>
        prev.map((c) =>
          c.chatId === chat.chatId ? { ...c, unreadCount: 0 } : c
        )
      );
    }
  };

  if (loading) return <div className="p-6 text-center">Loading messages...</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      {chats.length === 0 ? (
        <p className="text-gray-500">You have no messages yet.</p>
      ) : (
        <ul className="space-y-3">
          {chats.map((chat) => (
            <li
              key={chat.chatId}
              onClick={() => handleOpenChat(chat)}
              className="flex items-center gap-4 p-4 border rounded-xl shadow-sm hover:shadow-md hover:bg-white cursor-pointer transition"
            >
              <img
                src={chat.avatar}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate flex items-center">
                  {chat.fullName}
                  {chat.unreadCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {chat.unreadCount}
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
              </div>
              {chat.lastMessageTime && (
                <small className="text-gray-500 whitespace-nowrap text-xs">
                  {new Date(chat.lastMessageTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </small>
              )}
            </li>
          ))}
        </ul>
      )}

      {activeChat && (
        <ChatModal
          chatId={activeChat.chatId}
          userId={user.id}
          isOpen={true}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
}
