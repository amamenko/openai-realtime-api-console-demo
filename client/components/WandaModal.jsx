import React, { forwardRef, useEffect, useRef } from "react";
import { useConversationSession } from "../context/ConversationSessionProvider";
import SessionControls from "./SessionControls";
import AuctusIQLogo from "../assets/auctusiq-logo.png";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import useOutsideClick from "../hooks/useOutsideClick";

const WandaModal = forwardRef(
  ({ micVisualizerRef, agentVisualizerRef }, ref) => {
    const {
      isSessionActive,
      conversationState,
      transcript,
      setTranscript,
      setConversationState,
      isWandaModalOpen,
      setIsWandaModalOpen,
      stopSession,
      isUserSpeaking,
      isAgentSpeaking,
      toggleMicrophone,
      isMicMuted,
    } = useConversationSession();

    const scrollRef = useRef(null);
    const bottomRef = useRef(null);
    const modalRef = useRef(null);

    // Scroll to bottom whenever transcript updates
    useEffect(() => {
      if (bottomRef.current)
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }, [transcript]);

    const handleCloseWandaModal = () => {
      setIsWandaModalOpen(false);
      stopSession();
      setTranscript([]);
      setConversationState("idle");
    };

    useOutsideClick(modalRef, handleCloseWandaModal);

    if (!isWandaModalOpen) return null;

    const isWandaListening = isUserSpeaking && isSessionActive;

    const AuctusIQLogoImage = () => {
      return <img className="w-1/4 pb-2" src={AuctusIQLogo} />;
    };

    const StateText = () => {
      if (isUserSpeaking) return "Listening...";
      if (isAgentSpeaking) return "Speaking...";

      switch (conversationState) {
        case "listening":
          return "Listening";
        case "thinking":
          return "Thinking";
        case "speaking":
          return "Speaking";
        case "idle":
          return "Waiting";
        default:
          return "Waiting";
      }
    };

    const getStateColor = () => {
      if (isUserSpeaking) return "rgb(88,206,118)";
      if (isAgentSpeaking) return "rgb(153,128,250)";
      if (conversationState === "thinking") return "rgb(230,159,251)";
      return "rgb(191,191,191)";
    };

    return (
      <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-[1000]">
        <div
          className="relative bg-white rounded-2xl w-[1000px] h-full min-h-[650px] max-h-[650px] overflow-hidden flex items-end"
          ref={modalRef}
          style={{
            boxShadow:
              "0px 4px 20px rgba(0, 0, 0, 0.2), 0px 8px 40px rgba(0, 0, 0, 0.15)",
          }}
        >
          <div className="absolute top-10 left-1/2 -translate-x-1/2 text-center w-4/5">
            <h2 className="text-[1.75rem] font-semibold">Ask Wanda</h2>
            <span className="text-gray-500 text-base leading-5 inline-block mt-3">
              Wanda is ready to discuss your seller Chad - whether that be
              reviewing his talents and skills, helping you coach him to
              improve, offering guidance for a conversation or anything else!
            </span>
          </div>
          <button
            className="absolute top-6 right-8 cursor-pointer"
            onClick={handleCloseWandaModal}
          >
            <span className="font-bold text-3xl text-gray-500">X</span>
          </button>

          <div className="bg-white w-full h-3/4 self-end relative grid grid-cols-6 p-8">
            <div className="col-span-2 bg-white w-full h-full border-r-2 border-gray-200 p-8">
              <div
                className={`relative mx-auto w-36 h-36 flex items-center justify-center text-5xl font-bold transition-all duration-300 ease-in-out rounded-full`}
              >
                <div
                  className={`absolute w-36 h-36 rounded-full ${
                    isWandaListening ? "animate-pulse-scale" : ""
                  }`}
                  style={{
                    background:
                      "linear-gradient(45deg, #3DCBDF 0%, #4C93CE 45%, #D06DF1 80%)",
                  }}
                />
                <canvas
                  ref={micVisualizerRef}
                  className={`absolute inset-0 rounded-full z-10 w-full h-full ${
                    isWandaListening ? "animate-pulse-scale" : ""
                  }`}
                  style={{
                    opacity: isSessionActive && isWandaListening ? 1 : 0,
                  }}
                />
                <canvas
                  ref={agentVisualizerRef}
                  className={`absolute inset-0 rounded-full z-10 w-full h-full ${
                    isWandaListening ? "animate-pulse-scale" : ""
                  }`}
                  style={{
                    opacity: isSessionActive && !isWandaListening ? 1 : 0,
                  }}
                />

                <div
                  className="absolute top-44 border-2 rounded-lg py-1 px-4 bg-white flex items-center justify-center gap-x-3"
                  style={{
                    borderColor: getStateColor(),
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: getStateColor(),
                    }}
                  />
                  <h2
                    className={`text-xl font-medium duration-300 transition-opacity text-center`}
                  >
                    <StateText />
                  </h2>
                </div>
                <button
                  className="absolute top-80 flex items-center justify-center bg-zinc-200 rounded-full p-5 cursor-pointer self-center hover:scale-105 active:scale-95 transition-transform duration-150 ease-in-out"
                  onClick={toggleMicrophone}
                >
                  {isMicMuted ? (
                    <FaMicrophoneSlash size={24} color="rgb(130,130,130)" />
                  ) : (
                    <FaMicrophone size={24} color="rgb(130,130,130)" />
                  )}
                </button>
              </div>
            </div>

            <div
              className="col-span-4 h-full w-full px-6 bg-white overflow-hidden transition-opacity duration-500 ease-in-out overflow-y-auto"
              ref={scrollRef}
            >
              {transcript.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-y-6">
                  <AuctusIQLogoImage />
                  <h2 className="text-2xl font-semibold">
                    Start a conversation with Wanda
                  </h2>
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
          </div>
        </div>
      </div>
    );
  },
);

export default WandaModal;
