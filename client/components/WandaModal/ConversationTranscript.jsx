import React, { useEffect, useRef } from "react";
import { useConversationSession } from "../../context/ConversationSessionProvider";
import TextMessageInput from "./TextMessageInput";

const ConversationTranscript = () => {
  const { transcript, sendTextMessage, setTranscript } =
    useConversationSession();

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  // Scroll to bottom whenever transcript updates
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
      <button
        className="border px-2 py-3 rounded-lg text-left hover:bg-gray-50 w-full"
        onClick={handleClickTextButton}
      >
        {text}
      </button>
    );
  };

  return (
    <div className="relative col-span-4 h-full w-full px-6 bg-white overflow-hidden transition-opacity duration-500 ease-in-out">
      <div
        className="w-full h-[calc(100%-6rem)] pb-24 pt-8 flex flex-col overflow-y-auto"
        ref={scrollRef}
      >
        {transcript.length === 0 ? (
          <div className="w-full h-full flex flex-col items-start justify-start gap-y-3 pt-4">
            <span className="text-base text-gray-500">Quick starts</span>
            <SuggestionTextButton text="Tell me about Chad in a nutshell" />
            <SuggestionTextButton text="What are Chad's biggest opportunities for growth?" />
            <SuggestionTextButton
              text="Let's create a development plan together for Chad's weakest
            competency"
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col gap-y-6">
            {transcript.map((entry, index) => {
              const isUser = entry.role === "user";
              return (
                <div
                  key={index}
                  className={`max-w-[90%] rounded-lg p-2 ${
                    isUser
                      ? "bg-black text-white self-end italic"
                      : "bg-white self-start"
                  }`}
                >
                  <span className="whitespace-pre-wrap inline-block leading-5">
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
