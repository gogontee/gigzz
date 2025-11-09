// pages/chat/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import ChatMessages from "../../components/ChatMessages";


const supabase = createPagesBrowserClient();

export default function ChatDetailPage() {
  const router = useRouter();
  const { id: receiverId } = router.query;

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);

  // Fetch user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUser(user);
    };
    getUser();
  }, []);

  // Fetch messages between sender and receiver
  useEffect(() => {
    if (!user?.id || !receiverId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      if (error) console.error(error);
      else {
        // Filter for messages between sender and receiver
        const filtered = data.filter(
          (m) =>
            (m.sender_id === user.id && m.receiver_id === receiverId) ||
            (m.sender_id === receiverId && m.receiver_id === user.id)
        );

        const formatted = filtered.map((m) => ({
          ...m,
          isSender: m.sender_id === user.id,
        }));

        setMessages(formatted);
      }
    };

    fetchMessages();
  }, [user, receiverId]);

  // Send a new message
  const handleSend = async (text) => {
    if (!user?.id || !receiverId) return;

    const { data, error } = await supabase.from("chats").insert([
      {
        sender_id: user.id,
        receiver_id: receiverId,
        message: text,
      },
    ]);

    if (error) {
      console.error(error);
    } else {
      // Refresh message list (or push the new message manually)
      setMessages((prev) => [
        ...prev,
        {
          ...data[0],
          isSender: true,
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar */}
      <div className="p-4 bg-white border-b font-semibold">Chat</div>

      {/* Messages */}
      <ChatMessages messages={messages} />

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </div>
  );
}
