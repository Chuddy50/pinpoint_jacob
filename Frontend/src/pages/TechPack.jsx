import { useState } from "react";
import NavBar from "../components/NavBar";

export default function TechPack() {
  const [activeField, setActiveField] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [techPackData, setTechPackData] = useState({
    productName: "",
    brandName: "",
    productType: "",
    primaryColor: "",
    accentColors: "",
    material: "",
    weight: "",
    finishTexture: "",
    printMethod: "",
    specialFeatures: "",
    measurements: "",
    sizes: "",
    sampleQuantity: "",
    orderQuantity: "",
    targetPrice: "",
    description: "",
    specialInstructions: "",
    sketchImages: [],
  });

  const updateField = (field, value) => {
    setTechPackData(prev => ({ ...prev, [field]: value }));
  };

  const handleFieldClick = (fieldName) => {
    setActiveField(fieldName);
  };

  const handleExport = async() => {
    setIsExporting(true);

    try {
      const response = await fetch('http://localhost:8000/techpack/generate', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(techPackData)
      });

      if(!response.ok){
        throw new Error('Failed to generate tech pack')
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${techPackData.productName || 'techpack'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating tech pack:', error);
      alert('Failed to export tech pack. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <NavBar />
      
      {/* Main content - minimal padding */}
      <div className="ml-[245px] flex-1 flex flex-col p-1">
        
        {/* The tech pack document - takes up available space */}
        <div 
          id="tech-pack-document"
          className="flex-1 bg-white shadow-2xl border-4 border-black flex flex-col"
        >
          
          {/* Header section */}
          <div className="border-b-4 border-black grid grid-cols-2 h-14">
            {/* Left side - Title */}
            <div className="border-r-4 border-black flex items-center justify-center bg-black text-white">
              <h1 className="text-xl font-bold tracking-widest">TECH PACK</h1>
            </div>
            
            {/* Right side - Brand and Style */}
            <div className="grid grid-cols-2">
              {/* Brand Name */}
              <div className="border-r-4 border-black grid grid-cols-5">
                <div className="col-span-2 bg-gray-100 border-r-2 border-black flex items-center px-3">
                  <span className="text-xs font-bold">BRAND</span>
                </div>
                <div className="col-span-3 flex items-center px-3">
                  <GridInput
                    value={techPackData.brandName}
                    isActive={activeField === 'brandName'}
                    onClick={() => handleFieldClick('brandName')}
                    onChange={(val) => updateField('brandName', val)}
                  />
                </div>
              </div>
              
              {/* Style Name */}
              <div className="grid grid-cols-5">
                <div className="col-span-2 bg-gray-100 border-r-2 border-black flex items-center px-3">
                  <span className="text-xs font-bold">STYLE NAME</span>
                </div>
                <div className="col-span-3 flex items-center px-3">
                  <GridInput
                    value={techPackData.productName}
                    isActive={activeField === 'productName'}
                    onClick={() => handleFieldClick('productName')}
                    onChange={(val) => updateField('productName', val)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main content grid */}
          <div className="flex-1 grid grid-cols-2 border-b-4 border-black min-h-0">
            
            {/* LEFT: Technical Sketches */}
            <div className="border-r-4 border-black flex flex-col">
              <div className="bg-gray-100 border-b-4 border-black px-4 py-2">
                <h2 className="text-sm font-bold tracking-wide">TECHNICAL SKETCHES</h2>
              </div>
              <div className="flex-1 grid grid-cols-2">
                {/* Front view */}
                <div className="border-r-2 border-black bg-gray-50 flex flex-col items-center justify-center p-6">
                  <div className="w-full h-full border-2 border-dashed border-gray-400 flex flex-col items-center justify-center">
                    <svg className="w-16 h-16 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-bold text-gray-400">FRONT VIEW</span>
                  </div>
                </div>
                {/* Back view */}
                <div className="bg-gray-50 flex flex-col items-center justify-center p-6">
                  <div className="w-full h-full border-2 border-dashed border-gray-400 flex flex-col items-center justify-center">
                    <svg className="w-16 h-16 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-bold text-gray-400">BACK VIEW</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Specifications */}
            <div className="flex flex-col">
              <div className="bg-gray-100 border-b-4 border-black px-4 py-2">
                <h2 className="text-sm font-bold tracking-wide">SPECIFICATIONS</h2>
              </div>
              
              {/* Specs grid */}
              <div className="flex-1 overflow-auto">
                <SpecGridRow
                  label="Product Type"
                  value={techPackData.productType}
                  isActive={activeField === 'productType'}
                  onClick={() => handleFieldClick('productType')}
                  onChange={(val) => updateField('productType', val)}
                />
                <SpecGridRow
                  label="Primary Color"
                  value={techPackData.primaryColor}
                  isActive={activeField === 'primaryColor'}
                  onClick={() => handleFieldClick('primaryColor')}
                  onChange={(val) => updateField('primaryColor', val)}
                />
                <SpecGridRow
                  label="* Accent Color(s)"
                  value={techPackData.accentColors}
                  isActive={activeField === 'accentColors'}
                  onClick={() => handleFieldClick('accentColors')}
                  onChange={(val) => updateField('accentColors', val)}
                />
                <SpecGridRow
                  label="Material"
                  value={techPackData.material}
                  isActive={activeField === 'material'}
                  onClick={() => handleFieldClick('material')}
                  onChange={(val) => updateField('material', val)}
                />
                <SpecGridRow
                  label="Weight"
                  value={techPackData.weight}
                  isActive={activeField === 'weight'}
                  onClick={() => handleFieldClick('weight')}
                  onChange={(val) => updateField('weight', val)}
                />
                <SpecGridRow
                  label="Finish/Texture"
                  value={techPackData.finishTexture}
                  isActive={activeField === 'finishTexture'}
                  onClick={() => handleFieldClick('finishTexture')}
                  onChange={(val) => updateField('finishTexture', val)}
                />
                <SpecGridRow
                  label="Print Method"
                  value={techPackData.printMethod}
                  isActive={activeField === 'printMethod'}
                  onClick={() => handleFieldClick('printMethod')}
                  onChange={(val) => updateField('printMethod', val)}
                />
                <SpecGridRow
                  label="Special Features"
                  value={techPackData.specialFeatures}
                  isActive={activeField === 'specialFeatures'}
                  onClick={() => handleFieldClick('specialFeatures')}
                  onChange={(val) => updateField('specialFeatures', val)}
                />
                <SpecGridRow
                  label="Measurements"
                  value={techPackData.measurements}
                  isActive={activeField === 'measurements'}
                  onClick={() => handleFieldClick('measurements')}
                  onChange={(val) => updateField('measurements', val)}
                />
                <SpecGridRow
                  label="Sizes"
                  value={techPackData.sizes}
                  isActive={activeField === 'sizes'}
                  onClick={() => handleFieldClick('sizes')}
                  onChange={(val) => updateField('sizes', val)}
                />
                <SpecGridRow
                  label="Sample Quantity"
                  value={techPackData.sampleQuantity}
                  isActive={activeField === 'sampleQuantity'}
                  onClick={() => handleFieldClick('sampleQuantity')}
                  onChange={(val) => updateField('sampleQuantity', val)}
                />
                <SpecGridRow
                  label="Order Quantity"
                  value={techPackData.orderQuantity}
                  isActive={activeField === 'orderQuantity'}
                  onClick={() => handleFieldClick('orderQuantity')}
                  onChange={(val) => updateField('orderQuantity', val)}
                />
                <SpecGridRow
                  label="Target Price"
                  value={techPackData.targetPrice}
                  isActive={activeField === 'targetPrice'}
                  onClick={() => handleFieldClick('targetPrice')}
                  onChange={(val) => updateField('targetPrice', val)}
                />
              </div>
            </div>
          </div>

          {/* Bottom section - Description and Notes */}
          <div className="grid grid-cols-2 h-28">
            {/* Description */}
            <div className="border-r-4 border-black flex flex-col">
              <div className="bg-gray-100 border-b-2 border-black px-4 py-1">
                <h3 className="text-xs font-bold tracking-wide">DESCRIPTION</h3>
              </div>
              <div className="flex-1 p-2">
                <GridTextArea
                  value={techPackData.description}
                  isActive={activeField === 'description'}
                  onClick={() => handleFieldClick('description')}
                  onChange={(val) => updateField('description', val)}
                />
              </div>
            </div>
            
            {/* Special Instructions */}
            <div className="flex flex-col">
              <div className="bg-gray-100 border-b-2 border-black px-4 py-1">
                <h3 className="text-xs font-bold tracking-wide">SPECIAL INSTRUCTIONS</h3>
              </div>
              <div className="flex-1 p-2">
                <GridTextArea
                  value={techPackData.specialInstructions}
                  isActive={activeField === 'specialInstructions'}
                  onClick={() => handleFieldClick('specialInstructions')}
                  onChange={(val) => updateField('specialInstructions', val)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar - Suggestions + Export */}
        <div className="h-16 bg-white border-4 border-t-0 border-black flex items-center justify-between px-4 mt-0">
          {/* Left side - Suggestions (only when field is active) */}
          <div className="flex-1 flex items-center gap-3 overflow-x-auto">
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

          {/* Right side - Export button (always visible) */}
          <button 
            disabled={isExporting}
            onClick={handleExport}
            className="ml-4 px-8 py-2 bg-black text-white font-bold text-sm tracking-widest hover:bg-gray-800 transition flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? 'EXPORTING...' : 'EXPORT'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple grid input - no styling, just text
function GridInput({ value, isActive, onClick, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onClick={onClick}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full text-sm font-medium bg-transparent outline-none ${
        isActive ? 'text-black' : 'text-gray-700'
      }`}
      style={{ caretColor: 'black' }}
    />
  );
}

// Spec row with heavy borders
function SpecGridRow({ label, value, isActive, onClick, onChange }) {
  return (
    <div className="grid grid-cols-5 border-b-2 border-black h-9">
      <div className="col-span-2 bg-gray-100 border-r-2 border-black flex items-center px-3">
        <span className="text-xs font-bold">{label}</span>
      </div>
      <div className="col-span-3 flex items-center px-3">
        <GridInput
          value={value}
          isActive={isActive}
          onClick={onClick}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

// Grid text area
function GridTextArea({ value, isActive, onClick, onChange }) {
  return (
    <textarea
      value={value}
      onClick={onClick}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full h-full text-xs font-medium bg-transparent outline-none resize-none ${
        isActive ? 'text-black' : 'text-gray-700'
      }`}
      style={{ caretColor: 'black' }}
    />
  );
}

// Contextual toolbar - updated suggestions
function ContextualToolbar({ activeField, currentValue, onSelect }) {
  const suggestions = {
    productType: ['T-Shirt', 'Hoodie', 'Sweatshirt', 'Pants', 'Jacket', 'Shorts', 'Tank Top'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
    material: ['100% Cotton', '80% Cotton / 20% Polyester', '100% Polyester', 'French Terry', 'Fleece'],
    weight: ['Lightweight (4-5 oz)', 'Medium (6-7 oz)', 'Heavy (8+ oz)'],
    finishTexture: ['Matte', 'Glossy', 'Brushed', 'Distressed', 'Soft Hand'],
    printMethod: ['Screen Print', 'DTG', 'Embroidery', 'Heat Transfer', 'Sublimation', 'None'],
    specialFeatures: ['Pockets', 'Hood', 'Drawstrings', 'Zipper', 'Elastic Waist', 'Ribbed Cuffs'],
  };

  const options = suggestions[activeField] || [];
  if (options.length === 0) return null;

  return (
    <>
      <span className="text-xs font-bold text-gray-500 tracking-widest flex-shrink-0">SUGGESTIONS:</span>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className="px-4 py-1.5 text-xs font-bold tracking-wide bg-gray-100 hover:bg-black hover:text-white border-2 border-black transition flex-shrink-0"
        >
          {option}
        </button>
      ))}
    </>
  );
}