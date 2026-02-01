// ExportTab.jsx
import React from 'react';

const ExportTab = ({ designName, onDesignNameChange, currentMaterial, onSaveToSupabase, onDownload }) => {
  return (
    <div className="p-6 space-y-8">
      {/* header section */}
      <div className="pb-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Save Design</h2>
        <p className="text-sm text-slate-500 mt-1">Export your customized model</p>
      </div>

      {/* design name input */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-3">
          Design Name
        </label>
        <input
          type="text"
          value={designName}
          onChange={(e) => onDesignNameChange(e.target.value)}
          placeholder="Enter a name for your design"
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-400 focus:outline-none transition-all text-sm"
        />
      </div>

      {/* current settings display */}
      <div className="bg-slate-50 rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-medium text-slate-700">Current Settings</h4>
        <div className="text-sm text-slate-600 space-y-1">
          <p>Material: <span className="font-medium capitalize">{currentMaterial}</span></p>
          <p>Name: <span className="font-medium">{designName || 'Not set'}</span></p>
        </div>
      </div>

      {/* export buttons */}
      <div className="space-y-3">
        <button 
          onClick={onSaveToSupabase}
          className="w-full px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-sm"
        >
          Save to Account
        </button>
        <button 
          onClick={onDownload}
          className="w-full px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-lg border-2 border-slate-900 transition-colors"
        >
          Download to Computer
        </button>
      </div>
    </div>
  );
};

export default ExportTab;