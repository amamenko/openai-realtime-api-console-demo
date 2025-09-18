import React, { useState } from "react";
import { useConversationSession } from "../../../context/ConversationSessionProvider";
import { FaArrowUp } from "react-icons/fa";
import "./TextMessageInput.scss";

const TextMessageInput = () => {
  const { sendTextMessage, setTranscript } = useConversationSession();
  const [message, setMessage] = useState("");

  const handleSendClientEvent = (e) => {
    const finalMessage = message.trim();
    if (!finalMessage) return;
    sendTextMessage(finalMessage);
    setMessage("");
    if (e?.target?.value !== undefined) e.target.value = "";
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
      e.preventDefault(); // prevent newline
      if (message.trim()) {
        handleSendClientEvent(e);
      }
    }
  };

  return (
    <div className="text-message-input">
      <textarea
        onKeyDown={handleKeyDown}
        id="text-message-input"
        placeholder="Not feeling chatty today? You can type instead..."
        className="text-area"
        style={{
          fieldSizing: "content",
        }}
        value={message}
        onChange={(e) => setMessage(e?.target?.value)}
      />
      <button
        onClick={() => {
          if (message.trim()) {
            handleSendClientEvent();
          }
        }}
        className={`send-button ${message ? "active" : "inactive"}`}
      >
        <FaArrowUp size={16} color="white" />
      </button>
    </div>
  );
};

export default TextMessageInput;
