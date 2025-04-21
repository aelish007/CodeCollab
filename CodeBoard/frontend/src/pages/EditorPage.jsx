
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-hot-toast";
import { SettingsContext } from "../../context/SettingsContext";
import Navbar from "../Components/Navbar";
import CodeMirror from "@uiw/react-codemirror";
import * as themes from "@uiw/codemirror-themes-all";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import { EditorView } from "@codemirror/view";
import { color } from "@uiw/codemirror-extensions-color";
import { hyperLink } from "@uiw/codemirror-extensions-hyper-link";
import { initSocket } from "../socket";
import ACTIONS from "../Actions";
import Canvas from "../Components/Canvas";
import NameModal from "../Components/NameModal";
import WaitingRoom from "../Components/WaitingRoom";
import RemovalModal from "../Components/RemovalModal";

function EditorPage() {
  const socketRef = useRef(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [newCanvasChanges, setNewCanvasChanges] = useState([]);
  const [canvasData, setCanvasData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(""); // New state for password
  const [isWaiting, setIsWaiting] = useState(false); // State to track if user is waiting for approval
  const [showRemovalModal, setShowRemovalModal] = useState(false); // State to control removal modal
  const [removalMessage, setRemovalMessage] = useState(""); // Message to display in removal modal
  const settingsContext = useContext(SettingsContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [editorContent, setEditorContent] = useState("");
  const [clients, setClients] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentTab, setCurrentTab] = useState("code");

  const handleEditorChange = (value) => {
    socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code: value });
    setEditorContent(value);
  };

  useEffect(() => {
    if (
      !sessionStorage.getItem("currentUsername") &&
      (!location.state || !location.state.username)
    ) {
      setShowModal(true);
      return;
    }

    function handleErrors(e) {
      console.log("Socket Error", e);
      setShowLoader(true);
      toast.error("Connection to the server failed. Attempting to reconnect...");
    }

    async function init() {
      const currentUsername = !location.state
        ? sessionStorage.getItem("currentUsername")
        : location.state.username;

      settingsContext.updateSettings("userName", currentUsername);
      settingsContext.updateSettings("roomId", roomId);
      settingsContext.updateSettings("language", "javascript");
      socketRef.current = await initSocket(roomId);
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      socketRef.current.on("connect", () => {
        console.log("Connected to server");
        setShowLoader(false);
      });

      // Emit join event with username and password
      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: currentUsername,
        password: location.state?.password || password // Include password from state or local state
      });
      
      // Listen for join request event (when user is not approved)
      socketRef.current.on(ACTIONS.JOIN_REQUEST, ({ roomId }) => {
        console.log('Join request required');
        // Send join request with username
        socketRef.current.emit(ACTIONS.JOIN_REQUEST, {
          roomId,
          username: currentUsername
        });
        setIsWaiting(true); // Set waiting state to true
        toast.info('Your request to join has been sent to the room admin');
      });
      
      // Listen for join request accepted
      socketRef.current.on(ACTIONS.JOIN_REQUEST_ACCEPTED, ({ roomId }) => {
        setIsWaiting(false); // Set waiting state to false
        toast.success('Your request to join has been accepted!');
        // Re-emit join to actually join the room with password
        socketRef.current.emit(ACTIONS.JOIN, {
          roomId,
          username: currentUsername,
          password: location.state?.password || password // Include password
        });
      });
      
      // Listen for join request rejected
      socketRef.current.on(ACTIONS.JOIN_REQUEST_REJECTED, ({ roomId }) => {
        setIsWaiting(false); // Set waiting state to false
        toast.error('Your request to join has been rejected');
        // Show removal modal instead of immediate navigation
        setRemovalMessage('Your request to join this room was rejected by the admin.');
        setShowRemovalModal(true);
        // Disconnect socket
        socketRef.current.disconnect();
      });
      
      // Listen for participant removed
      socketRef.current.on(ACTIONS.PARTICIPANT_REMOVED, ({ roomId }) => {
        toast.error('You have been removed from the room by the admin');
        // Show removal modal instead of immediate navigation
        setRemovalMessage('You have been removed from the room by the admin.');
        setShowRemovalModal(true);
        // Disconnect socket
        socketRef.current.disconnect();
      });

      // Listening for joined event
      socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
        if (username !== currentUsername) {
          toast(`${username} joined the room.`, {
            icon: "📢",
          });
        }
        setClients(clients);
        socketRef.current.emit(ACTIONS.SYNC_CHANGES, {
          roomId,
          socketId,
        });
      });

      // Listening for password error
      socketRef.current.on(ACTIONS.PASSWORD_ERROR, () => {
        toast.error("Incorrect password. Please try again.");
        setShowModal(true);
      });

      // Listening for code change
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null) {
          setEditorContent(code);
        }
      });

      // Listening for synced changes
      socketRef.current.on(ACTIONS.SYNC_CHANGES, ({ roomData }) => {
        if (roomData) {
          if (roomData.code !== null) {
            setEditorContent(roomData.code);
          }
          if (roomData.canvasData.length > 0) {
            setCanvasData(roomData.canvasData);
          }
          if (roomData.messages.length > 0) {
            setMessages(roomData.messages);
          }
          if (roomData.selectedLanguage.length > 0) {
            settingsContext.updateSettings("language", roomData.selectedLanguage);
          }
        }
      });

      // Listening for message
      socketRef.current.on(
        ACTIONS.MESSAGE,
        ({ message, id, username, timestamp }) => {
          if (username !== currentUsername) {
            toast(`${username} sent a message`, {
              icon: "💬",
            });
          }

          setMessages((prev) => [
            ...prev,
            { message, username, id, timestamp },
          ]);
        }
      );

      // Listening for language change
      socketRef.current.on(ACTIONS.LANGUAGE_CHANGE, ({ username, language }) => {
        settingsContext.updateSettings("language", language);
      });

      // Listening for canvas change
      socketRef.current.on(
        ACTIONS.CANVAS_CHANGE,
        ({ type, username, newChanges }) => {
          if (username !== currentUsername) {
            setNewCanvasChanges(newChanges);
          }
          setCanvasData((prev) => [...prev, ...newChanges]);
        }
      );

      // Listening for disconnected
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast(`${username} left the room.`, {
          icon: "📢",
        });
        setClients((prev) =>
          prev.filter((client) => client.socketId !== socketId)
        );
      });
    }
    init();

    return () => {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
      socketRef.current.off(ACTIONS.PASSWORD_ERROR);
      socketRef.current.off(ACTIONS.JOIN_REQUEST);
      socketRef.current.off(ACTIONS.JOIN_REQUEST_ACCEPTED);
      socketRef.current.off(ACTIONS.JOIN_REQUEST_REJECTED);
      socketRef.current.off(ACTIONS.PARTICIPANT_REMOVED);
    };
  }, [username, password, location.state, roomId]); // Add password to dependencies

  function showCanvasfunc(val) {
    setShowCanvas(val);
  }

  function handleModalJoinClick(username, password) {
    if (username.length < 5 || username.length > 20) {
      return;
    }

    sessionStorage.setItem("currentUsername", username);
    setUsername(username);
    setPassword(password); // Set password from modal
    setShowModal(false);
  }
  
  function handleCloseRemovalModal() {
    setShowRemovalModal(false);
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value); // Update password state
  }

  function handleTabClick(icon) {
    setCurrentTab(icon);
  }

  const blocker = useCallback(() => {
    const message = "Are you sure you want to leave this page?";
    return !window.confirm(message);
  }, []);

  useBlocker(blocker);

  return (
    <div>
      {showLoader && <CodeCollabLoader />}
      {showModal && (
        <NameModal 
          handleJoinClick={handleModalJoinClick} 
          onPasswordChange={handlePasswordChange} // New prop for password input
        />
      )}
      {showRemovalModal && (
        <RemovalModal
          isOpen={showRemovalModal}
          message={removalMessage}
          onClose={handleCloseRemovalModal}
        />
      )}
      {isWaiting ? (
        // Show waiting room when user is waiting for approval
        <WaitingRoom 
          username={!location.state ? username : location.state.username} 
          roomId={roomId} 
        />
      ) : (
        <div className="flex">
          {!showModal && (
            <Navbar
              clients={clients}
              socketRef={socketRef}
              messages={messages}
              handleTabClick={handleTabClick}
              setShowCanvas={showCanvasfunc}
              code={editorContent}
              roomId={roomId}
            />
          )}
          {showCanvas ? (
            <Canvas
              username={!location.state ? username : location.state.username}
              socketRef={socketRef}
              roomId={roomId}
              newCanvasChanges={newCanvasChanges}
              canvasData={canvasData}
              currentTab={currentTab}
            />
          ) : (
            <CodeMirror
              className="overflow-auto"
              value={editorContent}
              onChange={handleEditorChange}
              extensions={[
                loadLanguage(settingsContext.settings.language),
                color,
                hyperLink,
                EditorView.lineWrapping,
              ]}
              theme={themes[settingsContext.settings.theme]}
              width="100vw"
              height="100vh"
              style={{ fontSize: "20px" }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default EditorPage;
function CodeCollabLoader() {
  return (
    <div className="absolute z-50 w-screen h-screen overflow-y-hidden opacity-95 bg-white-300 backdrop-blur-sm bg-opacity-10">
      <div className="fixed z-50 flex flex-col items-center w-full top-[40%] gap-2 font-Montserrat">
        <div
          className="h-12 w-12 animate-spin rounded-full border-[6px] border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
          role="status"
        ></div>
        <span className="text-[14px] font-mono w-max text-center">
          Connecting to server.
          <br />
          Please wait...
        </span>
      </div>
    </div>
  );
}
