import React from "react";
import logo from "/assets/openai-logomark.svg";
import { useConversationSession } from "../context/ConversationSessionProvider";

const Header = () => {
  const { isWandaModalOpen, setIsWandaModalOpen } = useConversationSession();

  const handleOpenWandaModal = () => {
    if (!isWandaModalOpen) setIsWandaModalOpen(true);
  };

  return (
    <nav className="absolute top-0 left-0 right-0 h-16 flex justify-between items-center border-0 border-b border-solid border-gray-200">
      <div className="flex items-center gap-4 w-full m-4">
        <img className="w-6" src={logo} />
        <h1>Avi OpenAI Realtime API Demo Console</h1>
      </div>
      <button
        className="w-48 h-12 bg-blue-500 m-4 rounded px-4 py-2 text-white opacity-100 hover:opacity-80 transition-opacity"
        onClick={handleOpenWandaModal}
      >
        Talk to Wanda
      </button>
    </nav>
  );
};

export default Header;
