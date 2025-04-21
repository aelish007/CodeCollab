import React, { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import { IoMdSend, IoMdAttach } from "react-icons/io";
import { useParams } from "react-router-dom";
import Message from "./Message";
import { SettingsContext } from "../../context/SettingsContext";

function Chat({ socketRef, messagesArray }) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const settingsContext = useContext(SettingsContext);
  
  // Get roomId from the settings context or from URL params
  const { roomId } = useParams();
  
  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messagesArray]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post("http://localhost:3000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.data) throw new Error("Upload failed");

      const data = response.data;
      socketRef.current.emit("message", {
        roomId: roomId,
        message: `📎 ${file.name}`,
        fileUrl: data.path,
        isFile: true,
        username: settingsContext.settings.userName, // Use username from settings context
      });
    } catch (error) {
      console.error("File upload error:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    if (message.trim().length === 0) return;
    socketRef.current.emit("message", {
      roomId: roomId,
      message,
      isFile: false,
      username: settingsContext.settings.userName, // Use username from settings context
    });
    setMessage("");
  };

  return (
    <div className="flex flex-col w-full h-[92vh] md:h-screen p-2">
      <div className="pb-2 text-xl font-bold">Group Chat</div>
      <div className="flex flex-col flex-1 gap-5 overflow-auto">
        {messagesArray.map((message) => (
          <Message
            key={message.id}
            message={message.message}
            sender={message.username}
            timestamp={message.timestamp}
            fileUrl={message.fileUrl}
            isFile={message.isFile}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleMessageSubmit} className="flex mt-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        <input
          value={message}
          type="text"
          className="w-full bg-[#3d404a] border-[#89919d] border-[1px] rounded-l text-xl py-1 px-2 outline-none"
          placeholder="Enter Message"
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`px-4 py-2 text-2xl bg-[#3d404a] border-y border-[#89919d] ${uploading ? "opacity-50" : "hover:bg-[#4d505a]"}`}
        >
          <IoMdAttach />
        </button>
        <button
          type="submit"
          disabled={uploading}
          className={`px-4 py-2 text-2xl rounded-r bg-primary ${uploading ? "opacity-50" : "hover:bg-primary/90"}`}
        >
          <IoMdSend />
        </button>
      </form>
    </div>
  );
}

export default Chat;
