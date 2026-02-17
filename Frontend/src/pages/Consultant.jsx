import NavBar from "../components/NavBar";
import { useEffect } from "react";
import ConsultantChat from "../components/ConsultantChat";

export default function Consultant() {
  useEffect(() => {
    document.title = "Consultant - PinPoint";
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col bg-white p-4 gap-4 md:flex-row md:p-6 md:gap-6">
      {/* Nav bar stuff  */}
      <aside className="w-full md:w-45">
        <NavBar />
      </aside>

      {/* Main chat stuff   */}
      <section className="flex-1 p-4 flex flex-col gap-4 md:p-6">
        <ConsultantChat showHeader />
      </section>
    </div>
  );
}
