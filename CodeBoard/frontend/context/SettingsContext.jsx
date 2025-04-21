import { createContext, useState } from "react";

export const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const defaultSettings = {
    language: "javascript",
    theme: "vscodeDark",
    username: "",
    roomId: "",
  };
  const [settings, setSettings] = useState(defaultSettings);
  const updateSettings = (key, value) => {
    setSettings((prevSettings) => ({ ...prevSettings, [key]: value }));
  };
  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
