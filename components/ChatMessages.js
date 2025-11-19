// components/ChatMessages.js
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, CheckCheck, Clock, MoreVertical, Reply, Trash2 } from "lucide-react";

export default function ChatMessages({ 
  messages, 
  currentUserId, 
  onDeleteMessage,
  onReplyToMessage,
  selectedMessage,
  users = {} 
}) {
  const endRef = useRef(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [showMenu, setShowMenu] = useState(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getStatusIcon = (msg) => {
    if (msg.sender_id !== currentUserId) return null;
    
    if (msg.status === 'sent') return <Check className="w-3 h-3" />;
    if (msg.status === 'delivered') return <CheckCheck className="w-3 h-3" />;
    if (msg.status === 'read') return <CheckCheck className="w-3 h-3 text-blue-500" />;
    return <Clock className="w-3 h-3" />;
  };

  const shouldShowDate = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const previousDate = new Date(previousMsg.created_at).toDateString();
    
    return currentDate !== previousDate;
  };

  const getUser = (userId) => {
    return users[userId] || { name: 'Unknown User', avatar: null };
  };

  const handleDelete = (messageId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      onDeleteMessage?.(messageId);
    }
    setShowMenu(null);
  };

  const handleReply = (message) => {
    onReplyToMessage?.(message);
    setShowMenu(null);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 relative">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">GC</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Group Chat</h3>
              <p className="text-xs text-gray-500">
                {messages.length} messages • {Object.keys(users).length} participants
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No messages yet</h3>
            <p className="text-gray-500 text-sm">Start a conversation by sending a message!</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isSender = msg.sender_id === currentUserId;
          const previousMsg = messages[index - 1];
          const showDate = shouldShowDate(msg, previousMsg);
          const user = getUser(msg.sender_id);
          const isConsecutive = previousMsg && 
            previousMsg.sender_id === msg.sender_id &&
            new Date(msg.created_at) - new Date(previousMsg.created_at) < 300000; // 5 minutes

          return (
            <div key={msg.id} className="space-y-2">
              {/* Date Separator */}
              {showDate && (
                <div className="flex justify-center">
                  <div className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-600">
                    {formatDate(msg.created_at)}
                  </div>
                </div>
              )}

              {/* Reply Preview */}
              {msg.reply_to && (
                <div className={`max-w-[70%] ${isSender ? 'ml-auto' : 'mr-auto'}`}>
                  <div className={`flex items-start space-x-2 p-2 rounded-lg text-xs ${
                    isSender ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <div className="w-1 bg-blue-400 rounded-full flex-shrink-0 h-full min-h-[40px]"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-blue-600">
                        {getUser(msg.reply_to.sender_id).name}
                      </p>
                      <p className="text-gray-600 truncate">{msg.reply_to.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Message */}
              <div
                className={`group flex max-w-[70%] ${isSender ? 'ml-auto' : 'mr-auto'} ${
                  isConsecutive ? 'mt-1' : 'mt-4'
                }`}
                onMouseEnter={() => setHoveredMessage(msg.id)}
                onMouseLeave={() => setHoveredMessage(null)}
              >
                {/* Avatar for received messages */}
                {!isSender && !isConsecutive && (
                  <div className="flex-shrink-0 mr-2 self-end">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Message Content */}
                <div className={`flex-1 relative ${isSender ? 'text-right' : ''}`}>
                  {/* Sender Name */}
                  {!isSender && !isConsecutive && (
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-gray-700">{user.name}</span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`relative px-4 py-2 rounded-2xl text-sm ${
                      isSender
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                    } ${isConsecutive ? (isSender ? 'rounded-tr-md' : 'rounded-tl-md') : ''}`}
                  >
                    {msg.message}

                    {/* Message Actions */}
                    {(hoveredMessage === msg.id || showMenu === msg.id) && (
                      <div className={`absolute -top-8 ${isSender ? 'right-2' : 'left-2'} flex space-x-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1`}>
                        <button
                          onClick={() => handleReply(msg)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Reply"
                        >
                          <Reply className="w-3 h-3 text-gray-600" />
                        </button>
                        {isSender && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message Meta */}
                  <div className={`flex items-center space-x-2 mt-1 text-xs ${
                    isSender ? 'justify-end' : 'justify-start'
                  }`}>
                    <span className="text-gray-500">{formatTime(msg.created_at)}</span>
                    {isSender && getStatusIcon(msg)}
                  </div>
                </div>

                {/* Spacer for sent messages */}
                {isSender && <div className="w-8 flex-shrink-0" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scroll Anchor */}
      <div ref={endRef} className="h-4" />
    </div>
  );
}