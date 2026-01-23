// MaterialTab.jsx
import React from 'react';
import MaterialSelector from './MaterialSelector';

const MaterialTab = ({ materials, currentMaterial, onMaterialChange }) => {
  return (
    <div className="p-6 space-y-8">
      {/* header section */}
      <div className="pb-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Material Selection</h2>
        <p className="text-sm text-slate-500 mt-1">Choose the fabric type for your design</p>
      </div>

      {/* material selector */}
      <MaterialSelector 
        materials={materials}
        currentMaterial={currentMaterial}
        onMaterialChange={onMaterialChange}
      />
    </div>
  );
};

export default MaterialTab;