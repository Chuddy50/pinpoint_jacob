import NavBar from "../components/NavBar";
import placeholder from "../assets/prototypePlaceholder.png";

export default function Prototype() {
  return (
    <div className="flex bg-background w-screen h-screen bg-white p-6 gap-6">
      <aside className="w-72">
        <NavBar />
      </aside>
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <img 
          src={placeholder} 
          alt="3D Modeling Prototype placeholder for demo" 
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  );
}
