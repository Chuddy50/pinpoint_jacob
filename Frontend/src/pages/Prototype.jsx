import NavBar from "../components/NavBar";

export default function Prototype() {
  return (
    <div className="flex bg-background w-screen h-screen bg-white p-6 gap-6">
       <aside className="w-72">
          <NavBar />
        </aside>
    </div>
  );
}
