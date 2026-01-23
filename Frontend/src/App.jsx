import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext'

import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Filter from "./pages/Filter";
import Prototype from "./pages/Prototype";
import Consultant from "./pages/Consultant";
import Messages from "./pages/Messages";
import Ratings from "./pages/Ratings";
import ManufacturerProfile from "./pages/ManufacturerProfile";
import RequestQuote from "./pages/RequestQuote";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
          <main className="min-h-screen bg-slate-50 text-slate-900">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/filter" element={<Filter />} />
              <Route path="/prototype" element={<Prototype />} />
              <Route path="/consultant" element={<Consultant />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/ratings/:id" element={<Ratings />} />
              <Route path="/request-quote" element={<RequestQuote />} />
              <Route path="/manufacturers/:id" element={<ManufacturerProfile />} />
            </Routes>
          </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
