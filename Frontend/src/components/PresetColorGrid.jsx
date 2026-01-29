// PresetColorGrid.jsx
import React from 'react';

const PresetColorGrid = ({ colors, onColorSelect, colorPickerRef }) => {
  
  // handle clicking a preset color, updates model and color picker
  const handleColorClick = (hexColor) => {
    onColorSelect(hexColor);
    // update the color picker to show this color
    colorPickerRef.current?.setColorFromHex(hexColor);
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Colors</h3>
      <div className="grid grid-cols-4 gap-2.5">
        {colors.map((color) => (
          <button
            key={color.hex}
            onClick={() => handleColorClick(color.hex)}
            className="aspect-square rounded-lg hover:scale-105 transition-transform shadow-sm border border-slate-200"
            style={{ backgroundColor: color.hex }}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
};

export default PresetColorGrid;