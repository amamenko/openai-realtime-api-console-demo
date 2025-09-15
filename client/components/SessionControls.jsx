import { useState, useRef, useEffect } from "react";
import { CloudLightning, CloudOff, MessageSquare } from "react-feather";
import Button from "./Button";
import { useConversationSession } from "../context/ConversationSessionProvider";

const SessionStopped = ({ playbookId }) => {
  const { startSession } = useConversationSession();
  const [isActivating, setIsActivating] = useState(false);

  const handleStartSession = () => {
    if (isActivating) return;

    setIsActivating(true);

    if (playbookId) {
      startSession(playbookId);
    } else {
      startSession();
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full">
      <Button
        onClick={handleStartSession}
        className={`w-full ${
          isActivating ? "!bg-gray-400" : "!bg-blue-100"
        } opacity-100 hover:opacity-70 transition-opacity`}
        icon={<CloudLightning height={16} color="black" />}
      >
        <span className="text-black">
          {isActivating
            ? "starting session..."
            : `start${playbookId ? ` ${playbookId} ` : " "}session`}
        </span>
      </Button>
    </div>
  );
};

const SessionActive = ({
  orientation = "horizontal",
  includeTextMessages = true,
}) => {
  const { stopSession, sendTextMessage } = useConversationSession();

  const [message, setMessage] = useState("");

  const handleSendClientEvent = () => {
    sendTextMessage(message);
    setMessage("");
  };

  const isHorizontal = !orientation || orientation === "horizontal";

  return (
    <div
      className={`flex items-center justify-center w-full gap-4 ${
        isHorizontal ? "flex-row" : "flex-col"
      }`}
    >
      {includeTextMessages && (
        <div className="flex flex-row gap-2  w-full h-full">
          <input
            onKeyDown={(e) => {
              if (e.key === "Enter" && message.trim()) {
                handleSendClientEvent();
              }
            }}
            type="text"
            placeholder="send a text message..."
            className={`border border-gray-200 rounded p-4 flex-1 ${
              isHorizontal ? "" : "w-full"
            }`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button
            onClick={() => {
              if (message.trim()) {
                handleSendClientEvent();
              }
            }}
            icon={<MessageSquare height={16} />}
            className={`flex min-w-[135px] ${
              isHorizontal ? "flex-[0.2]" : "flex-[0.25]"
            } items-center justify-center bg-blue-400 ${
              isHorizontal ? "max-h-1" : "w-full"
            }`}
          >
            send text
          </Button>
        </div>
      )}
      <Button
        className={`flex items-enter justify-center bg-red-800 ${
          isHorizontal ? "max-h-1" : "w-full"
        }`}
        onClick={stopSession}
        icon={<CloudOff height={16} />}
      >
        disconnect
      </Button>
    </div>
  );
};

const SessionControls = ({
  orientation = "horizontal",
  includeTextMessages = true,
}) => {
  const { isSessionActive, playbookIds = [] } = useConversationSession();
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownUp, setIsDropdownUp] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isHovered && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - containerRect.bottom;
      const dropdownHeight = playbookIds.length * 40 + 48; // Rough estimate of dropdown height

      setIsDropdownUp(spaceBelow < dropdownHeight);
    }
  }, [isHovered, playbookIds.length]);

  return (
    <div className="relative h-full" ref={containerRef}>
      {isSessionActive ? (
        <SessionActive
          orientation={orientation}
          includeTextMessages={includeTextMessages}
        />
      ) : playbookIds.length > 0 ? (
        <div
          className="relative flex items-center justify-center w-fit h-full self-center mx-auto"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Button className="bg-transparent border border-zinc-600 rounded">
            <span className="text-black">Start Session</span>
          </Button>
          <div
            className={`absolute left-0 right-0 mx-auto w-max bg-white border border-gray-200 rounded shadow-lg transition-opacity duration-300 ${
              isHovered ? "opacity-100 visible" : "opacity-0 invisible"
            } ${isDropdownUp ? "bottom-full" : "top-full"} z-50`}
          >
            <ul className="flex flex-col gap-2 p-2">
              {playbookIds.map((playbookId) => (
                <li key={playbookId}>
                  <SessionStopped playbookId={playbookId} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="relative flex items-center justify-center w-full h-full">
          <Button className="bg-transparent border border-zinc-600 rounded pointer-events-none opacity-50">
            <span className="text-black">Start Session</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default SessionControls;
