import React, { useState } from "react";
import { useConversationSession } from "../../context/ConversationSessionProvider";
import { FaArrowUp } from "react-icons/fa";

const TextMessageInput = () => {
  const { sendTextMessage, setTranscript } = useConversationSession();
  const [message, setMessage] = useState("");

  const handleSendClientEvent = (e) => {
    const finalMessage = message.trim();
    if (!finalMessage) return;
    sendTextMessage(finalMessage);
    setMessage("");
    e.target.value = "";
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === "user" && !last.final) {
        return [
          ...prev.slice(0, -1),
          { ...last, text: finalMessage, final: true },
        ];
      }
      return [...prev, { role: "user", text: finalMessage, final: true }];
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // stop newline insertion
      if (message.trim()) {
        handleSendClientEvent(e);
      }
    }
  };

  return (
    <div className="absolute bottom-0 py-4 z-50 flex flex-row gap-2 w-full bg-white">
      <textarea
        onKeyDown={handleKeyDown}
        id="text-message-input"
        type="text"
        placeholder="Not feeling chatty today? You can type instead..."
        className={`pb-4 border-none outline-none bg-gray-100 rounded p-4 flex-1 w-full resize-none placeholder:text-gray-400`}
        style={{
          fieldSizing: "content",
        }}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        onClick={() => {
          if (message.trim()) {
            handleSendClientEvent();
          }
        }}
        className={`flex self-end items-center justify-center bg-black rounded-full w-8 h-8 mr-8 mb-3 cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-150 ease-in-out ${
          message ? "opacity-100" : "opacity-15"
        }`}
      >
        <FaArrowUp size={16} color="white" />
      </button>
    </div>
  );
};

export default TextMessageInput;
