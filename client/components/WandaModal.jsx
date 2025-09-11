import React from "react";
import { useConversationSession } from "../context/ConversationSessionProvider";
import SessionControls from "./SessionControls";
import AuctusIQLogo from "../assets/auctusiq-logo.png";

const WandaModal = () => {
  const {
    isSessionActive,
    conversationState,
    liveTranscript,
    setLiveTranscript,
    setConversationState,
    isWandaModalOpen,
    setIsWandaModalOpen,
    stopSession,
  } = useConversationSession();

  if (!isWandaModalOpen) return null;

  const isWandaListening =
    conversationState === "listening" ||
    (conversationState === "idle" && isSessionActive);

  const handleCloseWandaModal = () => {
    setIsWandaModalOpen(false);
    stopSession();
    setLiveTranscript("");
    setConversationState("idle");
  };

  const StateIcon = () => {
    switch (conversationState) {
      case "listening":
        return "🎤";
      case "thinking":
        return "💭";
      case "speaking":
        return "🗣️";
      case "idle":
        return isSessionActive ? (
          "👂"
        ) : (
          <img className="w-3/4 pb-2" src={AuctusIQLogo} />
        );
      default:
        return <img className="w-3/4 pb-2" src={AuctusIQLogo} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-2xl w-[800px] h-3/4 flex flex-col justify-center items-center gap-y-4">
        <p className="absolute top-4 text-lg font-medium">Ask Wanda</p>
        <button
          className="absolute top-2 right-4 cursor-pointer"
          onClick={handleCloseWandaModal}
        >
          <p className="font-bold text-xl">X</p>
        </button>
        <div
          className={`
    w-32 h-32 rounded-full 
    bg-gradient-to-br from-blue-100 to-indigo-300 
    flex items-center justify-center 
    text-white text-5xl font-bold ${
      isWandaListening ? "animate-pulse-scale" : ""
    }
  `}
        >
          <StateIcon />
        </div>

        <p className="mt-4 text-lg font-medium">
          {conversationState === "listening" && "Listening..."}
          {conversationState === "thinking" && "Thinking..."}
          {conversationState === "speaking" && "Speaking..."}
          {conversationState === "idle"
            ? isSessionActive
              ? "Wanda is listening"
              : "Start a session to speak to Wanda"
            : ""}
        </p>

        {isSessionActive ? (
          <div className="mt-2 w-full overflow-auto max-h-40 min-h-40 border p-4 rounded-lg bg-zinc-50 flex flex-col items-center justify-center gap-y-2">
            {!liveTranscript ? (
              <p className="text-gray-400 text-center px-16 self-center">
                Wanda's response will appear here...
              </p>
            ) : (
              <>
                <p className="text-gray-600 text-center bg-gray-200 w-fit mx-auto rounded px-4 py-1 border border-gray-300 mb-2">
                  Wanda says:
                </p>
                <p className="text-gray-600 text-center px-16 self-center">
                  {liveTranscript}
                </p>
              </>
            )}
          </div>
        ) : (
          <></>
        )}

        <div className="mt-6 w-full px-8">
          <SessionControls orientation="vertical" />
        </div>
      </div>
    </div>
  );
};

export default WandaModal;
