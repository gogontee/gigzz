import { useState } from "react";

export default function ChatInput({ onSend }) {
  const [message, setMessage] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (trimmed === "") return;

    onSend(trimmed); // Callback to parent
    setMessage("");  // Clear input
  };

  return (
    <form
      onSubmit={handleSend}
      className="flex items-center p-2 border-t bg-white"
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="ml-2 px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
      >
        Send
      </button>
    </form>
  );
}
