// MaterialSelector.jsx
import React from 'react';

const MaterialSelector = ({ materials, currentMaterial, onMaterialChange }) => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Available Materials</h3>
      <div className="space-y-2">
        {materials.map((material) => (
          <button
            key={material}
            onClick={() => onMaterialChange(material)}
            className={`w-full px-4 py-3 text-left rounded-lg transition-all text-sm font-medium capitalize ${
              currentMaterial === material
                ? 'bg-slate-900 text-white' 
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {material}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MaterialSelector;