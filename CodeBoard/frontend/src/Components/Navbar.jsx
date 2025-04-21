// src/Components/Navbar.jsx
import { MdOutlineChat } from "react-icons/md";
import { LiaUserFriendsSolid } from "react-icons/lia";
import { IoSettingsOutline } from "react-icons/io5";
import { LuPencilLine } from "react-icons/lu";
import { FaCode } from "react-icons/fa";
import { VscSymbolMethod } from "react-icons/vsc"; // Add this import for code analysis icon
import { MdOutlineRateReview } from "react-icons/md"; // Add this import for AI review icon
import { MdAdminPanelSettings } from "react-icons/md"; // Add this import for admin panel icon
import { useEffect, useRef, useState } from "react";
import ViewMembers from "./ViewMembers";
import Chat from "./Chat";
import Settings from "./Settings";
import CodeAnalysis from "./CodeAnalysis"; // Import the code analysis component
import AIReview from "./AIReview"; // Import the AI review component
import AdminPanel from "./AdminPanel"; // Import the admin panel component

function Navbar({
    socketRef,
    messages,
    clients,
    handleTabClick,
    setShowCanvas,
    code, // Add this prop to receive the current code
    roomId, // Add roomId prop
}) {
    const [showSidebar, setShowSidebar] = useState(false);
    const [lastClickedIcon, setLastClickedIcon] = useState("code");

    function handleCodeOrCanvasClick(icon) {
        if (icon === "canvas") {
            setShowCanvas(true);
        } else {
            setShowCanvas(false);
        }
        setLastClickedIcon(icon);
        handleTabClick(icon);
        setShowSidebar(false);
    }

    function handleViewMembersClick(icon) {
        if (showSidebar && lastClickedIcon === icon) {
            setShowSidebar(false);
            setLastClickedIcon(null);
        } else {
            setShowSidebar(true);
            setLastClickedIcon(icon);
        }
        handleTabClick(icon);
    }

    function handleChatClick(icon) {
        if (showSidebar && lastClickedIcon === icon) {
            setShowSidebar(false);
            setLastClickedIcon(null);
        } else {
            setShowSidebar(true);
            setLastClickedIcon(icon);
        }
        handleTabClick(icon);
    }

    function handleSettingsClick(icon) {
        if (showSidebar && lastClickedIcon === icon) {
            setShowSidebar(false);
            setLastClickedIcon(null);
        } else {
            setShowSidebar(true);
            setLastClickedIcon(icon);
        }
        handleTabClick(icon);
    }

    // Add new handler for code analysis
    function handleCodeAnalysisClick(icon) {
        if (showSidebar && lastClickedIcon === icon) {
            setShowSidebar(false);
            setLastClickedIcon(null);
        } else {
            setShowSidebar(true);
            setLastClickedIcon(icon);
        }
        handleTabClick(icon);
    }
    
    // Add new handler for AI review
    function handleAIReviewClick(icon) {
        if (showSidebar && lastClickedIcon === icon) {
            setShowSidebar(false);
            setLastClickedIcon(null);
        } else {
            setShowSidebar(true);
            setLastClickedIcon(icon);
        }
        handleTabClick(icon);
    }
    
    // Add new handler for admin panel
    function handleAdminPanelClick(icon) {
        if (showSidebar && lastClickedIcon === icon) {
            setShowSidebar(false);
            setLastClickedIcon(null);
        } else {
            setShowSidebar(true);
            setLastClickedIcon(icon);
        }
        handleTabClick(icon);
    }

    return (
        <div className="flex">
            <div className=" fixed bottom-0 left-0 z-50 flex items-center h-[50px] w-full gap-10 px-5 border-t border-[#89919d] bg-background  md:static md:h-screen md:w-[50px] md:min-w-[50px] md:flex-col md:border-r md:border-t-0 md:p-2 md:pt-4 cursor-pointer text-[#89919d]">
                <FaCode
                    className={`${lastClickedIcon === "code" && "text-white scale-[2.2]"
                        } scale-[2] `}
                    onClick={() => handleCodeOrCanvasClick("code")}
                />
                <LuPencilLine
                    className={`${lastClickedIcon === "canvas" && "text-white scale-[2.2]"
                        } scale-[2] `}
                    onClick={() => handleCodeOrCanvasClick("canvas")}
                />

                <LiaUserFriendsSolid
                    className={`${lastClickedIcon === "viewmembers" && "text-white scale-[2.2]"
                        } scale-[2] `}
                    onClick={() => handleViewMembersClick("viewmembers")}
                />
                <div className="relative" onClick={() => handleChatClick("chat")}>
                    <MdOutlineChat
                        className={`${lastClickedIcon === "chat" && " text-white scale-[2.2]"
                            } scale-[1.6] `}
                    />
                </div>
                <IoSettingsOutline
                    className={`${lastClickedIcon === "settings" && "text-white  scale-[2.2]"
                        } scale-[1.6] `}
                    onClick={() => handleSettingsClick("settings")}
                />
                {/* Add the new code analysis icon */}
                <VscSymbolMethod
                    className={`${lastClickedIcon === "codeanalysis" && "text-white scale-[2.2]"
                        } scale-[1.8] `}
                    onClick={() => handleCodeAnalysisClick("codeanalysis")}
                />
                {/* Add the new AI review icon */}
                <MdOutlineRateReview
                    className={`${lastClickedIcon === "aireview" && "text-white scale-[2.2]"
                        } scale-[1.8] `}
                    onClick={() => handleAIReviewClick("aireview")}
                />
                {/* Add the new admin panel icon */}
                <MdAdminPanelSettings
                    className={`${lastClickedIcon === "adminpanel" && "text-white scale-[2.2]"
                        } scale-[1.8] `}
                    onClick={() => handleAdminPanelClick("adminpanel")}
                />
            </div>

            <div
                className={`absolute left-0 top-0 z-20 h-screen w-screen flex-col bg-dark md:static md:w-[350px] bg-background ${showSidebar ? "block" : "hidden"
                    }`}
            >
                {lastClickedIcon === "settings" && <Settings socketRef={socketRef} />}
                {lastClickedIcon === "viewmembers" && <ViewMembers clients={clients} />}
                {lastClickedIcon === "chat" && (
                    <Chat socketRef={socketRef} messagesArray={messages} />
                )}
                {/* Add the new CodeAnalysis component */}
                {lastClickedIcon === "codeanalysis" && (
                    <CodeAnalysis socketRef={socketRef} code={code} />
                )}
                {/* Add the new AIReview component */}
                {lastClickedIcon === "aireview" && (
                    <AIReview socketRef={socketRef} code={code} />
                )}
                {/* Add the new AdminPanel component */}
                {lastClickedIcon === "adminpanel" && (
                    <AdminPanel socketRef={socketRef} roomId={roomId} />
                )}
            </div>
        </div>
    );
}

export default Navbar;
