import React, { createContext, useMemo, useContext } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

const useSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return socket;
};

const SocketProvider = ({ children }) => {
  const port = import.meta.env.REACT_APP_SOCKET_PORT || 3000;
  const socket = useMemo(() => io(`localhost:${port}`), [port]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export { SocketProvider, useSocket };
