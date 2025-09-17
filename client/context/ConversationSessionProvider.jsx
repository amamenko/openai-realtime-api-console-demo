import React, { createContext, useContext } from "react";

const ConversationSessionContext = createContext(null);

export const useConversationSession = () => {
  const ctx = useContext(ConversationSessionContext);
  if (!ctx)
    throw new Error(
      "useConversationSession must be used within ConversationSessionProvider",
    );
  return ctx;
};

export const ConversationSessionProvider = ({
  startSession,
  stopSession,
  sendClientEvent,
  sendTextMessage,
  events,
  setEvents,
  isSessionActive,
  setIsSessionActive,
  playbookIds,
  dataChannel,
  toolCallsRef,
  functionsSystemPrompt,
  selectedPlaybookId,
  playbookContent,
  talentIqDictionaryToc,
  isWandaModalOpen,
  setIsWandaModalOpen,
  conversationState,
  setConversationState,
  setTranscript,
  transcript,
  isUserSpeaking,
  isAgentSpeaking,
  muteMicrophone,
  unmuteMicrophone,
  toggleMicrophone,
  isMicMuted,
  children,
}) => {
  return (
    <ConversationSessionContext.Provider
      value={{
        startSession,
        stopSession,
        sendClientEvent,
        sendTextMessage,
        events,
        setEvents,
        isSessionActive,
        setIsSessionActive,
        playbookIds,
        dataChannel,
        toolCallsRef,
        functionsSystemPrompt,
        selectedPlaybookId,
        playbookContent,
        talentIqDictionaryToc,
        isWandaModalOpen,
        setIsWandaModalOpen,
        conversationState,
        setConversationState,
        setTranscript,
        transcript,
        isUserSpeaking,
        isAgentSpeaking,
        muteMicrophone,
        unmuteMicrophone,
        toggleMicrophone,
        isMicMuted,
      }}
    >
      {children}
    </ConversationSessionContext.Provider>
  );
};
