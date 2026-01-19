//Prototype.jsx
import { useState } from "react";
import NavBar from "../components/NavBar";
import ModelSelector from "../components/ModelSelector";
import ModelEditor from "../components/ModelEditor";


export default function Prototype() {
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState('cotton')

  const handleSelect = (url, material) => {
    setSelectedUrl(url);
    setSelectedMaterial(material);
  }

  return (
    <div className="flex bg-background w-screen h-screen bg-white p-6 gap-6">
      <aside className="w-72">
        <NavBar />
      </aside>
      
      <main className="flex-1">
        {!selectedUrl ? (
          <ModelSelector onSelect={handleSelect} />
        ) : (
          <ModelEditor 
            modelUrl={selectedUrl} 
            initialMaterial={selectedMaterial}
            onBack={() => setSelectedUrl(null)} 
          />
        )}
      </main>
    </div>
  );
}
