import React, { forwardRef } from "react";
import SessionControls from "./SessionControls";
import EventLog from "./EventLog";
import { useDataChannelEvents } from "../hooks/useDataChannelEvents";
import WandaModal from "./WandaModal";
// import ToolPanel from "./ToolPanel";

const ConversationBody = forwardRef(
  ({ micVisualizerRef, agentVisualizerRef }, ref) => {
    useDataChannelEvents();

    return (
      <>
        <WandaModal
          micVisualizerRef={micVisualizerRef}
          agentVisualizerRef={agentVisualizerRef}
        />
        <main className="absolute top-16 left-0 right-0 bottom-0">
          <section className="absolute top-0 left-0 right-0 bottom-0 flex">
            <section className="absolute top-0 left-0 right-0 bottom-32 px-4 overflow-y-auto">
              <EventLog />
            </section>
            <section className="absolute h-32 left-0 right-0 bottom-0 p-4 border-t-2">
              <SessionControls />
            </section>
          </section>
          {/* <section className="absolute top-0 w-[380px] right-0 bottom-0 p-4 pt-0 overflow-y-auto">
            <ToolPanel />
          </section> */}
        </main>
      </>
    );
  },
);

export default ConversationBody;
