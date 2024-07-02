import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const LobbyScreen = () => {
  const [userID, setUserID] = useState("");
  const [room, setRoom] = useState("");
  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      localStorage.setItem("userId", userID);
      socket.emit("room:join", { userID, room });
      navigate(`/room/${room}`);
    },
    [userID, room, socket, navigate]
  );

  return (
    <div>
      <h1>Lobby</h1>
      <form onSubmit={handleSubmitForm}>
        <label
          htmlFor="userID"
          style={{ fontSize: "1.5em", marginRight: "3.5rem" }}
        >
          Username{" "}
        </label>
        <input
          type="text"
          id="userID"
          value={userID}
          onChange={(e) => setUserID(e.target.value)}
          style={{ fontSize: "1.5em", marginBottom: ".5rem" }}
          required
        />
        <br />
        <label htmlFor="room" style={{ fontSize: "1.5em" }}>
          Room Number{" "}
        </label>
        <input
          type="text"
          id="room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          style={{ fontSize: "1.5em" }}
          required
        />
        <br />
        <button>Join</button>
      </form>
    </div>
  );
};

export default LobbyScreen;
