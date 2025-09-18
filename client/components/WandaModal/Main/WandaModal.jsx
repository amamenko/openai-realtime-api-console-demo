import React, { forwardRef, useRef } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { useConversationSession } from "../../../context/ConversationSessionProvider";
import useOutsideClick from "../../../hooks/useOutsideClick";
import ConversationTranscript from "../ConversationTranscript/ConversationTranscript";
import "./WandaModal.scss";

const WandaModal = forwardRef(
  ({ micVisualizerRef, agentVisualizerRef }, ref) => {
    const {
      isSessionActive,
      conversationState,
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

    const modalRef = useRef(null);

    const handleCloseWandaModal = () => {
      setIsWandaModalOpen(false);
      stopSession();
      setTranscript([]);
      setConversationState("idle");
    };

    useOutsideClick(modalRef, handleCloseWandaModal);

    if (!isWandaModalOpen) return null;

    const isWandaListening = isUserSpeaking && isSessionActive;

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
      <div className="wanda-modal-overlay">
        <div className="wanda-modal-container" ref={modalRef}>
          <div className="wanda-modal-header">
            <h2>Ask Wanda</h2>
            <span>
              Wanda is ready to discuss your seller Chad - whether that be
              reviewing his talents and skills, helping you coach him to
              improve, offering guidance for a conversation or anything else!
            </span>
          </div>
          <button className="wanda-modal-close" onClick={handleCloseWandaModal}>
            <span>X</span>
          </button>

          <div className="wanda-modal-content">
            <div className="wanda-modal-left">
              <div className="wanda-visualizer">
                <div
                  className={`wanda-gradient ${
                    isWandaListening ? "pulse" : ""
                  }`}
                />
                <canvas
                  ref={micVisualizerRef}
                  className={`wanda-canvas ${isWandaListening ? "pulse" : ""}`}
                  style={{
                    opacity: isSessionActive && isWandaListening ? 1 : 0,
                  }}
                />
                <canvas
                  ref={agentVisualizerRef}
                  className={`wanda-canvas ${isWandaListening ? "pulse" : ""}`}
                  style={{
                    opacity: isSessionActive && !isWandaListening ? 1 : 0,
                  }}
                />

                <div
                  className="wanda-state-indicator"
                  style={{ borderColor: getStateColor() }}
                >
                  <div
                    className="state-dot"
                    style={{ backgroundColor: getStateColor() }}
                  />
                  <h2>
                    <StateText />
                  </h2>
                </div>

                <button className="wanda-mic-toggle" onClick={toggleMicrophone}>
                  {isMicMuted ? (
                    <FaMicrophoneSlash size={24} color="rgb(130,130,130)" />
                  ) : (
                    <FaMicrophone size={24} color="rgb(130,130,130)" />
                  )}
                </button>
              </div>
            </div>
            <ConversationTranscript />
          </div>
        </div>
      </div>
    );
  },
);

export default WandaModal;
