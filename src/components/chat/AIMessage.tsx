import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import type { ChatMessage } from "../../store/voiceStore";

interface AIMessageProps {
  message: ChatMessage;
}

const AIMessage = ({ message }: AIMessageProps) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22 }}
    className="mr-auto max-w-[88%] sm:max-w-[75%]"
  >
    <div className="rounded-2xl rounded-tl-sm border border-blue-300/30 bg-gradient-to-br from-white/10 to-blue-700/20 p-3">
      <div className="mb-1 flex items-center gap-2 text-[11px] text-blue-100/90">
        <Bot className="h-3.5 w-3.5" />
        <span className="title-font tracking-wide">Clinical Voice AI</span>
        {message.language && <span className="rounded-full bg-white/10 px-2 py-0.5">{message.language}</span>}
      </div>
      <p className="text-sm leading-relaxed text-blue-50">{message.text}</p>
      <p className="mt-2 text-right text-[10px] text-blue-100/60">
        {new Date(message.createdAt).toLocaleTimeString()}
      </p>
    </div>
  </motion.div>
);

export default AIMessage;
