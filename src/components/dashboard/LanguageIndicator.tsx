import { motion } from "framer-motion";
import { Languages } from "lucide-react";
import { useSessionStore } from "../../store/sessionStore";
import { useVoiceStore, type SupportedLanguage } from "../../store/voiceStore";

const languageOrder: SupportedLanguage[] = ["English", "Hindi", "Tamil"];

const LanguageIndicator = () => {
  const activeLanguage = useVoiceStore((state) => state.activeLanguage);
  const setLanguage = useVoiceStore((state) => state.setLanguage);
  const setPreferredLanguage = useSessionStore((state) => state.setPreferredLanguage);

  const setActive = (language: SupportedLanguage) => {
    setLanguage(language);
    setPreferredLanguage(language);
  };

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-cyan-200" />
          <p className="title-font text-sm font-semibold text-blue-100">Language</p>
        </div>
        <motion.span
          key={activeLanguage}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-full border border-cyan-300/40 bg-cyan-400/15 px-2 py-1 text-xs text-cyan-100"
        >
          {activeLanguage}
        </motion.span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {languageOrder.map((language) => (
          <button
            key={language}
            type="button"
            onClick={() => setActive(language)}
            className={`rounded-xl border px-2 py-2 text-xs transition ${
              activeLanguage === language
                ? "border-cyan-300/55 bg-cyan-400/20 text-cyan-100 shadow-[0_0_15px_rgba(18,214,223,0.25)]"
                : "border-blue-300/20 bg-white/5 text-blue-100/70 hover:border-blue-200/40"
            }`}
          >
            {language}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageIndicator;
