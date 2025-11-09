import React from "react";
import clsx from "clsx";

export default function MessageBubble({ message, isSender }) {
  return (
    <div
      className={clsx(
        "max-w-[75%] p-3 rounded-xl text-sm shadow",
        isSender
          ? "bg-blue-600 text-white self-end rounded-br-none"
          : "bg-gray-200 text-gray-900 self-start rounded-bl-none"
      )}
    >
      {message}
    </div>
  );
}
