// ExportTab.jsx
import React from 'react';

const ExportTab = ({ designName, onDesignNameChange, currentMaterial }) => {
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
    </div>
  );
};

export default ExportTab;