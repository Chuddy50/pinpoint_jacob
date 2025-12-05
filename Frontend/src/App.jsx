import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Filter from "./pages/Filter";
import Prototype from "./pages/Prototype";
import Consultant from "./pages/Consultant";
import Messages from "./pages/Messages";
import Ratings from "./pages/Ratings";
import ManufacturerProfile from "./pages/ManufacturerProfile";

export default function App() {
  return (
    <BrowserRouter>
        <main className="min-h-screen bg-slate-50 text-slate-900">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/filter" element={<Filter />} />
            <Route path="/prototype" element={<Prototype />} />
            <Route path="/consultant" element={<Consultant />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/ratings" element={<Ratings />} />
            <Route path="/manufacturers/:id" element={<ManufacturerProfile />} />
          </Routes>
        </main>
    </BrowserRouter>
  );
}
