import { useRef, useState } from "react";
import { useBootData } from "../hooks/useBootData";
import { usePlaybookContent } from "../hooks/usePlaybookContent";
import { useTalentIqDictionaryToc } from "../hooks/useTalentIqDictionaryToc";
import { ConversationSessionProvider } from "../context/ConversationSessionProvider";
import ConversationBody from "./ConversationBody";
import Header from "./Header";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState("");

  // Ask Wanda Modal UI state
  const [conversationState, setConversationState] = useState("idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isWandaModalOpen, setIsWandaModalOpen] = useState(false);

  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const toolCallsRef = useRef({}); // { [call_id]: { name, args: string } }

  const { playbookIds, functionsSystemPrompt } = useBootData();
  const { playbookContent, loadPlaybookContent } = usePlaybookContent();
  const { talentIqDictionaryToc, loadTalentIqDictionaryToc } =
    useTalentIqDictionaryToc();

  const startSession = async (playbookId = "") => {
    // Stop any existing session before starting a new one
    if (peerConnection.current || dataChannel) stopSession();

    setLiveTranscript("");
    setConversationState("idle");

    const url = playbookId
      ? `/token?playbookId=${encodeURIComponent(playbookId)}`
      : "/token";

    setSelectedPlaybookId(playbookId);
    await loadPlaybookContent(playbookId);
    await loadTalentIqDictionaryToc();

    // Mint ephemeral session
    const tokenResponse = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const sessionData = await tokenResponse.json();
    const EPHEMERAL_KEY = sessionData.client_secret.value;
    const modelFromServer =
      sessionData.model || "gpt-4o-realtime-preview-2025-06-03";

    // Peer connection with STUN
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }], // Public STUN server
      bundlePolicy: "max-bundle",
    });
    pc.addTransceiver("audio", { direction: "sendrecv" });

    // Remote audio hookup (audio element already in DOM)
    pc.ontrack = (e) => {
      if (audioElement.current) {
        audioElement.current.srcObject = e.streams[0];
        audioElement.current.play().catch(() => {});
      }
    };

    // Mic
    const ms = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    const [track] = ms.getAudioTracks();
    pc.addTrack(track, ms);

    // Data channel for events
    const dc = pc.createDataChannel("oai-events", { ordered: true });
    setDataChannel(dc);

    // Confirm ICE connection
    pc.oniceconnectionstatechange = () =>
      console.log("ice:", pc.iceConnectionState);
    pc.onconnectionstatechange = () => console.log("pc:", pc.connectionState);

    // Create offer and set local desc
    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);

    // Wait for ICE to finish, then send final SDP to OpenAI
    await new Promise((resolve) => {
      if (pc.iceGatheringState === "complete") return resolve();
      const check = () => {
        if (pc.iceGatheringState === "complete") {
          pc.removeEventListener("icegatheringstatechange", check);
          resolve();
        }
      };
      pc.addEventListener("icegatheringstatechange", check);
    });

    const baseUrl = "https://api.openai.com/v1/realtime";
    const sdpResponse = await fetch(
      `${baseUrl}?model=${encodeURIComponent(modelFromServer)}`,
      {
        method: "POST",
        body: pc.localDescription.sdp, // Final SDP, not offer.sdp
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      },
    );

    // Apply answer
    const answerSdp = await sdpResponse.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    peerConnection.current = pc;
  };

  // Stop current session, clean up peer connection and data channel
  const stopSession = () => {
    try {
      if (dataChannel) dataChannel.close();

      if (peerConnection.current) {
        peerConnection.current.getSenders().forEach((sender) => {
          if (sender.track) {
            sender.track.stop();
          }
        });

        peerConnection.current.close();
      }
    } catch (error) {
      console.error("Error stopping session:", error);
    } finally {
      setIsSessionActive(false);
      setDataChannel(null);
      peerConnection.current = null;
      toolCallsRef.current = {};
    }
  };

  // Send a message to the model
  const sendClientEvent = (message) => {
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || crypto.randomUUID();

      // send event before setting timestamp since the backend peer doesn't expect this field
      dataChannel.send(JSON.stringify(message));

      // if guard just in case the timestamp exists by miracle
      if (!message.timestamp) message.timestamp = timestamp;
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  };

  // Send a text message to the model
  const sendTextMessage = (message) => {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    sendClientEvent(event);
    sendClientEvent({
      type: "response.create",
      response: { modalities: ["audio", "text"] },
    });
  };

  return (
    <ConversationSessionProvider
      startSession={startSession}
      stopSession={stopSession}
      sendClientEvent={sendClientEvent}
      sendTextMessage={sendTextMessage}
      events={events}
      setEvents={setEvents}
      isSessionActive={isSessionActive}
      setIsSessionActive={setIsSessionActive}
      playbookIds={playbookIds}
      dataChannel={dataChannel}
      toolCallsRef={toolCallsRef}
      functionsSystemPrompt={functionsSystemPrompt}
      selectedPlaybookId={selectedPlaybookId}
      playbookContent={playbookContent}
      talentIqDictionaryToc={talentIqDictionaryToc}
      conversationState={conversationState}
      setConversationState={setConversationState}
      liveTranscript={liveTranscript}
      setLiveTranscript={setLiveTranscript}
      isWandaModalOpen={isWandaModalOpen}
      setIsWandaModalOpen={setIsWandaModalOpen}
    >
      <audio
        ref={audioElement}
        id="remoteAudio"
        autoPlay
        playsInline
        style={{ display: "none" }}
      />
      <Header />
      <ConversationBody />
    </ConversationSessionProvider>
  );
}
