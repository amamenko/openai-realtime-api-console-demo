import { useRef, useState } from "react";
import logo from "/assets/openai-logomark.svg";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import ToolPanel from "./ToolPanel";
import { useBootData } from "../hooks/useBootData";
import { usePlaybookContent } from "../hooks/usePlaybookContent";
import { useDataChannelEvents } from "../hooks/useDataChannelEvents";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState("");

  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const toolCallsRef = useRef({}); // { [call_id]: { name, args: string } }

  const { playbookIds, functionsSystemPrompt } = useBootData();
  const { playbookContent, loadPlaybookContent } = usePlaybookContent();

  const startSession = async (playbookId = "") => {
    const url = playbookId
      ? `/token?playbookId=${encodeURIComponent(playbookId)}`
      : "/token";

    setSelectedPlaybookId(playbookId);
    await loadPlaybookContent(playbookId);

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

  useDataChannelEvents({
    dataChannel,
    setIsSessionActive,
    setEvents,
    sendClientEvent,
    toolCallsRef,
    functionsSystemPrompt,
    selectedPlaybookId,
    playbookContent,
  });

  return (
    <>
      <audio
        ref={audioElement}
        id="remoteAudio"
        autoPlay
        playsInline
        style={{ display: "none" }}
      />
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px" }} src={logo} />
          <h1>Avi OpenAI Realtime API Demo Console</h1>
        </div>
      </nav>
      <main className="absolute top-16 left-0 right-0 bottom-0">
        <section className="absolute top-0 left-0 right-[380px] bottom-0 flex">
          <section className="absolute top-0 left-0 right-0 bottom-32 px-4 overflow-y-auto">
            <EventLog events={events} />
          </section>
          <section className="absolute h-32 left-0 right-0 bottom-0 p-4">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              events={events}
              isSessionActive={isSessionActive}
              playbookIds={playbookIds}
            />
          </section>
        </section>
        <section className="absolute top-0 w-[380px] right-0 bottom-0 p-4 pt-0 overflow-y-auto">
          <ToolPanel
            sendClientEvent={sendClientEvent}
            sendTextMessage={sendTextMessage}
            events={events}
            isSessionActive={isSessionActive}
          />
        </section>
      </main>
    </>
  );
}
