// components/ChatMessages.js
import { useEffect, useRef } from "react";

export default function ChatMessages({ messages, currentUserId }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      {messages.length === 0 && (
        <div className="text-center text-gray-400 mt-10">No messages yet</div>
      )}

      {messages.map((msg) => {
        const isSender = msg.sender_id === currentUserId;
        return (
          <div
            key={msg.id}
            className={`max-w-[70%] mb-3 px-4 py-2 rounded-xl text-sm ${
              isSender
                ? "ml-auto bg-blue-600 text-white"
                : "mr-auto bg-white text-gray-800 border"
            }`}
          >
            {msg.message}
          </div>
        );
      })}

      <div ref={endRef} />
    </div>
  );
}
