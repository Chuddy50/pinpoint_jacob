import { BrowserRouter } from "react-router-dom";
import Home from "./pages/Home";

export default function App() {
  return (
    <BrowserRouter>
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <Home />
      </main>
    </BrowserRouter>
  );
}
