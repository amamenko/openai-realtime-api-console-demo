import { useEffect } from "react";
import { useConversationSession } from "../context/ConversationSessionProvider";

// Custom hook to manage data channel listeners and events
export const useDataChannelEvents = () => {
  const {
    dataChannel,
    setIsSessionActive,
    setEvents,
    sendClientEvent,
    toolCallsRef,
    functionsSystemPrompt,
    selectedPlaybookId,
    playbookContent,
    talentIqDictionaryToc,
    setLiveTranscript,
    setConversationState,
  } = useConversationSession();

  useEffect(() => {
    if (!dataChannel) return;

    const callServerTool = async (name, args) => {
      switch (name) {
        case "get_talentiq_dictionary_section": {
          const sectionId = encodeURIComponent(args?.section_id || "");
          const response = await fetch(
            `/get_talentiq_dictionary_section?section_id=${sectionId}`,
          );
          if (!response.ok)
            throw new Error("get_talentiq_dictionary_section failed");
          return response.json();
        }
        default:
          return {
            error: "unknown_function",
            message: `Unknown function: ${name}. Must be get_talentiq_dictionary_section.`,
          };
      }
    };

    const safeParse = (s) => {
      try {
        return JSON.parse(s);
      } catch {
        return {};
      }
    };

    const handleOpen = () => {
      setIsSessionActive(true);
      setEvents([]);

      sendClientEvent({
        type: "session.update",
        session: {
          modalities: ["audio", "text"],
          turn_detection: {
            type: "server_vad",
            create_response: true,
            interrupt_response: true,
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 350,
          },
        },
      });

      // Register tools (function calls)
      const tools = [
        {
          type: "function",
          name: "get_talentiq_dictionary_section",
          description:
            "Retrieve a specific section from the TalentIQ dictionary by section ID.",
          parameters: {
            type: "object",
            properties: {
              section_id: {
                type: "string",
                description: "ID of the dictionary section to retrieve",
              },
            },
            required: ["section_id"],
          },
        },
      ];

      sendClientEvent({
        type: "session.update",
        session: { tools, tool_choice: "auto" },
      });

      // Seed playbook context as system message
      if (selectedPlaybookId && playbookContent) {
        sendClientEvent({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "system",
            content: [
              {
                type: "input_text",
                text: `Playbook Context for ${selectedPlaybookId}:\n\n${playbookContent}`,
              },
            ],
          },
        });
      }

      // Seed TalentIQ Dictionary TOC as system message
      if (talentIqDictionaryToc) {
        sendClientEvent({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "system",
            content: [
              {
                type: "input_text",
                text: `TalentIQ Dictionary TOC:\n\n${JSON.stringify(
                  talentIqDictionaryToc,
                  null,
                  2,
                )}`,
              },
            ],
          },
        });
      }

      // Seed custom functions system prompt as system message
      if (functionsSystemPrompt) {
        sendClientEvent({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "system",
            content: [
              {
                type: "input_text",
                text: functionsSystemPrompt,
              },
            ],
          },
        });
      }
    };

    // Message handler: UI feedback, transcripts, user echo, and tool calls
    const handleMessage = async (e) => {
      const evt = JSON.parse(e.data);
      evt.timestamp = evt.timestamp || new Date().toLocaleTimeString();

      // Handle message types (live transcript)
      if (evt.type === "response.audio_transcript.delta") {
        setLiveTranscript((prev) => prev + evt.delta);
      }
      if (evt.type === "response.audio_transcript.done") {
        setLiveTranscript(evt.transcript);
      }

      if (evt.type === "response.created") {
        setConversationState("thinking");
        setLiveTranscript("");
      }

      if (evt.type === "output_audio_buffer.started") {
        setConversationState("speaking");
      }

      if (
        evt.type === "response.audio.done" ||
        evt.type === "output_audio_buffer.stopped"
      ) {
        setConversationState("idle");
      }

      // Handle tool calls
      if (
        evt.type === "response.output_item.added" &&
        evt.item?.type === "function_call"
      ) {
        const callId = evt.item.call_id || evt.item.id;
        toolCallsRef.current[callId] = { name: evt.item.name, args: "" };
      }

      if (evt.type === "response.function_call_arguments.delta") {
        const { call_id, delta } = evt;
        if (!toolCallsRef.current[call_id])
          toolCallsRef.current[call_id] = { name: "", args: "" };
        toolCallsRef.current[call_id].args += delta || "";
      }

      if (evt.type === "response.function_call_arguments.done") {
        const { call_id, arguments: argsJson } = evt;
        const entry = toolCallsRef.current[call_id] || { name: "", args: "" };
        const name = entry.name;
        const finalArgs = safeParse(argsJson || entry.args || "{}");

        try {
          const output = await callServerTool(name, finalArgs);

          // Check for specific error object returned from callServerTool
          if (output.error === "unknown_function") {
            // Send the specific error message back to the model
            sendClientEvent({
              type: "conversation.item.create",
              item: {
                type: "function_call_output",
                call_id,
                output: JSON.stringify(output),
              },
            });
          } else {
            // Standard success path
            sendClientEvent({
              type: "conversation.item.create",
              item: {
                type: "function_call_output",
                call_id,
                output: JSON.stringify(output),
              },
            });
          }

          // Model should continue using the tool output or handle the error
          sendClientEvent({
            type: "response.create",
            response: { modalities: ["audio", "text"] },
          });
        } catch (err) {
          console.error("Tool error:", err);

          // Send error output back to model
          sendClientEvent({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id,
              output: JSON.stringify({
                error: "tool_error",
                message: String(err?.message || err),
              }),
            },
          });

          // Continue the response to allow model to handle error
          sendClientEvent({
            type: "response.create",
            response: { modalities: ["audio", "text"] },
          });
        } finally {
          delete toolCallsRef.current[call_id];
        }
      }

      // Log all events
      setEvents((prev) => [evt, ...prev]);
    };

    dataChannel.addEventListener("open", handleOpen);
    dataChannel.addEventListener("message", handleMessage);

    return () => {
      dataChannel.removeEventListener("open", handleOpen);
      dataChannel.removeEventListener("message", handleMessage);
    };
  }, [
    dataChannel,
    selectedPlaybookId,
    playbookContent,
    functionsSystemPrompt,
    sendClientEvent,
    setEvents,
    setIsSessionActive,
    toolCallsRef,
    setLiveTranscript,
    setConversationState,
  ]);
};
