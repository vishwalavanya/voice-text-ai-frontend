import { BrainCircuit } from "lucide-react";
import { useSessionStore } from "../../store/sessionStore";

const SessionMemory = () => {
  const currentIntent = useSessionStore((state) => state.currentIntent);
  const selectedDoctor = useSessionStore((state) => state.selectedDoctor);
  const preferredLanguage = useSessionStore((state) => state.preferredLanguage);
  const currentBookingState = useSessionStore((state) => state.currentBookingState);
  const bookingDraft = useSessionStore((state) => state.bookingDraft);
  const lastToolCall = useSessionStore((state) => state.lastToolCall);
  const lastToolResult = useSessionStore((state) => state.lastToolResult);
  const memoryLog = useSessionStore((state) => state.memoryLog);

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <BrainCircuit className="h-4 w-4 text-violet-200" />
        <p className="title-font text-sm font-semibold text-blue-100">Session Memory</p>
      </div>

      <div className="mb-4 space-y-2 text-xs">
        <div className="rounded-xl border border-blue-300/20 bg-blue-400/10 p-2">
          <p className="text-blue-100/60">Current Intent</p>
          <p className="mt-1 text-blue-50">{currentIntent}</p>
        </div>
        <div className="rounded-xl border border-blue-300/20 bg-blue-400/10 p-2">
          <p className="text-blue-100/60">Selected Doctor</p>
          <p className="mt-1 text-blue-50">{selectedDoctor}</p>
        </div>
        <div className="rounded-xl border border-blue-300/20 bg-blue-400/10 p-2">
          <p className="text-blue-100/60">Preferred Language</p>
          <p className="mt-1 text-blue-50">{preferredLanguage}</p>
        </div>
        <div className="rounded-xl border border-blue-300/20 bg-blue-400/10 p-2">
          <p className="text-blue-100/60">Current Booking State</p>
          <p className="mt-1 text-blue-50">{currentBookingState}</p>
        </div>
        <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-2">
          <p className="text-blue-100/60">Pending Booking Context</p>
          <p className="mt-1 text-blue-50">
            {[
              bookingDraft.dateText,
              bookingDraft.timeText,
              bookingDraft.confirmationSlot,
              bookingDraft.awaitingField ? `awaiting ${bookingDraft.awaitingField}` : ""
            ]
              .filter(Boolean)
              .join(" · ") || "No pending slot"}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-2">
          <p className="text-blue-100/60">Last Tool Call</p>
          <p className="mt-1 text-blue-50">{lastToolCall}</p>
          <p className="mt-1 text-blue-100/70">{lastToolResult}</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-blue-100/55">Memory Log</p>
        <div className="scroll-skin max-h-40 space-y-2 overflow-y-auto pr-1">
          {memoryLog.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="rounded-lg border border-blue-300/15 bg-white/5 px-2 py-1.5 text-xs text-blue-100/70"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SessionMemory;
