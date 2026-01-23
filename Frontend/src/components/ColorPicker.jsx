// ColorPicker.jsx
import React, { useState, useImperativeHandle, forwardRef } from 'react';

const ColorPicker = forwardRef(({ onChange }, ref) => {
  // Color picker state (HSV values work better for this type of picker)
  const [hue, setHue] = useState(180);
  const [saturation, setSaturation] = useState(50);
  const [value, setValue] = useState(50);

  // Helper function to convert HSV to RGB to Hex
  const hsvToHex = (h, s, v) => {
    s /= 100;
    v /= 100;
    
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    
    let r, g, b;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    const toHex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Helper to convert HSV to RGB for Three.js (returns hex string)
  const hsvToRgb = (h, s, v) => {
    return hsvToHex(h, s, v);
  };

  // Helper to convert hex to HSV
  const hexToHsv = (hex) => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    let s = max === 0 ? 0 : (diff / max) * 100;
    let v = max * 100;
    
    if (diff !== 0) {
      if (max === r) {
        h = 60 * (((g - b) / diff) % 6);
      } else if (max === g) {
        h = 60 * (((b - r) / diff) + 2);
      } else {
        h = 60 * (((r - g) / diff) + 4);
      }
    }
    
    if (h < 0) h += 360;
    
    return { h, s, v };
  };

  // Expose a way to update the picker from external hex color (for preset colors)
  useImperativeHandle(ref, () => ({
    setColorFromHex: (hex) => {
      const hsv = hexToHsv(hex);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setValue(hsv.v);
    }
  }));

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Custom Color</h3>
      
      <div className="space-y-4">
        {/* Main Color Square */}
        <div 
          className="relative w-full aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-crosshair"
          style={{
            background: `
              linear-gradient(to bottom, transparent, #000),
              linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))
            `
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            
            const updateColor = (clientX, clientY) => {
              const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
              const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
              const newSaturation = (x / rect.width) * 100;
              const newValue = 100 - (y / rect.height) * 100;
              setSaturation(newSaturation);
              setValue(newValue);
              onChange(hsvToRgb(hue, newSaturation, newValue));
            };
            
            // Update immediately on mouse down
            updateColor(e.clientX, e.clientY);
            
            const handleMouseMove = (moveEvent) => {
              updateColor(moveEvent.clientX, moveEvent.clientY);
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        >
          {/* Selection indicator */}
          <div 
            className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none"
            style={{
              left: `${saturation}%`,
              top: `${100 - value}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>

        {/* Rainbow Hue Bar */}
        <div 
          className="relative w-full h-8 rounded-lg overflow-hidden border border-slate-200 cursor-pointer"
          style={{
            background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            
            const updateHue = (clientX) => {
              const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
              const newHue = (x / rect.width) * 360;
              setHue(newHue);
              onChange(hsvToRgb(newHue, saturation, value));
            };
            
            // Update immediately on mouse down
            updateHue(e.clientX);
            
            const handleMouseMove = (moveEvent) => {
              updateHue(moveEvent.clientX);
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        >
          {/* Hue indicator */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
            style={{
              left: `${(hue / 360) * 100}%`,
              transform: 'translateX(-50%)'
            }}
          />
        </div>

        {/* Color preview and hex input */}
        <div className="flex gap-3 items-center">
          <div 
            className="w-12 h-12 rounded-lg border-2 border-slate-200"
            style={{ backgroundColor: hsvToHex(hue, saturation, value) }}
          />
          <div className="flex-1">
            <input
              type="text"
              value={hsvToHex(hue, saturation, value)}
              readOnly
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-center"
            />
            <p className="text-xs text-slate-500 mt-1 text-center">Current color</p>
          </div>
        </div>
      </div>
    </div>
  );
});

ColorPicker.displayName = 'ColorPicker';

export default ColorPicker;