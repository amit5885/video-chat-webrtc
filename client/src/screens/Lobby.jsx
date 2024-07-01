import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      localStorage.setItem("email", email);
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
  <div>
    <h1>Lobby</h1>
    <form onSubmit={handleSubmitForm}>
      <label htmlFor="email" style={{ fontSize: '1.2em' }}>Email ID </label>
      <input
        type="email"
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ fontSize: '1.2em' }}
      />
      <br />
      <label htmlFor="room" style={{ fontSize: '1.2em' }}>Room Number </label>
      <input
        type="text"
        id="room"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        style={{ fontSize: '1.2em' }}
      />
      <br />
      <button>Join</button>
    </form>
  </div>
  );
};

export default LobbyScreen;
