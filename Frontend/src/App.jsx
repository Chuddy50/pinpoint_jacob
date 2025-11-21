import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Consultant from "./pages/Consultant";

export default function App() {
  return (
    <BrowserRouter>
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/consultant" element={<Consultant />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
