import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

function HomePage() {
  const navigate = useNavigate();
  const [createRoom, setCreateRoom] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false); // For toggling password visibility
  const [isPrivate, setIsPrivate] = useState(true); // For public/private room
  const [roomExists, setRoomExists] = useState(null); // For real-time room existence check

  const removeSpaces = (roomName) => {
    return roomName.replace(/\s/g, "");
  };

  const handleEnterClick = (e) => {
    if (e.code === "Enter") {
      handleFormSubmit();
    }
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasNumber = /\d/;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;

    if (password.length < minLength) {
      return "Password must be at least 8 characters long.";
    }
    if (!hasNumber.test(password)) {
      return "Password must include at least one number.";
    }
    if (!hasSpecialChar.test(password)) {
      return "Password must include at least one special character.";
    }
    return null;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!roomId) {
      toast.error("Please Enter Room Id.");
      return;
    }
    if (!username) {
      toast.error("Please Enter Username.");
      return;
    }

    if (isPrivate && !password) {
      toast.error("Please Enter Password for Private Room.");
      return;
    }

    const passwordError = validatePassword(password);
    if (isPrivate && passwordError) {
      toast.error(passwordError);
      return;
    }

    if (removeSpaces(roomId).length < 5) {
      toast.error("Room Id cannot be less than 5 characters excluding spaces.");
      return;
    }
    if (removeSpaces(username).length < 5) {
      toast.error(
        "Username cannot be less than 5 characters excluding spaces."
      );
      return;
    }

    if (createRoom) {
      // Store roomId and password in local storage (simulation for now)
      localStorage.setItem(removeSpaces(roomId), isPrivate ? password : null);
      toast.success("Room created successfully!");
    } else {
      // Check if the room exists and verify the password
      const storedPassword = localStorage.getItem(removeSpaces(roomId));
      if (!storedPassword && isPrivate) {
        toast.error("Room does not exist.");
        return;
      }
      if (isPrivate && storedPassword !== password) {
        toast.error("Incorrect password for this room.");
        return;
      }
      toast.success("Room joined successfully!");
    }

    // Proceed to the room editor
    navigate(`/editor/${removeSpaces(roomId)}`, {
      state: {
        username: username.trim(),
        password: password.trim(),
      },
    });
  };

  // Real-time room existence validation
  useEffect(() => {
    if (roomId.length >= 5) {
      const existingRoom = localStorage.getItem(removeSpaces(roomId));
      setRoomExists(!!existingRoom);
    } else {
      setRoomExists(null);
    }
  }, [roomId]);

  return (
    <div className="min-h-screen px-4 text-white pt-14 md:flex md:justify-around md:items-center md:gap-8">
      <div className="pb-5 md:w-1/2 md:pb-0">
        <img src="../../images/homePageImage.svg" alt="Home Page" />
      </div>
      <div>
        <p className="text-3xl md:text-[45px] lg:text-[50px] text-center font-Workbench pb-2">
          CODECOLLAB
        </p>
        <p className="text-[15px] md:text-xl lg:text-[20px] text-center">
          The collaborative coding & brainstorming platform.
        </p>

        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 pt-5">
          <input
            className="bg-secondary border-[#89919d] border-[1px] rounded py-2 text-xl font-bold px-2 outline-none placeholder:font-normal"
            value={roomId}
            type="text"
            placeholder="Room Id"
            onChange={(e) => setRoomId(e.target.value)}
            onKeyUp={handleEnterClick}
          />
          {/* Room existence indicator */}
          {roomExists !== null && (
            <p
              className={`text-sm ${
                roomExists ? "text-green-500" : "text-red-500"
              }`}
            >
              {roomExists ? "Room exists" : "Room does not exist"}
            </p>
          )}

          <input
            className="bg-secondary border-[#89919d] border-[1px] rounded py-2 text-xl font-bold px-2 outline-none placeholder:font-normal"
            value={username}
            type="text"
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
            onKeyUp={handleEnterClick}
          />

          {/* Password field with toggle */}
          {isPrivate && (
            <div className="relative flex items-center">
              <input
                className="bg-secondary border-[#89919d] border-[1px] rounded py-2 text-xl font-bold px-2 outline-none placeholder:font-normal w-full"
                value={password}
                type={passwordVisible ? "text" : "password"}
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={handleEnterClick}
              />
              <button
                type="button"
                className="ml-3 py-2 px-4 bg-primary text-white rounded text-xl"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? "Hide" : "Show"}
              </button>
            </div>
          )}

          <button className="py-2 text-xl rounded bg-primary" type="submit">
            {createRoom ? "Create" : "Join"}
          </button>
        </form>

        {/* Public/Private room toggle */}
        <div className="flex justify-center gap-4 mt-3">
          <label className="flex items-center">
            <input
              type="radio"
              checked={isPrivate}
              onChange={() => setIsPrivate(true)}
            />
            <span className="ml-2">Private Room</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={!isPrivate}
              onChange={() => setIsPrivate(false)}
            />
            <span className="ml-2">Public Room</span>
          </label>
        </div>

        <div>
          {!createRoom ? (
            <p
              onClick={() => {
                setRoomId(uuidv4());
                setCreateRoom(true);
                toast("New Room Created", {
                  icon: "🚀",
                });
              }}
              className="text-[16px] text-center underline cursor-pointer py-4"
            >
              Create Room
            </p>
          ) : (
            <p
              onClick={() => {
                setRoomId("");
                setCreateRoom(false);
              }}
              className="text-[16px] text-center pt-4 underline cursor-pointer"
            >
              Join Room
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
