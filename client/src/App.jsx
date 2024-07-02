import { Routes, Route } from "react-router-dom";
import "./App.css";
import LobbyScreen from "./screens/Lobby";
import RoomPage from "./screens/Room";
import Footer from "./components/Footer";

function App() {
  return (
    <>
      <div>
        <Routes>
          <Route path="/" element={<LobbyScreen />} />
          <Route path="/room/:roomID" element={<RoomPage />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
}

export default App;
