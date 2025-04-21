import * as themes from "@uiw/codemirror-themes-all";
import { langNames } from "@uiw/codemirror-extensions-langs";
import { useContext, useEffect, useState } from "react";
import { SettingsContext } from "../../context/SettingsContext";
import ACTIONS from "../Actions";
function Settings({ socketRef }) {
  const capitalizedLanguagesMap = langNames.reduce((acc, item) => {
    acc[item.charAt(0).toUpperCase() + item.slice(1)] = item;
    return acc;
  }, {});
  const capitalizedThemes = Object.keys(themes).reduce((acc, key) => {
    if (key.includes("defaultSettings") || key.includes("Init")) return acc;
    acc[key.charAt(0).toUpperCase() + key.slice(1)] = key;
    return acc;
  }, {});

  const [language, setLanguage] = useState("");
  const [theme, setTheme] = useState("");
  const settingsContext = useContext(SettingsContext);

  useEffect(() => {
    setLanguage(settingsContext.settings.language);
    setTheme(settingsContext.settings.theme);
  }, [settingsContext]);

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    settingsContext.updateSettings("language", e.target.value);
    socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, {
      roomId: settingsContext.settings.roomId,
      username: settingsContext.settings.userName,
      language: e.target.value,
    });
  };
  const handleThemeChange = (e) => {
    setTheme(e.target.value);
    settingsContext.updateSettings("theme", e.target.value);
  };

  return (
    <div className="flex flex-col w-full gap-4 p-2">
      <div>
        <p className="text-[24px] pb-1">Themes</p>
        <select
          title="Themes"
          value={theme}
          onChange={handleThemeChange}
          className="select-icon appearance-none text-[20px] rounded px-3 py-2 w-full bg-secondary outline-none cursor-pointer  "
        >
          <option className="w-full hover:bg-primary" value="">
            VS Code Dark
          </option>
          {Object.keys(capitalizedThemes).map((theme, index) => (
            <option
              className="w-full hover:bg-primary"
              key={index}
              value={capitalizedThemes[theme]}
            >
              {theme}
            </option>
          ))}
        </select>
      </div>
      <div>
        <p className="text-[24px] pb-1">Languages</p>
        <select
          title="Languages"
          onChange={handleLanguageChange}
          value={language}
          className="select-icon appearance-none text-[20px] rounded px-3 py-2 w-full  bg-secondary outline-none cursor-pointer"
        >
          <option className="w-full" value="">
            Javascript
          </option>
          {Object.keys(capitalizedLanguagesMap).map((theme, index) => (
            <option
              className="w-full "
              key={index}
              value={capitalizedLanguagesMap[theme]}
            >
              {theme}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default Settings;
