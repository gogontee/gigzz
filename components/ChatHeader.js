// components/ChatHeader.js
export default function ChatHeader({ receiver }) {
  return (
    <div className="p-4 border-b flex items-center gap-3 bg-white shadow-sm">
      <img
        src={receiver?.avatar_url || "/avatar-placeholder.png"}
        alt="avatar"
        className="w-10 h-10 rounded-full object-cover"
      />
      <div>
        <h2 className="font-bold">{receiver?.name || "Chat Partner"}</h2>
        <p className="text-sm text-gray-500">Active now</p>
      </div>
    </div>
  );
}
