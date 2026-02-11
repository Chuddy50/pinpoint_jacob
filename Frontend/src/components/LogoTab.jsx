// LogoTab.jsx
import React, { useRef, useEffect} from 'react';

const LogoTab = ({ 
  onLogoUpload, 
  placingLogo, 
  onCancelPlacement,
  selectedLogo,
  logoScaleUI,
  setLogoScaleUI,
  onDeleteLogo,
  onResizeLogo 
}) => {

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onLogoUpload(file);
    }
  };

  useEffect(() => {
    if(!placingLogo && fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }, [placingLogo]);

  return (
    <div className="p-6 space-y-8">
      {/* header section */}
      <div className="pb-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Logo Placement</h2>
        <p className="text-sm text-slate-500 mt-1">Upload and position your logo on the design</p>
      </div>

      {/* upload section */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Upload Logo</h3>
        <div className="space-y-3">
          <label className="block">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2.5 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-slate-900 file:text-white
                hover:file:bg-slate-800
                cursor-pointer"
            />
          </label>
          <p className="text-xs text-slate-500">
            Supported formats: PNG, JPG, JPEG
          </p>
        </div>
      </div>

      {/* instructions */}
      {placingLogo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Logo Ready to Place</h4>
              <p className="text-sm text-blue-700">
                Click anywhere on the 3D model to place your logo at that location.
              </p>
            </div>
          </div>
          <button
            onClick={onCancelPlacement}
            className="w-full px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-300 transition-colors"
          >
            Cancel Placement
          </button>
        </div>
      )}

      {/* selection mode - edit selected logo */}
      {!placingLogo && selectedLogo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-900 mb-1">Logo Selected</h4>
              <p className="text-sm text-green-700">
                Adjust size or remove this logo from your design.
              </p>
            </div>
          </div>

          {/* resize slider */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-medium text-slate-700">
              <span>Size</span>
              <span className="text-xs text-slate-500">{logoScaleUI?.toFixed(2) ?? '1.00'}x</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={logoScaleUI ?? 1.0}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setLogoScaleUI(v);  // instant UI update
                onResizeLogo(v);    // update Three.js mesh
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>0.5x</span>
              <span>3.0x</span>
            </div>
          </div>

          {/* delete button */}
          <button
            onClick={onDeleteLogo}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Delete Logo
          </button>
        </div>
      )}

      {/* selection mode hint */}
      {!placingLogo && !selectedLogo && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-600">
            Click on a logo in the 3D model to select and edit it.
          </p>
        </div>
      )}

      {/* tips */}
      <div className="bg-slate-50 rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-medium text-slate-700">Tips</h4>
        <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside">
          <li>Use PNG files with transparent backgrounds for best results</li>
          <li>Higher resolution logos will appear sharper</li>
          <li>Rotate the model to place logos on different surfaces</li>
          <li>You can add multiple logos by uploading and placing them one at a time</li>
        </ul>
      </div>
    </div>
  );
};

export default LogoTab;