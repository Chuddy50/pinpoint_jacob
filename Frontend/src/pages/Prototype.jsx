import { useState } from "react";
import NavBar from "../components/NavBar";
import ModelSelector from "../components/ModelSelector";
import ModelEditor from "../components/ModelEditor";


export default function Prototype() {
  const [selectedModel, setSelectedModel] = useState(null);

  return (
    <div className="flex bg-background w-screen h-screen bg-white p-6 gap-6">
      <aside className="w-72">
        <NavBar />
      </aside>
      
      <main className="flex-1">
        {!selectedModel ? (
          <ModelSelector onSelect={setSelectedModel} />
        ) : (
          <ModelEditor 
            modelType={selectedModel} 
            onBack={() => setSelectedModel(null)} 
          />
        )}
      </main>
    </div>
  );
}
