import { useContext } from "react";
import { SettingsContext } from "../../context/SettingsContext";

function Message({ message, sender, timestamp, fileUrl, isFile }) {
  const settingsContext = useContext(SettingsContext);
  const formattedSender =
    sender === settingsContext.settings.userName ? "You" : sender;
  
  // For debugging
  console.log("Message sender:", sender);
  console.log("Current user:", settingsContext.settings.userName);

  return (
    <div
      className={`bg-secondary text-[16px] text-left w-[75%] p-2 rounded-lg ${
        formattedSender === "You" ? "self-end" : "self-start"
      } mx-1.5`}
    >
      <div className="flex justify-between pb-2">
        <span className="text-primary">{formattedSender}</span>
        <span>{timestamp}</span>
      </div>
      {isFile ? (
        <div className="flex items-center gap-2">
          <span>{message}</span>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Download
          </a>
        </div>
      ) : (
        message
      )}
    </div>
  );
}

export default Message;