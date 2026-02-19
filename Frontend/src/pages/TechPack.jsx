import { useState, useRef, useEffect } from "react";
import NavBar from "../components/NavBar";

export default function TechPack() {

  useEffect(() => {
    document.title = "Tech Pack - PinPoint";
  }, []);

  const [activeField, setActiveField] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [sketchImages, setSketchImages] = useState({ front: null, back: null });

  const handleSketchUpload = (view, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setSketchImages(prev => ({ ...prev, [view]: { file, preview: e.target.result } }));
    reader.readAsDataURL(file);
  };

  const removeSketch = (view) => setSketchImages(prev => ({ ...prev, [view]: null }));

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
      // Send text data as JSON, images as FormData separately
      const formData = new FormData();
      formData.append('data', JSON.stringify(techPackData));
      if (sketchImages.front?.file) formData.append('frontSketch', sketchImages.front.file);
      if (sketchImages.back?.file) formData.append('backSketch', sketchImages.back.file);

      const response = await fetch('http://localhost:8000/techpack/generate', {
        method: "POST",
        body: formData
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
      <div className="ml-[245px] flex-1 flex flex-col p-1 overflow-hidden">
        
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
                <div className="border-r-2 border-black bg-gray-50 flex flex-col items-center justify-center p-3">
                  <SketchUploadZone
                    label="FRONT VIEW"
                    image={sketchImages.front}
                    onUpload={(file) => handleSketchUpload('front', file)}
                    onRemove={() => removeSketch('front')}
                  />
                </div>
                {/* Back view */}
                <div className="bg-gray-50 flex flex-col items-center justify-center p-3">
                  <SketchUploadZone
                    label="BACK VIEW"
                    image={sketchImages.back}
                    onUpload={(file) => handleSketchUpload('back', file)}
                    onRemove={() => removeSketch('back')}
                  />
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

        {/* Bottom bar - Suggestions + Export — fixed height, never grows */}
        <div className="bg-white border-4 border-t-0 border-black flex items-center mt-0" style={{ height: '64px', minHeight: '64px', maxHeight: '64px' }}>
          {/* Scrollable suggestions area - overflow hidden so it never pushes layout */}
          <div className="flex-1 min-w-0 flex items-center h-full overflow-hidden">
            {activeField && (
              <div
                className="flex items-center gap-3 px-4 h-full overflow-x-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <ContextualToolbar
                  activeField={activeField}
                  currentValue={techPackData[activeField]}
                  onSelect={(value) => {
                    updateField(activeField, value);
                    setActiveField(null);
                  }}
                />
              </div>
            )}
          </div>

          {/* Export button - always visible, never shrinks */}
          <div className="flex-shrink-0 border-l-4 border-black h-full flex items-center px-4 bg-white">
            <button 
              disabled={isExporting}
              onClick={handleExport}
              className="px-8 py-2 bg-black text-white font-bold text-sm tracking-widest hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'EXPORTING...' : 'EXPORT'}
            </button>
          </div>
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

// Sketch image upload zone
function SketchUploadZone({ label, image, onUpload, onRemove }) {
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    onUpload(file);
  };

  return (
    <div className="w-full h-full relative">
      {image ? (
        <div className="w-full h-full relative group">
          <img
            src={image.preview}
            alt={label}
            className="w-full h-full object-contain"
          />
          {/* Remove button */}
          <button
            onClick={onRemove}
            className="absolute top-1 right-1 bg-black text-white text-xs w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
          >
            ✕
          </button>
          <span className="absolute bottom-1 left-0 right-0 text-center text-xs font-bold text-gray-500">{label}</span>
        </div>
      ) : (
        <div
          className="w-full h-full border-2 border-dashed border-gray-400 flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-gray-100 transition"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs font-bold text-gray-400">{label}</span>
          <span className="text-xs text-gray-300 mt-1">click or drag & drop</span>
          <span className="text-xs text-gray-300 mt-2 text-center px-2">Get sketches from the <span className="underline">Prototype</span> page's Export tab</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onUpload(e.target.files[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function ContextualToolbar({ activeField, currentValue, onSelect }) {
  const suggestions = {
    productType: ['T-Shirt', 'Hoodie', 'Sweatshirt', 'Pants', 'Jacket', 'Shorts', 'Tank Top', 'Polo', 'Long Sleeve', 'Crewneck', 'Zip-Up Hoodie', 'Bomber Jacket', 'Coach Jacket', 'Windbreaker', 'Vest', 'Joggers', 'Track Pants', 'Cargo Pants', 'Flannel Shirt', 'Quarter Zip'],
    primaryColor: ['Black', 'White', 'Navy', 'Forest Green', 'Burgundy', 'Grey', 'Cream / Off-White', 'Tan / Khaki', 'Olive', 'Royal Blue', 'Red', 'Cobalt', 'Charcoal', 'Sand', 'Brown', 'Pink', 'Purple', 'Orange', 'Yellow', 'Slate Blue'],
    accentColors: ['None', 'White', 'Black', 'Red', 'Navy', 'Gold', 'Silver', 'Grey', 'Cream', 'Green', 'Tan', 'Orange', 'Pink', 'Blue', 'Brown'],
    material: ['100% Cotton', '100% Polyester', '80% Cotton / 20% Polyester', '65% Cotton / 35% Polyester', '50% Cotton / 50% Polyester', 'French Terry', 'Fleece', 'Ripstop Nylon', 'Canvas', 'Denim', 'Linen', 'Bamboo', 'Merino Wool', 'Corduroy', 'Twill', 'Mesh', 'Jersey Knit', 'Waffle Knit', 'Modal', 'Pique'],
    weight: ['Lightweight (3-4 oz)', 'Lightweight (4-5 oz)', 'Medium (5-6 oz)', 'Medium (6-7 oz)', 'Heavy (7-8 oz)', 'Heavy (8-9 oz)', 'Heavy (9+ oz)', 'Ultra Heavy (10+ oz)'],
    finishTexture: ['Matte', 'Glossy', 'Brushed', 'Distressed', 'Soft Hand', 'Garment Dyed', 'Stone Washed', 'Enzyme Washed', 'Vintage Wash', 'Suede Feel', 'Peached', 'Slub'],
    printMethod: ['Screen Print', 'DTG (Direct to Garment)', 'Embroidery', 'Heat Transfer', 'Sublimation', 'Puff Print', 'Discharge Print', 'Foil Print', 'Plastisol', 'Water-Based Ink', 'Vinyl Cut', 'Woven Label', 'Rubber Patch', 'None'],
    specialFeatures: ['Pockets', 'Hood', 'Drawstrings', 'Zipper', 'Elastic Waist', 'Ribbed Cuffs', 'Kangaroo Pocket', 'Cargo Pockets', 'Chest Pocket', 'Side Slits', 'Thumbholes', 'Half Zip', 'Full Zip', 'Button Placket', 'Raglan Sleeves', 'Drop Shoulder', 'Contrast Stitching', 'Reflective Detail', 'Mesh Lining', 'Adjustable Hem'],
    measurements: ['S: 18"W x 28"L', 'M: 20"W x 29"L', 'L: 22"W x 30"L', 'XL: 24"W x 31"L', 'Run true to size', 'Oversized fit', 'Slim fit', 'Relaxed fit', 'See attached spec sheet'],
    sizes: ['XS-XL', 'S-XL', 'S-XXL', 'XS-XXL', 'XS-3XL', 'S-3XL', 'One Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
    sampleQuantity: ['1', '2', '3', '5', '10'],
    orderQuantity: ['50', '100', '150', '200', '250', '300', '500', '750', '1000', '1500', '2000', '2500', '5000'],
    targetPrice: ['$3-5 per unit', '$5-8 per unit', '$8-12 per unit', '$12-18 per unit', '$18-25 per unit', '$25-35 per unit', '$35-50 per unit', 'Open to quote', 'Negotiable'],
    description: [
      'Heavyweight oversized tee with dropped shoulders',
      'Classic fitted crewneck with chest logo',
      'Relaxed pullover hoodie with kangaroo pocket',
      'Slim fit jogger with elastic waistband',
      'Washed coach jacket with snap buttons',
      'Vintage-style crewneck sweatshirt',
      'Cargo pants with side pockets and adjustable hem',
    ],
    specialInstructions: [
      'Match Pantone color exactly',
      'Provide swatch before production',
      'Include hang tags and labels',
      'Poly bag each unit individually',
      'Fold and box pack',
      'No logo on packaging',
      'OEKO-TEX certified materials only',
      'Send pre-production sample for approval',
      'ISO 9001 compliance required',
      'Ethical manufacturing certification required',
    ],
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