import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import ApiCheck from "./pages/ApiCheck";

export default function App() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <header style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link to="/">Home</Link>
        <Link to="/api-check">API Check</Link>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/api-check" element={<ApiCheck />} />
      </Routes>
    </div>
  );
}