import Avatar from "react-avatar";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import { FaRegCopy } from "react-icons/fa";
import { IoExitOutline } from "react-icons/io5";
import { useContext } from "react";
import { SettingsContext } from "../../context/SettingsContext";

function ViewMembers({ clients }) {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const handleCopyLinkClick = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room Name copied to clipboard");
    } catch (error) {
      toast.error("Unable to copy URL to clipboard");
      console.log(error);
    }
  };
  const handleLeaveRoom = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="flex flex-col h-[90vh] md:h-[96vh] p-2 ">
      <div className="pb-2 text-xl font-bold">Members</div>
      <div className="flex flex-col justify-between h-full ">
        <div className="flex flex-wrap pb-4 overflow-auto ">
          {clients.length > 0 &&
            clients.map((client) => (
              <User key={client.id} username={client.username} />
            ))}
        </div>
        <div className="flex flex-col gap-2 pb-2 md:flex-row">
          <button
            onClick={handleCopyLinkClick}
            title="Copy Link"
            className="flex justify-center w-full py-3 text-3xl font-bold bg-white rounded cursor-pointer text-background"
          >
            <FaRegCopy />
          </button>
          <button
            onClick={handleLeaveRoom}
            title="Leave Room"
            className="flex justify-center w-full py-3 text-3xl font-bold rounded cursor-pointer bg-primary text-background"
          >
            <IoExitOutline />
          </button>
        </div>
      </div>
    </div>
  );
}

function User({ username }) {
  return (
    <div className="flex flex-col items-center gap-1  basis-[33.33%]  w-fit">
      <Avatar name={username} size={60} round="14px" />
      <span className="text-[15px] text-center">{username}</span>
    </div>
  );
}
export default ViewMembers;
