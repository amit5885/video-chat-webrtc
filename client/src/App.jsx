import { Routes, Route } from "react-router-dom";
import "./App.css";
import LobbyScreen from "./screens/Lobby";
import RoomPage from "./screens/Room";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LobbyScreen />} />
        <Route path="/room/:roomID" element={<RoomPage />} />
      </Routes>
    </>
  );
}

export default App;
