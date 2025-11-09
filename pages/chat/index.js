import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../utils/supabaseClient";
import Image from "next/image";

export default function ChatListPage() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchChats = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data, error } = await supabase
        .from("chats")
        .select("id, sender_id, receiver_id, message, created_at")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!error) {
        // Deduplicate by unique chat partner
        const seen = new Set();
        const uniqueChats = [];

        for (let chat of data) {
          const partnerId = chat.sender_id === user.id ? chat.receiver_id : chat.sender_id;
          if (!seen.has(partnerId)) {
            seen.add(partnerId);
            uniqueChats.push({ ...chat, partnerId });
          }
        }

        setChats(uniqueChats);
      }
    };

    fetchChats();
  }, []);

  const goToChat = (partnerId) => {
    router.push(`/chat/${partnerId}`);
  };

  return (
    <div className="min-h-screen bg-white pt-4 pb-20">
      <h2 className="text-xl font-bold px-4 mb-4">Messages</h2>

      {chats.length === 0 ? (
        <p className="text-center text-gray-500">No chats yet</p>
      ) : (
        <ul>
          {chats.map((chat) => (
            <li
              key={chat.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer"
              onClick={() => goToChat(chat.partnerId)}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                <Image
                  src={`https://via.placeholder.com/40?text=👤`}
                  alt="Avatar"
                  width={40}
                  height={40}
                />
              </div>
              <div className="flex-1">
                <p className="font-medium truncate">{chat.message}</p>
                <p className="text-xs text-gray-500">
                  {new Date(chat.created_at).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
