import { useEffect } from "react";
import Home from "./pages/Home";
import { useVoiceStore } from "./store/voiceStore";

const App = () => {
  const setTheme = useVoiceStore((state) => state.setThemeMode);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    setTheme("dark");
  }, [setTheme]);

  return <Home />;
};

export default App;
