import { motion } from "framer-motion";
import { UserRound } from "lucide-react";
import type { ChatMessage } from "../../store/voiceStore";

interface UserMessageProps {
  message: ChatMessage;
}

const UserMessage = ({ message }: UserMessageProps) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22 }}
    className="ml-auto max-w-[88%] sm:max-w-[75%]"
  >
    <div className="rounded-2xl rounded-tr-sm border border-cyan-300/35 bg-gradient-to-br from-cyan-500/30 to-blue-500/25 p-3">
      <div className="mb-1 flex items-center gap-2 text-[11px] text-cyan-100/90">
        <UserRound className="h-3.5 w-3.5" />
        <span className="title-font tracking-wide">Patient</span>
        {message.language && <span className="rounded-full bg-white/10 px-2 py-0.5">{message.language}</span>}
      </div>
      <p className="text-sm leading-relaxed text-cyan-50">{message.text}</p>
      <p className="mt-2 text-right text-[10px] text-cyan-100/60">
        {new Date(message.createdAt).toLocaleTimeString()}
      </p>
    </div>
  </motion.div>
);

export default UserMessage;
