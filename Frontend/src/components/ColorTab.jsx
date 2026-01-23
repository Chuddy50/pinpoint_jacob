// ColorTab.jsx
import React from 'react';
import PresetColorGrid from './PresetColorGrid';
import ColorPicker from './ColorPicker';

const ColorTab = ({ presetColors, onColorChange, colorPickerRef }) => {
  return (
    <div className="p-6 space-y-8">
      {/* header section */}
      <div className="pb-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Color Customization</h2>
        <p className="text-sm text-slate-500 mt-1">Choose from presets or create custom colors</p>
      </div>

      {/* preset colors grid */}
      <PresetColorGrid 
        colors={presetColors} 
        onColorSelect={onColorChange}
        colorPickerRef={colorPickerRef}
      />

      {/* custom color picker */}
      <ColorPicker onChange={onColorChange} ref={colorPickerRef} />
    </div>
  );
};

export default ColorTab;