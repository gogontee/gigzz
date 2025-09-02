// pages/messages.js
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import ChatModal from '../components/ChatModal';

// ✅ utility to mark messages as read
async function markMessagesAsRead(chatId, currentUserId) {
  const { data, error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('chat_id', chatId)
    .eq('receiver_id', currentUserId);

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
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error.message);
        return;
      }

      if (!session || !session.user) {
        router.replace('/auth/login');
        return;
      }

      const authUser = session.user;
      setUser(authUser);
      await loadInbox(authUser);

      const { data: subscription } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          if (event === 'SIGNED_OUT') {
            router.replace('/auth/login');
          } else if (newSession?.user) {
            setUser(newSession.user);
            loadInbox(newSession.user);
          }
        }
      );

      return () => {
        subscription?.subscription.unsubscribe();
      };
    };

    const loadInbox = async (authUser) => {
      try {
        const { data: userChats, error: chatsError } = await supabase
          .from('chats')
          .select('id, client_id, applicant_id, created_at')
          .or(`client_id.eq.${authUser.id},applicant_id.eq.${authUser.id}`);

        if (chatsError) {
          console.error('Error fetching chats:', chatsError.message);
          return;
        }

        if (!userChats || userChats.length === 0) {
          setChats([]);
          return;
        }

        const chatData = await Promise.all(
          userChats.map(async (chat) => {
            const receiverId =
              chat.client_id === authUser.id
                ? chat.applicant_id
                : chat.client_id;

            if (!receiverId) {
              console.warn('Chat missing receiver:', chat);
              return null;
            }

            // Fetch employer
            let { data: receiverEmployer } = await supabase
              .from('employers')
              .select('id, name, avatar_url')
              .eq('id', receiverId)
              .maybeSingle();

            let receiver = null;
            if (receiverEmployer) {
              receiver = {
                id: receiverEmployer.id,
                name: receiverEmployer.name,
                avatar_url: receiverEmployer.avatar_url,
              };
            } else {
              // Fetch applicant
              const { data: receiverApplicant } = await supabase
                .from('applicants')
                .select('id, full_name, avatar_url')
                .eq('id', receiverId)
                .maybeSingle();

              if (receiverApplicant) {
                receiver = {
                  id: receiverApplicant.id,
                  name: receiverApplicant.full_name,
                  avatar_url: receiverApplicant.avatar_url,
                };
              }
            }

            // Fetch last message + unread count
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('id, content, created_at, is_read, sender_id')
              .eq('chat_id', chat.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Count unread messages
            const { count: unreadCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_id', chat.id)
              .eq('is_read', false)
              .eq('receiver_id', authUser.id);

            return {
              chatId: chat.id,
              fullName: receiver?.name || 'Unknown User',
              avatar: receiver?.avatar_url || '/placeholder.png',
              lastMessage: lastMsg?.content || 'No messages yet',
              lastMessageTime: lastMsg?.created_at || chat.created_at,
              receiver,
              unreadCount: unreadCount || 0,
            };
          })
        );

        const validChats = chatData.filter(Boolean);

        // Sort by latest activity
        validChats.sort(
          (a, b) =>
            new Date(b.lastMessageTime).getTime() -
            new Date(a.lastMessageTime).getTime()
        );

        setChats(validChats);
      } catch (err) {
        console.error('Error loading inbox:', err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [router]);

  // ✅ real-time subscription with proper unread logic
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
            const idx = prevChats.findIndex(
              (chat) => chat.chatId === newMessage.chat_id
            );
            if (idx === -1) return prevChats;

            const isFromMe = newMessage.sender_id === user.id;
            const isForMe = newMessage.receiver_id === user.id;

            const updatedChat = {
              ...prevChats[idx],
              lastMessage: newMessage.content,
              lastMessageTime: newMessage.created_at,
              unreadCount:
                !isFromMe && isForMe
                  ? (prevChats[idx].unreadCount || 0) + 1
                  : prevChats[idx].unreadCount,
            };

            const newChats = [...prevChats];
            newChats[idx] = updatedChat;

            // Move updated chat to top
            newChats.sort(
              (a, b) =>
                new Date(b.lastMessageTime).getTime() -
                new Date(a.lastMessageTime).getTime()
            );

            return newChats;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ✅ when user opens a chat
  const handleOpenChat = async (chat) => {
    setActiveChat(chat);

    if (user) {
      await markMessagesAsRead(chat.chatId, user.id);

      setChats((prev) =>
        prev.map((c) =>
          c.chatId === chat.chatId ? { ...c, unreadCount: 0 } : c
        )
      );
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading messages...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      {chats.length === 0 ? (
        <p className="text-gray-500">You have no messages yet.</p>
      ) : (
        <ul className="space-y-3">
          {chats.map((chat) => (
            <li
              key={chat.chatId}
              onClick={() => handleOpenChat(chat)}
              className="flex items-center gap-4 p-4 border rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 cursor-pointer transition"
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
                <p className="text-sm text-gray-600 truncate">
                  {chat.lastMessage}
                </p>
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
