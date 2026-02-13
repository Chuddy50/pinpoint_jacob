import { useState } from "react";
import NavBar from "../components/NavBar";

export default function TechPack() {
  const [activeField, setActiveField] = useState(null);
  const [techPackData, setTechPackData] = useState({
    productName: "",
    brandName: "",
    styleNumber: "",
    season: "",
    garmentType: "",
    description: "",
    colors: [],
    sizeRange: [],
    moq: "",
    mainFabric: "",
    stitchingNotes: "",
    specialInstructions: "",
    sketchImages: [],
  });

  const updateField = (field, value) => {
    setTechPackData(prev => ({ ...prev, [field]: value }));
  };

  const handleFieldClick = (fieldName) => {
    setActiveField(fieldName);
  };

  const handleClickOutside = () => {
    setActiveField(null);
  };

  return (
    <div className="flex">
      <NavBar />
      
      {/* Main content area - offset for navbar */}
      <div className="ml-64 flex-1 min-h-screen bg-white p-8">
        
        {/* Tech Pack Document */}
        <div 
          className="max-w-5xl mx-auto bg-white border border-gray-300 shadow-lg p-12"
          onClick={(e) => {
            // Only close if clicking the background, not a field
            if (e.target === e.currentTarget) {
              handleClickOutside();
            }
          }}
        >
          
          {/* Header */}
          <h1 className="text-5xl font-bold text-center mb-8 uppercase tracking-wide">
            Tech Pack
          </h1>

          {/* Top Info Row */}
          <div className="grid grid-cols-2 gap-4 mb-8 border-b border-gray-300 pb-4">
            <EditableField
              label="Brand"
              value={techPackData.brandName}
              placeholder="Brand Name"
              isActive={activeField === 'brandName'}
              onClick={() => handleFieldClick('brandName')}
              onChange={(val) => updateField('brandName', val)}
            />
            <EditableField
              label="Style Name"
              value={techPackData.productName}
              placeholder="Product Name"
              isActive={activeField === 'productName'}
              onClick={() => handleFieldClick('productName')}
              onChange={(val) => updateField('productName', val)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 border-b border-gray-300 pb-4">
            <EditableField
              label="Season"
              value={techPackData.season}
              placeholder="Fall/Winter 2025"
              isActive={activeField === 'season'}
              onClick={() => handleFieldClick('season')}
              onChange={(val) => updateField('season', val)}
            />
            <EditableField
              label="Style Number"
              value={techPackData.styleNumber}
              placeholder="H2025-001"
              isActive={activeField === 'styleNumber'}
              onClick={() => handleFieldClick('styleNumber')}
              onChange={(val) => updateField('styleNumber', val)}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            
            {/* Left: Sketches */}
            <div className="border border-gray-300 p-4">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide">Technical Sketches</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-square border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                  Front View
                </div>
                <div className="aspect-square border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                  Back View
                </div>
              </div>
            </div>

            {/* Right: Specs Table */}
            <div className="border border-gray-300">
              <div className="border-b border-gray-300 p-3 bg-gray-50">
                <h3 className="font-semibold text-sm uppercase tracking-wide">Specifications</h3>
              </div>
              
              <div className="divide-y divide-gray-300">
                <SpecRow
                  label="Garment Type"
                  value={techPackData.garmentType}
                  placeholder="Select or type..."
                  isActive={activeField === 'garmentType'}
                  onClick={() => handleFieldClick('garmentType')}
                  onChange={(val) => updateField('garmentType', val)}
                />
                <SpecRow
                  label="Main Fabric"
                  value={techPackData.mainFabric}
                  placeholder="e.g., 80% Cotton / 20% Polyester"
                  isActive={activeField === 'mainFabric'}
                  onClick={() => handleFieldClick('mainFabric')}
                  onChange={(val) => updateField('mainFabric', val)}
                />
                <SpecRow
                  label="Size Range"
                  value={techPackData.sizeRange.join(', ')}
                  placeholder="Select sizes..."
                  isActive={activeField === 'sizeRange'}
                  onClick={() => handleFieldClick('sizeRange')}
                  onChange={(val) => updateField('sizeRange', val)}
                />
                <SpecRow
                  label="MOQ"
                  value={techPackData.moq}
                  placeholder="Minimum order quantity"
                  isActive={activeField === 'moq'}
                  onClick={() => handleFieldClick('moq')}
                  onChange={(val) => updateField('moq', val)}
                />
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="border border-gray-300 mb-8">
            <div className="border-b border-gray-300 p-3 bg-gray-50">
              <h3 className="font-semibold text-sm uppercase tracking-wide">Description</h3>
            </div>
            <EditableTextArea
              value={techPackData.description}
              placeholder="Describe the garment, special features, construction notes..."
              isActive={activeField === 'description'}
              onClick={() => handleFieldClick('description')}
              onChange={(val) => updateField('description', val)}
            />
          </div>

          {/* Special Instructions */}
          <div className="border border-gray-300">
            <div className="border-b border-gray-300 p-3 bg-gray-50">
              <h3 className="font-semibold text-sm uppercase tracking-wide">Special Instructions</h3>
            </div>
            <EditableTextArea
              value={techPackData.specialInstructions}
              placeholder="Any additional notes for the manufacturer..."
              isActive={activeField === 'specialInstructions'}
              onClick={() => handleFieldClick('specialInstructions')}
              onChange={(val) => updateField('specialInstructions', val)}
            />
          </div>
        </div>

        {/* Export Button */}
        <div className="max-w-5xl mx-auto mt-6 flex justify-end">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            Export as PDF
          </button>
        </div>
      </div>

      {/* Contextual Toolbar - appears at bottom when field is active */}
      {activeField && (
        <ContextualToolbar
          activeField={activeField}
          currentValue={techPackData[activeField]}
          onSelect={(value) => {
            updateField(activeField, value);
            setActiveField(null);
          }}
        />
      )}
    </div>
  );
}

// Reusable editable field component
function EditableField({ label, value, placeholder, isActive, onClick, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold text-sm">{label}:</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onClick={onClick}
        onChange={(e) => onChange(e.target.value)}
        className={`flex-1 px-2 py-1 border-b-2 transition outline-none ${
          isActive ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-300'
        }`}
      />
    </div>
  );
}

// Spec table row
function SpecRow({ label, value, placeholder, isActive, onClick, onChange }) {
  return (
    <div className="grid grid-cols-2">
      <div className="p-3 bg-gray-50 font-semibold text-sm">{label}</div>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onClick={onClick}
        onChange={(e) => onChange(e.target.value)}
        className={`p-3 outline-none transition ${
          isActive ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
        }`}
      />
    </div>
  );
}

// Editable text area
function EditableTextArea({ value, placeholder, isActive, onClick, onChange }) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onClick={onClick}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      className={`w-full p-3 outline-none transition resize-none ${
        isActive ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
      }`}
    />
  );
}

// Contextual toolbar that appears at bottom
function ContextualToolbar({ activeField, currentValue, onSelect }) {
  const suggestions = {
    garmentType: ['T-Shirt', 'Hoodie', 'Sweatshirt', 'Pants', 'Jacket', 'Shorts'],
    sizeRange: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
    mainFabric: ['100% Cotton', '80% Cotton / 20% Polyester', '100% Polyester', 'French Terry', 'Fleece'],
  };

  const options = suggestions[activeField] || [];

  if (options.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-300 shadow-lg p-4 z-50">
      <div className="max-w-5xl mx-auto flex gap-3 flex-wrap">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className="px-4 py-2 bg-gray-100 hover:bg-blue-100 border border-gray-300 rounded-lg transition"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}