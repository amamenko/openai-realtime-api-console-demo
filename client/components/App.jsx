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
  const [transcript, setTranscript] = useState([]);
  const [isWandaModalOpen, setIsWandaModalOpen] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);

  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const micVisualizerRef = useRef(null);
  const agentVisualizerRef = useRef(null);
  const audioContextRef = useRef(null);
  const localStreamRef = useRef(null);
  const toolCallsRef = useRef({}); // { [call_id]: { name, args: string } }

  // Debounce timers
  const userSpeakingTimeout = useRef(null);
  const userSilenceTimeout = useRef(null);
  const agentSpeakingTimeout = useRef(null);
  const agentSilenceTimeout = useRef(null);

  const { playbookIds, functionsSystemPrompt } = useBootData();
  const { playbookContent, loadPlaybookContent } = usePlaybookContent();
  const { talentIqDictionaryToc, loadTalentIqDictionaryToc } =
    useTalentIqDictionaryToc();

  const detectSpeech = (analyser, setSpeakingState, type) => {
    const buffer = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(buffer);

    // Compute RMS (Root Mean Square) volume
    let sumSquares = 0;
    for (const value of buffer) {
      const normalized = value / 128 - 1; // range [-1, 1]
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / buffer.length);

    const isSilentFrame = buffer.every((v) => v === 128);

    // Thresholds
    const SPEAKING_THRESHOLD = 0.07;
    const SPEAKING_DEBOUNCE = 100;
    const SILENCE_DEBOUNCE = 1250;

    const speakingRef =
      type === "user" ? userSpeakingTimeout : agentSpeakingTimeout;
    const silenceRef =
      type === "user" ? userSilenceTimeout : agentSilenceTimeout;

    if (rms > SPEAKING_THRESHOLD && !isSilentFrame) {
      // Voice detected
      clearTimeout(silenceRef.current);
      silenceRef.current = null;

      if (!speakingRef.current) {
        speakingRef.current = setTimeout(() => {
          setSpeakingState(true);
          speakingRef.current = null;
        }, SPEAKING_DEBOUNCE);
      }
    } else {
      // Silence detected
      clearTimeout(speakingRef.current);
      speakingRef.current = null;

      if (!silenceRef.current) {
        silenceRef.current = setTimeout(() => {
          setSpeakingState(false);
          silenceRef.current = null;
        }, SILENCE_DEBOUNCE);
      }
    }
  };

  const visualize = (analyser, canvasRef, type) => {
    if (!canvasRef) return;
    const canvas = canvasRef;
    const canvasCtx = canvas.getContext("2d");
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    // Create the gradient outside the draw loop for performance
    const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#5b87e2");
    gradient.addColorStop(1, "#a546d1");

    const draw = () => {
      if (
        !audioContextRef.current ||
        audioContextRef.current.state === "closed"
      )
        return;

      requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      detectSpeech(
        analyser,
        type === "user" ? setIsUserSpeaking : setIsAgentSpeaking,
        type,
      );

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i];

        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(
          x,
          canvas.height - barHeight / 2,
          barWidth,
          barHeight / 2,
        );

        x += barWidth + 1;
      }
    };

    draw();
  };

  const startSession = async (playbookId = "") => {
    // Stop any existing session before starting a new one
    if (peerConnection.current || dataChannel) stopSession();

    setTranscript([]);
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

        e.streams[0].getAudioTracks().forEach((track) => {
          track.onended = () => {
            setIsAgentSpeaking(false);
          };
        });

        const remoteStreamSource =
          audioContextRef.current.createMediaStreamSource(e.streams[0]);
        const agentAnalyser = audioContextRef.current.createAnalyser();
        remoteStreamSource.connect(agentAnalyser);

        // Start the visualization loop for agent audio
        visualize(agentAnalyser, agentVisualizerRef.current, "agent");
      }
    };

    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();

    // Mic
    const ms = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    localStreamRef.current = ms; // for muting/unmuting later
    const [track] = ms.getAudioTracks();
    pc.addTrack(track, ms);

    const micSource = audioContextRef.current.createMediaStreamSource(ms);
    const micAnalyser = audioContextRef.current.createAnalyser();
    micSource.connect(micAnalyser);

    // Start the visualization loop for mic audio
    visualize(micAnalyser, micVisualizerRef.current, "user");

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
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (audioElement.current) {
        audioElement.current.srcObject = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      setIsMicMuted(false);
      setIsUserSpeaking(false);
      setIsAgentSpeaking(false);
      setTranscript([]);
      setConversationState("idle");
      clearTimeout(userSpeakingTimeout.current);
      clearTimeout(userSilenceTimeout.current);
      clearTimeout(agentSpeakingTimeout.current);
      clearTimeout(agentSilenceTimeout.current);
      userSpeakingTimeout.current = null;
      userSilenceTimeout.current = null;
      agentSpeakingTimeout.current = null;
      agentSilenceTimeout.current = null;
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
    // If the agent is currently speaking, cancel its response first
    if (isAgentSpeaking) {
      sendClientEvent({ type: "response.cancel" });
      setIsAgentSpeaking(false);
    }

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

  const muteMicrophone = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      setIsMicMuted(true);
    }
  };

  const unmuteMicrophone = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      setIsMicMuted(false);
    }
  };

  const toggleMicrophone = () => {
    if (isMicMuted) {
      unmuteMicrophone();
    } else {
      muteMicrophone();
    }
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
      transcript={transcript}
      setTranscript={setTranscript}
      isWandaModalOpen={isWandaModalOpen}
      setIsWandaModalOpen={setIsWandaModalOpen}
      isUserSpeaking={isUserSpeaking}
      isAgentSpeaking={isAgentSpeaking}
      muteMicrophone={muteMicrophone}
      unmuteMicrophone={unmuteMicrophone}
      toggleMicrophone={toggleMicrophone}
      isMicMuted={isMicMuted}
    >
      <audio
        ref={audioElement}
        id="remoteAudio"
        autoPlay
        playsInline
        style={{ display: "none" }}
      />
      <Header />
      <ConversationBody
        micVisualizerRef={micVisualizerRef}
        agentVisualizerRef={agentVisualizerRef}
      />
    </ConversationSessionProvider>
  );
}
