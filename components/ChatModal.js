// components/ChatModal.js
import { useEffect, useRef, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { 
  X, 
  Paperclip, 
  Send, 
  Image as ImageIcon, 
  File, 
  Download, 
  Trash2,
  AlertCircle,
  Clock,
  Check,
  CheckCheck,
  Eye,
  MoreVertical
} from "lucide-react";

// Audio files for notifications (you'll need to add these to your public folder)
const MESSAGE_SOUND = "/sounds/message-notification.mp3";
const SEND_SOUND = "/sounds/message-sent.mp3";

export default function ChatModal({ chatId, userId, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [receiver, setReceiver] = useState(null);
  const [isReceiverOnline, setIsReceiverOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageSoundRef = useRef(null);
  const sendSoundRef = useRef(null);

  // Constants
  const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB in bytes

  // 🔹 Initialize audio elements
  useEffect(() => {
    messageSoundRef.current = new Audio(MESSAGE_SOUND);
    sendSoundRef.current = new Audio(SEND_SOUND);
    
    // Preload sounds
    messageSoundRef.current.load();
    sendSoundRef.current.load();
  }, []);

  // 🔹 Play sound function
  const playSound = (soundType) => {
    try {
      const sound = soundType === 'message' ? messageSoundRef.current : sendSoundRef.current;
      if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Audio play failed:', e));
      }
    } catch (error) {
      console.log('Sound error:', error);
    }
  };

  // 🔹 Update own online status
  useEffect(() => {
    if (!userId || !isOpen) return;

    const setOnline = async () => {
      await supabase
        .from('user_status')
        .upsert({ 
          user_id: userId, 
          is_online: true, 
          last_seen: new Date().toISOString() 
        });
    };

    const setOffline = async () => {
      await supabase
        .from('user_status')
        .update({ 
          is_online: false, 
          last_seen: new Date().toISOString() 
        })
        .eq('user_id', userId);
    };

    setOnline();

    const handleBeforeUnload = () => setOffline();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      setOffline();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId, isOpen]);

  // 🔹 Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  // 🔹 Format avatar URL
  const formatAvatarUrl = (path, type = "applicant") => {
    if (!path) return "/avatar-placeholder.png";
    if (path.startsWith("http")) return path;

    let folder = "avatars";
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
    full_name: profile.full_name || profile.name,
    avatar_url: formatAvatarUrl(profile.avatar_url),
  });

  // 🔹 Listen for receiver's online status and last seen
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
            setLastSeen(status.last_seen);
          }
        }
      )
      .subscribe();

    // Initial fetch
    (async () => {
      const { data } = await supabase
        .from("user_status")
        .select("is_online, last_seen")
        .eq("user_id", receiver.id)
        .single();

      if (data) {
        setIsReceiverOnline(data.is_online);
        setLastSeen(data.last_seen);
      }
    })();

    return () => supabase.removeChannel(channel);
  }, [receiver?.id]);

  // 🔹 Format last seen time
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Never";
    
    const now = new Date();
    const lastSeenDate = new Date(timestamp);
    const diffMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return lastSeenDate.toLocaleDateString();
  };

  // 🔹 Fetch receiver
  useEffect(() => {
    if (!chatId || !isOpen || !userId) return;

    const fetchReceiver = async () => {
      const { data: chat, error: chatError } = await supabase
        .from("chats")
        .select("client_id, applicant_id")
        .eq("id", chatId)
        .single();

      if (chatError || !chat) {
        console.error("Failed to load chat:", chatError);
        return;
      }

      const receiverId = chat.client_id === userId ? chat.applicant_id : chat.client_id;
      if (!receiverId) return;

      // Try applicants first
      const { data: applicant } = await supabase
        .from("applicants")
        .select("id, full_name, avatar_url")
        .eq("id", receiverId)
        .maybeSingle();

      if (applicant) {
        setReceiver(formatProfile(applicant));
        return;
      }

      // Try employers
      const { data: employer } = await supabase
        .from("employers")
        .select("id, name, avatar_url")
        .eq("id", receiverId)
        .maybeSingle();

      if (employer) {
        setReceiver({
          id: employer.id,
          full_name: employer.name,
          avatar_url: formatAvatarUrl(employer.avatar_url, "employer"),
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
        setMessages(data.map((msg) => ({ ...msg, temp_id: `db-${msg.id}` })));
      }
      setLoading(false);
    };

    loadMessages();
  }, [chatId, isOpen]);

  // 🔹 Realtime: Messages with sound notification
  useEffect(() => {
    if (!chatId || !isOpen || !userId) return;

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
          
          // Play sound only for received messages (not sent by current user)
          if (newMsg.sender_id !== userId) {
            playSound('message');
          }

          setMessages((prev) => {
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
  }, [chatId, isOpen, userId]);

  // 🔹 Realtime: Typing indicators
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
          const typingEvent = payload.new;
          if (typingEvent.sender_id !== userId) {
            setTypingUsers((prev) => new Set(prev).add(typingEvent.sender_id));
            
            // Clear typing indicator after 3 seconds
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              setTypingUsers((prev) => {
                const next = new Set(prev);
                next.delete(typingEvent.sender_id);
                return next;
              });
            }, 3000);
          }
        }
      )
      .subscribe();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [chatId, userId, isOpen]);

  // 🔹 Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // 🔹 Send typing event
  const sendTypingEvent = async () => {
    if (!chatId || !userId) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    await supabase.from('chat_typing').insert({ 
      chat_id: chatId, 
      sender_id: userId 
    });
  };

  // 🔹 Handle message input
  const handleChange = (e) => {
    setNewMessage(e.target.value);
    sendTypingEvent();
  };

  // 🔹 Send message with sound
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

    // Play send sound
    playSound('send');

    const { temp_id, ...insertable } = message;
    const { data, error } = await supabase
      .from("messages")
      .insert([insertable])
      .select();

    if (error) {
      console.error("Send message error:", error);
      setMessages((prev) => prev.filter((m) => m.temp_id !== tempId));
    }
  };

  // 🔹 Handle file upload with size validation
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !chatId || !userId) return;

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      alert(`File size too large! Maximum allowed size is 3MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Please compress the file or use external file sharing services.`);
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop().toLowerCase();
      const allowed = ["jpg", "jpeg", "png", "gif", "pdf", "docx", "txt"];
      if (!allowed.includes(fileExt)) {
        alert("Unsupported file type. Allowed: JPG, PNG, GIF, PDF, DOCX, TXT");
        return;
      }

      const fileName = `chat/${chatId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
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
        file_name: file.name,
        file_size: file.size,
        type: ["jpg", "jpeg", "png", "gif"].includes(fileExt) ? "image" : "file",
        created_at: new Date().toISOString(),
        temp_id: tempId,
      };

      setMessages((prev) => [...prev, fileMessage]);

      // Play send sound for files too
      playSound('send');

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

  // 🔹 Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 🔹 Delete single message
  const deleteMessage = async (messageId) => {
    if (!messageId) return;
    
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      setSelectedMessage(null);
    } catch (err) {
      console.error("Delete message error:", err);
      alert("Failed to delete message");
    }
  };

  // 🔹 Delete entire chat
  const deleteChat = async () => {
    if (!chatId) return;
    
    setDeleting(true);
    try {
      // Delete all messages first
      const { error: messagesError } = await supabase
        .from("messages")
        .delete()
        .eq("chat_id", chatId);

      if (messagesError) throw messagesError;

      // Then delete the chat
      const { error: chatError } = await supabase
        .from("chats")
        .delete()
        .eq("id", chatId);

      if (chatError) throw chatError;

      setShowDeleteConfirm(false);
      onClose(); // Close modal after deletion
      alert("Chat deleted successfully");
    } catch (err) {
      console.error("Delete chat error:", err);
      alert("Failed to delete chat");
    } finally {
      setDeleting(false);
    }
  };

  // 🔹 Handle image click to view full size
  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  // 🔹 Handle key events
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 🔹 Check if file is viewable image
  const isViewableImage = (message) => {
    return message.type === "image" && 
           message.content && 
           !message.content.match(/\.(pdf|docx|txt)$/i);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
      {/* Delete Message Confirmation */}
      {selectedMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-60">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Message</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMessage(selectedMessage)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image View Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-60">
          <div className="relative max-w-4xl max-h-[90vh] mx-4">
            <img
              src={selectedImage}
              alt="Full size preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <a
                href={selectedImage}
                download
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors"
                title="Download image"
              >
                <Download className="w-5 h-5 text-white" />
              </a>
              <button
                onClick={() => setShowImageModal(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Chat Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-60">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Chat</h3>
                <p className="text-sm text-gray-600">This will delete all messages</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={deleteChat}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting..." : "Delete Chat"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal - Updated for mobile responsiveness */}
      <div className="bg-white w-full max-w-md h-[85vh] rounded-3xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden mx-4 md:mx-0">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={receiver?.avatar_url || "/avatar-placeholder.png"}
                alt="Avatar"
                className="w-11 h-11 rounded-full object-cover border-2 border-green-400"
                onError={(e) => {
                  e.target.src = "/avatar-placeholder.png";
                }}
              />
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                isReceiverOnline ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {receiver?.full_name || "Chat"}
              </h2>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                {isReceiverOnline ? (
                  <span className="text-green-500">Online</span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last seen {formatLastSeen(lastSeen)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages - Updated with better mobile spacing */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 pb-24 md:pb-4">
          {loading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👋</span>
              </div>
              <p className="text-gray-500">No messages yet</p>
              <p className="text-gray-400 text-sm mt-1">Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isSent = msg.sender_id === userId;
                const isImage = msg.type === "image";
                const isFile = msg.type === "file";
                const isViewable = isViewableImage(msg);
                
                return (
                  <div
                    key={msg.id || msg.temp_id}
                    className={`flex ${isSent ? "justify-end" : "justify-start"} group relative`}
                  >
                    <div
                      className={`px-4 py-3 rounded-2xl max-w-[85%] ${
                        isSent
                          ? "bg-green-500 text-white rounded-br-none"
                          : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                      }`}
                    >
                      {isImage ? (
                        <div>
                          {isViewable ? (
                            <button
                              onClick={() => handleImageClick(msg.content)}
                              className="block w-full text-left"
                            >
                              <img
                                src={msg.content}
                                alt="Shared image"
                                className="max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              />
                              <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                                <Eye className="w-3 h-3" />
                                Click to view full size
                              </div>
                            </button>
                          ) : (
                            <img
                              src={msg.content}
                              alt="Shared image"
                              className="max-h-48 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs opacity-80">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isSent && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      ) : isFile ? (
                        <div className="flex items-center gap-3">
                          <File className="w-8 h-8 text-blue-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {msg.file_name || "File"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(msg.file_size)}
                            </p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs opacity-80">
                                {new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {isSent && <CheckCheck className="w-3 h-3" />}
                            </div>
                          </div>
                          <a
                            href={msg.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs opacity-80">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isSent && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Message Actions Menu */}
                    {isSent && (
                      <div className="absolute top-2 -right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedMessage(msg.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete message"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      {receiver?.full_name || 'Someone'} is typing...
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Updated with mobile-safe bottom padding */}
        <div className="p-4 border-t border-gray-200 bg-white pb-20 md:pb-4">
          {/* File Size Warning */}
          <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Maximum file size: 3MB
          </div>
          
          <div className="flex items-end gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors flex-shrink-0"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,.pdf,.docx,.txt"
              onChange={handleFileUpload}
            />
            
            <textarea
              ref={textareaRef}
              rows={1}
              className="flex-1 resize-none border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Type a message..."
              value={newMessage}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={uploading}
            />
            
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || uploading}
              className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
              title="Send message"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}