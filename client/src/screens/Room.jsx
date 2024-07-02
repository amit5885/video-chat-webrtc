import React, { useEffect, useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhoneAlt,
  FaPhoneSlash,
} from "react-icons/fa";
import { IoMdSend } from "react-icons/io";

import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {
  const { roomID } = useParams();
  const socket = useSocket();
  const navigate = useNavigate();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [myUserId, setMyUserId] = useState("");
  const [micEnabled, setMicEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [callEnded, setCallEnded] = useState(false); // State to track call ended

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/");
      return;
    }
    setMyUserId(userId);
    socket.emit("user:joined", { userId, roomID });
  }, [socket, navigate, roomID]);

  const handleUserJoined = useCallback(
    ({ userId, id }) => {
      console.log(`User ${userId} joined room`);
      setRemoteSocketId(id);
      socket.emit("user:joined:response", { userId: myUserId, to: id });
    },
    [myUserId, socket]
  );

  const handleCallUser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: micEnabled,
        video: true,
      });
      const offer = await peer.getOffer();
      socket.emit("user:call", { to: remoteSocketId, offer });
      setMyStream(stream);
      setShowChat(true); // Show chat when call starts
    } catch (error) {
      console.error("Error accessing media devices.", error);
    }
  }, [micEnabled, remoteSocketId, socket]);

  const handleEndCall = useCallback(() => {
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
      setMyStream(null);
    }
    setRemoteStream(null);
    socket.emit("call:end", { to: remoteSocketId });
    socket.emit("chat:end", { to: remoteSocketId });
    setRemoteSocketId(null);
    setShowChat(false); // Hide chat when call ends
    setCallEnded(true); // Set call ended state
  }, [myStream, remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      try {
        setRemoteSocketId(from);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: micEnabled,
          video: true,
        });
        setMyStream(stream);
        setShowChat(true);
        const ans = await peer.getAnswer(offer);
        socket.emit("call:accepted", { to: from, ans });
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    },
    [micEnabled, socket]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  const sendStreams = useCallback(() => {
    if (myStream) {
      for (const track of myStream.getTracks()) {
        console.log(`Sending track: ${track.kind}`);
        peer.peer.addTrack(track, myStream);
      }
    }
  }, [myStream]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  const handleCallAccepted = useCallback(
    ({ ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleRemoteEndCall = useCallback(() => {
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
      setMyStream(null);
    }
    setRemoteStream(null);
    setRemoteSocketId(null);
    setShowChat(false); // Hide chat when call ends
    setCallEnded(true); // Set call ended state
  }, [myStream]);

  const handleSendMessage = useCallback(() => {
    socket.emit("message:send", {
      to: remoteSocketId,
      message: newMessage,
      userId: myUserId,
    });
    setMessages((prev) => [...prev, { userId: myUserId, message: newMessage }]);
    setNewMessage("");
  }, [socket, remoteSocketId, newMessage, myUserId]);

  const handleReceiveMessage = useCallback(({ message, userId }) => {
    setMessages((prev) => [...prev, { userId, message }]);
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    socket.on("call:end", handleRemoteEndCall);
    socket.on("message:receive", handleReceiveMessage);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
      socket.off("call:end", handleRemoteEndCall);
      socket.off("message:receive", handleReceiveMessage);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
    handleRemoteEndCall,
    handleReceiveMessage,
  ]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });

    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
      peer.peer.removeEventListener("track", () => {});
    };
  }, [handleNegoNeeded]);

  const toggleMic = () => {
    setMicEnabled((prev) => !prev); // Toggle micEnabled state
    if (myStream) {
      // If there's an active stream, toggle audio tracks
      myStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled; // Toggle track enabled state
      });
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Room</h1>
      <h4>
        {callEnded ? "Call Ended" : remoteSocketId ? "Connected" : "Wait"}
      </h4>
      <div
        style={{ display: "flex", justifyContent: "center", flexWrap: "wrap" }}
      >
        <div style={{ margin: "10px" }}>
          {myStream && (
            <>
              <h2>My Stream</h2>
              <ReactPlayer
                playing
                height="250px"
                width="350px"
                url={myStream}
              />
              <button onClick={toggleMic}>
                {micEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
              </button>
            </>
          )}
        </div>
        <div style={{ margin: "10px" }}>
          {remoteStream && (
            <>
              <h2>Remote Stream</h2>
              <ReactPlayer
                playing
                height="250px"
                width="350px"
                url={remoteStream}
              />
            </>
          )}
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        {!myStream && remoteSocketId && (
          <button
            onClick={() => {
              handleCallUser();
            }}
            title="Call"
          >
            <FaPhoneAlt />
          </button>
        )}

        {myStream && (
          <button onClick={sendStreams} title="Receive">
            <FaPhoneAlt />
          </button>
        )}
        {myStream && (
          <button onClick={handleEndCall} title="End Call">
            <FaPhoneSlash />
          </button>
        )}
      </div>
      {showChat &&
        myStream && ( // Conditionally render chat section
          <div style={{ marginTop: "20px" }}>
            <h2>Chat</h2>
            <div
              style={{
                height: "200px",
                overflowY: "scroll",
                border: "1px solid #ccc",
                padding: "10px",
              }}
            >
              {messages.map((msg, idx) => (
                <div key={idx} style={{ marginBottom: "10px" }}>
                  <strong>
                    {msg.userId === myUserId ? "You" : msg.userId}:
                  </strong>{" "}
                  {msg.message}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", marginTop: "10px" }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                style={{
                  flex: 1,
                  marginRight: "10px",
                  padding: "10px",
                  border: "1px solid #ccc",
                }}
              />
              <button
                onClick={handleSendMessage}
                style={{
                  padding: "10px 20px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <IoMdSend style={{ fontSize: "1.5em" }} />
              </button>
            </div>
          </div>
        )}
      {callEnded && <h4>Call Ended</h4>}{" "}
    </div>
  );
};

export default RoomPage;
