import React, { useEffect, useRef } from "react";
import TextMessageInput from "../TextMessageInput/TextMessageInput";
import { useConversationSession } from "../../../context/ConversationSessionProvider";
import "./ConversationTranscript.scss";

const ConversationTranscript = () => {
  const { transcript, sendTextMessage, setTranscript } =
    useConversationSession();

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current)
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const SuggestionTextButton = ({ text }) => {
    const handleClickTextButton = () => {
      sendTextMessage(text);
      setTranscript((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "user" && !last.final) {
          return [...prev.slice(0, -1), { ...last, text, final: true }];
        }
        return [...prev, { role: "user", text, final: true }];
      });
    };

    return (
      <button className="suggestion-button" onClick={handleClickTextButton}>
        {text}
      </button>
    );
  };

  return (
    <div className="conversation-transcript">
      <div className="conversation-scroll" ref={scrollRef}>
        {transcript.length === 0 ? (
          <div className="conversation-quickstarts">
            <span className="quickstarts-title">Quick starts</span>
            <SuggestionTextButton text="Tell me about Chad in a nutshell" />
            <SuggestionTextButton text="What are Chad's biggest opportunities for growth?" />
            <SuggestionTextButton
              text="Let's create a development plan together for Chad's weakest
            competency"
            />
          </div>
        ) : (
          <div className="conversation-messages">
            {transcript.map((entry, index) => {
              const isUser = entry.role === "user";
              return (
                <div
                  key={index}
                  className={`message ${
                    isUser ? "user-message" : "agent-message"
                  }`}
                >
                  <span className="message-text">
                    {entry.text}
                    {!entry.final && (
                      <span
                        className={`cursor-blink ${
                          isUser ? "text-white" : "text-black"
                        }`}
                      >
                        |
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
            {/* dummy element to scroll into view */}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <TextMessageInput />
    </div>
  );
};

export default ConversationTranscript;
