// components/ChatModal.js
import { useEffect, useRef, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function ChatModal({ chatId, userId, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [receiver, setReceiver] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isReceiverOnline, setIsReceiverOnline] = useState(false);

  // Update own online status
useEffect(() => {
  if (!userId || !isOpen) return;

  const setOnline = async () => {
    await supabase
      .from('user_status')
      .upsert({ user_id: userId, is_online: true, last_seen: new Date().toISOString() });
  };

  const setOffline = async () => {
    await supabase
      .from('user_status')
      .update({ is_online: false, last_seen: new Date().toISOString() })
      .eq('user_id', userId);
  };

  setOnline();

  return () => setOffline(); // runs when modal closes/unmounts
}, [userId, isOpen]);


  // 🔹 Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  // 🔹 Format avatar URL (convert Supabase storage path to public URL)
const formatAvatarUrl = (path, type = "applicant") => {
  if (!path) return "/avatar-placeholder.png";
  if (path.startsWith("http")) return path;

  // Decide folder inside 'profilephoto' bucket
  let folder = "avatars"; // default fallback
  if (type === "applicant" || type === "talent") folder = "talents_profile";
  else if (type === "employer" || type === "client") folder = "clients_profile";

  const { data } = supabase.storage
    .from("profilephoto")
    .getPublicUrl(`${folder}/${path}`);

  return data?.publicUrl || "/avatar-placeholder.png";
};


  // 🔹 Helper to format profile
  const formatProfile = (profile) => ({
    id: profile.id,
    full_name: profile.full_name,
    avatar_url: formatAvatarUrl(profile.avatar_url),
  });

  // Listen for receiver’s status
useEffect(() => {
  if (!receiver?.id) return;

  const channel = supabase
    .channel(`status-${receiver.id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_status",
        filter: `user_id=eq.${receiver.id}`,
      },
      (payload) => {
        const status = payload.new;
        if (status) {
          setIsReceiverOnline(status.is_online);
        }
      }
    )
    .subscribe();

  // Initial fetch
  (async () => {
    const { data } = await supabase
      .from("user_status")
      .select("is_online")
      .eq("user_id", receiver.id)
      .single();

    if (data) setIsReceiverOnline(data.is_online);
  })();

  return () => supabase.removeChannel(channel);
}, [receiver?.id]);

  // 🔹 Fetch receiver
  useEffect(() => {
    if (!chatId || !isOpen || !userId) return;

    const fetchReceiver = async () => {
      // 1. Get chat row
      const { data: chat, error: chatError } = await supabase
        .from("chats")
        .select("client_id, applicant_id")
        .eq("id", chatId)
        .single();

      if (chatError || !chat) {
        console.error("Failed to load chat:", chatError);
        return;
      }

      // 2. Determine receiver
      const receiverId =
        chat.client_id === userId ? chat.applicant_id : chat.client_id;
      if (!receiverId) return;

      // 3. Try applicants first
      const { data: applicant } = await supabase
        .from("applicants")
        .select("id, full_name, avatar_url")
        .eq("id", receiverId)
        .maybeSingle();

      if (applicant) {
        setReceiver(formatProfile(applicant));
        return;
      }

      // 4. Try employers
      const { data: employer } = await supabase
        .from("employers")
        .select("id, name, avatar_url")
        .eq("id", receiverId)
        .maybeSingle();

      if (employer) {
        setReceiver({
          id: employer.id,
          full_name: employer.name,
          avatar_url: formatAvatarUrl(employer.avatar_url),
        });
      }
    };

    fetchReceiver();
  }, [chatId, userId, isOpen]);

  // 🔹 Fetch messages
  useEffect(() => {
    if (!chatId || !isOpen) return;

    const loadMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
      } else {
        setMessages(
          data.map((msg) => ({ ...msg, temp_id: `db-${msg.id}` }))
        );
      }
      setLoading(false);
    };

    loadMessages();
  }, [chatId, isOpen]);

  // 🔹 Realtime: Messages
  useEffect(() => {
    if (!chatId || !isOpen) return;

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
  "postgres_changes",
  {
    event: "INSERT",
    schema: "public",
    table: "messages",
    filter: `chat_id=eq.${chatId}`,
  },
  (payload) => {
    const newMsg = payload.new;
    setMessages((prev) => {
      // Replace optimistic temp message if sender & content match
      const exists = prev.some(
        (m) =>
          m.id === newMsg.id ||
          (m.sender_id === newMsg.sender_id &&
           m.content === newMsg.content &&
           !m.id)
      );
      if (exists) return prev;

      return [...prev, { ...newMsg, temp_id: `db-${newMsg.id}` }];
    });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [chatId, isOpen]);

  // 🔹 Realtime: Typing
  useEffect(() => {
    if (!chatId || !isOpen || !userId) return;

    const channel = supabase
      .channel(`typing-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_typing",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const senderId = payload.new.sender_id;
          if (senderId !== userId) {
            setTypingUsers((prev) => new Set(prev).add(senderId));
            setTimeout(() => {
              setTypingUsers((prev) => {
                const next = new Set(prev);
                next.delete(senderId);
                return next;
              });
            }, 3000);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [chatId, userId, isOpen]);

  // 🔹 Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId || !userId) return;

    const tempId = `temp-${Date.now()}`;
    const message = {
      chat_id: chatId,
      sender_id: userId,
      content: newMessage.trim(),
      type: "text",
      created_at: new Date().toISOString(),
      temp_id: tempId,
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");

    const { temp_id, ...insertable } = message;
    const { data, error } = await supabase
      .from("messages")
      .insert([insertable])
      .select();

    if (error) {
      console.error("Send message error:", error);
      setMessages((prev) => prev.filter((m) => m.temp_id !== tempId));
    } else {
      const realMsg = data[0];
      setMessages((prev) =>
        prev.map((m) =>
          m.temp_id === tempId ? { ...realMsg, temp_id: `db-${realMsg.id}` } : m
        )
      );
    }
  };

  // 🔹 Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !chatId || !userId) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop().toLowerCase();
      const allowed = ["jpg", "jpeg", "png", "gif", "pdf", "docx"];
      if (!allowed.includes(fileExt)) {
        alert("Unsupported file type.");
        return;
      }

      const fileName = `chat/${chatId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(fileName);

      const publicUrl = data.publicUrl;

      const tempId = `temp-${Date.now()}`;
      const fileMessage = {
        chat_id: chatId,
        sender_id: userId,
        content: publicUrl,
        type: ["jpg", "jpeg", "png", "gif"].includes(fileExt)
          ? "image"
          : "file",
        created_at: new Date().toISOString(),
        temp_id: tempId,
      };

      setMessages((prev) => [...prev, fileMessage]);

      const { temp_id, ...insertable } = fileMessage;
      const { data: insertData, error: insertError } = await supabase
        .from("messages")
        .insert([insertable])
        .select();

      if (insertError) throw insertError;

      const realMsg = insertData[0];
      setMessages((prev) =>
        prev.map((m) =>
          m.temp_id === tempId ? { ...realMsg, temp_id: `db-${realMsg.id}` } : m
        )
      );
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  // Send typing event
const sendTypingEvent = async () => {
  if (!chatId || !userId) return;
  await supabase.from('chat_typing').insert({ chat_id: chatId, sender_id: userId });
};

const handleChange = (e) => {
  setNewMessage(e.target.value);
  sendTypingEvent(); // Trigger typing event whenever user types
};

const handleKeyDown = (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

  if (!isOpen) return null;

  return (
  <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
    <div className="bg-white w-full max-w-md h-[85vh] rounded-3xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
      
      {/* Header */}
      <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <img
            src={receiver?.avatar_url || "/avatar-placeholder.png"}
            alt="Avatar"
            className="w-11 h-11 rounded-full object-cover border-2 border-green-400"
            onError={(e) => {
              e.target.src = "/avatar-placeholder.png";
            }}
          />
          <div>
            <h2 className="font-semibold text-gray-900">
              {receiver?.full_name || "Chat"}
            </h2>
            <p className="text-xs text-gray-500">
              {isReceiverOnline ? (
                <span className="text-green-500">Online</span>
              ) : (
                <span className="text-gray-400">Offline</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-lg font-bold"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loading ? (
          <p className="text-gray-400 text-center">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet 👋</p>
        ) : (
          messages.map((msg) => {
            const isSent = msg.sender_id === userId;
            const isImage = msg.type === "image";
            return (
              <div
                key={msg.id || msg.temp_id}
                className={`flex ${isSent ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-3 py-2 rounded-2xl text-sm shadow max-w-[70%] ${
                    isSent
                      ? "bg-green-500 text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none border"
                  }`}
                >
                  {isImage ? (
                    <img
                      src={msg.content}
                      alt="Shared"
                      className="max-h-48 rounded-lg object-cover"
                    />
                  ) : msg.type === "file" ? (
                    <a
                      href={msg.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    >
                      📎 View File
                    </a>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                  <span className="block text-xs mt-1 text-gray-400">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 flex items-end gap-2 bg-white">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-gray-600 hover:text-gray-800"
        >
          📎
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,.pdf,.docx"
          onChange={handleFileUpload}
        />
        <textarea
  ref={textareaRef}
  rows={1}
  className="flex-1 resize-none border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
  placeholder="Type a message..."
  value={newMessage}
  onChange={handleChange}
  onKeyDown={handleKeyDown}
  disabled={uploading}
/>

        <button
          onClick={sendMessage}
          disabled={!newMessage.trim() || uploading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  </div>
);
}
