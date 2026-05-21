import { motion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import AIMessage from "./AIMessage";
import UserMessage from "./UserMessage";
import { useVoiceStore } from "../../store/voiceStore";

const ChatWindow = () => {
  const messages = useVoiceStore((state) => state.messages);
  const userInterim = useVoiceStore((state) => state.currentUserInterim);
  const aiInterim = useVoiceStore((state) => state.currentAIInterim);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const combinedMessageCount = useMemo(
    () => messages.length + Number(Boolean(userInterim)) + Number(Boolean(aiInterim)),
    [aiInterim, messages.length, userInterim]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [combinedMessageCount]);

  return (
    <div className="glass-panel flex h-[420px] flex-col rounded-2xl p-4 sm:h-[500px]">
      <div className="mb-3 flex items-center justify-between">
        <p className="title-font text-sm font-semibold text-blue-100">Realtime Conversation</p>
        <p className="text-xs uppercase tracking-[0.18em] text-blue-100/60">
          {messages.length} messages
        </p>
      </div>

      <div className="scroll-skin flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && !userInterim && !aiInterim ? (
          <div className="grid h-full place-items-center rounded-2xl border border-dashed border-blue-300/25 bg-blue-500/5 p-6 text-center">
            <p className="max-w-sm text-sm text-blue-100/70">
              Start speaking to book an appointment. Transcript and AI replies will appear here
              live.
            </p>
          </div>
        ) : null}

        {messages.map((message) =>
          message.role === "user" ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <AIMessage key={message.id} message={message} />
          )
        )}

        {userInterim ? (
          <motion.div
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 1 }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.9, repeatType: "reverse" }}
            className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm border border-cyan-300/30 bg-cyan-300/10 p-3 text-sm text-cyan-100/80"
          >
            {userInterim}
          </motion.div>
        ) : null}

        {aiInterim ? (
          <motion.div
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 1 }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.9, repeatType: "reverse" }}
            className="mr-auto max-w-[85%] rounded-2xl rounded-tl-sm border border-blue-300/30 bg-blue-300/10 p-3 text-sm text-blue-100/80"
          >
            {aiInterim}
          </motion.div>
        ) : null}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
