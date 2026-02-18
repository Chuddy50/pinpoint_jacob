import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext'
import { ChatProvider } from "./contexts/ChatContext";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Filter from "./pages/Filter";
import Prototype from "./pages/Prototype";
import TechPack from "./pages/TechPack"
import Messages from "./pages/Messages";
import Ratings from "./pages/Ratings";
import ManufacturerProfile from "./pages/ManufacturerProfile";
import RequestQuote from "./pages/RequestQuote";
import ChatWidget from "./components/ChatWidget";


const queryClient = new QueryClient();
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
            <main className="min-h-screen bg-slate-50 text-slate-900">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/filter" element={<Filter />} />
                <Route path="/prototype" element={<Prototype />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/techpack" element={<TechPack />} />
                <Route path="/ratings/:id" element={<Ratings />} />
                <Route path="/request-quote" element={<RequestQuote />} />
                <Route path="/manufacturers/:id" element={<ManufacturerProfile />} />
              </Routes>
            </main>
            <ChatWidget />
        </BrowserRouter>
      </ChatProvider>
    </AuthProvider>
    </QueryClientProvider>
  );
}
