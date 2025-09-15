import React, { forwardRef } from "react";
import { useConversationSession } from "../context/ConversationSessionProvider";
import SessionControls from "./SessionControls";
import AuctusIQLogo from "../assets/auctusiq-logo.png";

const WandaModal = forwardRef(
  ({ micVisualizerRef, agentVisualizerRef }, ref) => {
    const {
      isSessionActive,
      conversationState,
      liveTranscript,
      setLiveTranscript,
      setConversationState,
      isWandaModalOpen,
      setIsWandaModalOpen,
      stopSession,
      isUserSpeaking,
      isAgentSpeaking,
    } = useConversationSession();

    if (!isWandaModalOpen) return null;

    const isWandaListening = isUserSpeaking && isSessionActive;

    const handleCloseWandaModal = () => {
      setIsWandaModalOpen(false);
      stopSession();
      setLiveTranscript("");
      setConversationState("idle");
    };

    const AuctusIQLogoImage = () => {
      return <img className="w-3/4 pb-2" src={AuctusIQLogo} />;
    };

    const StateIcon = () => {
      if (!isSessionActive) return <AuctusIQLogoImage />;
      if (isUserSpeaking) return "👂";
      if (isAgentSpeaking) return "🗣️";

      switch (conversationState) {
        case "listening":
          return "🎤";
        case "thinking":
          return "💭";
        case "speaking":
          return "🗣️";
        case "idle":
          return "👂";
        default:
          return <AuctusIQLogoImage />;
      }
    };

    const StateText = () => {
      if (!isSessionActive) return "Start a session to speak to Wanda";
      if (isUserSpeaking) return "Listening...";
      if (isAgentSpeaking) return "Speaking...";

      switch (conversationState) {
        case "listening":
          return "Listening...";
        case "thinking":
          return "Thinking...";
        case "speaking":
          return "Speaking...";
        case "idle":
          return "Wanda is listening";
        default:
          return "";
      }
    };

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="relative bg-white rounded-2xl w-[800px] h-3/4 min-h-[609px] max-h-[609px] overflow-hidden">
          {isSessionActive && (
            <div className="absolute top-4 left-4">
              <SessionControls includeTextMessages={false} />
            </div>
          )}
          <p className="absolute top-5 left-1/2 -translate-x-1/2 text-lg font-medium">
            Ask Wanda
          </p>
          <button
            className="absolute top-4 right-4 cursor-pointer"
            onClick={handleCloseWandaModal}
          >
            <p className="font-bold text-xl">X</p>
          </button>

          <div
            className={`absolute left-0 right-0 mx-auto w-32 h-32 flex items-center justify-center text-5xl font-bold transition-all duration-300 ease-in-out rounded-full ${
              isSessionActive
                ? "top-[60px] translate-y-0"
                : "top-1/4 -translate-y-1/6"
            } ${isWandaListening ? "animate-pulse-scale" : ""}`}
          >
            <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-indigo-300" />
            <canvas
              ref={micVisualizerRef}
              className="absolute inset-0 rounded-full z-10 w-full h-full"
              style={{ opacity: isSessionActive && isWandaListening ? 1 : 0 }}
            />
            <canvas
              ref={agentVisualizerRef}
              className="absolute inset-0 rounded-full z-10 w-full h-full"
              style={{ opacity: isSessionActive && !isWandaListening ? 1 : 0 }}
            />
            <div className="relative z-10 flex items-center justify-center w-full h-full">
              <StateIcon />
            </div>
          </div>
          <p
            className={`absolute ${
              isSessionActive ? "top-56" : "top-96"
            } left-1/2 -translate-x-1/2 text-lg font-medium duration-300 transition-opacity text-center`}
          >
            <StateText />
          </p>

          <div
            className={`
            absolute bottom-6 left-6 right-6 
            h-[calc(100%-20rem)] border p-4 rounded-lg bg-zinc-50 overflow-hidden
            transition-opacity duration-500 ease-in-out
            ${
              isSessionActive
                ? "opacity-100 delay-500"
                : "opacity-0 delay-0 pointer-events-none"
            }
          `}
          >
            {!liveTranscript ? (
              <p className="text-gray-400 text-center px-16 self-center">
                Wanda's response will appear here...
              </p>
            ) : (
              <>
                <p className="absolute top-4 left-0 right-0 text-gray-600 text-center bg-gray-200 w-fit mx-auto rounded px-4 py-1 border border-gray-300 mb-2">
                  Wanda says:
                </p>
                <div className="flex flex-col items-center justify-center gap-y-2">
                  <div className="max-h-[225px] overflow-auto mt-10">
                    <p className="text-gray-600 text-center px-16 self-center">
                      {liveTranscript}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {!isSessionActive && (
            <div className="absolute bottom-24 w-full px-8">
              <SessionControls includeTextMessages={false} />
            </div>
          )}
        </div>
      </div>
    );
  },
);

export default WandaModal;
