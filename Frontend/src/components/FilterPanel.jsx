import { useState, useEffect } from "react";

export default function FilterPanel({ onFiltersChange }) {
  const [filters, setFilters] = useState({
    location: "",
    priceLevels: [],
    minRating: "",
    moq: "",
    productCategories: [],
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [isPriceLevelsDropdownOpen, setIsPriceLevelsDropdownOpen] = useState(false);
  const [isProductCategoriesDropdownOpen, setIsProductCategoriesDropdownOpen] = useState(false);
  const [locations, setLocations] = useState([]);
  const [priceLevels, setPriceLevels] = useState([]);
  const [minimums, setMinimums] = useState([]);
  const [productCategories, setProductCategories] = useState([]);

  const handleChange = (field, value) => {
    const updatedFilters = { ...filters, [field]: value };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleReset = () => {
    const emptyFilters = {
      location: "",
      priceLevels: [],
      minRating: "",
      moq: "",
      productCategories: [],
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const handleCategoryToggle = (categoryId) => {
    const updatedCategories = filters.productCategories.includes(categoryId)
      ? filters.productCategories.filter((id) => id !== categoryId)
      : [...filters.productCategories, categoryId];
    const updatedFilters = { ...filters, productCategories: updatedCategories };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handlePriceLevelToggle = (priceId) => {
    const updatedPriceLevels = filters.priceLevels.includes(priceId)
      ? filters.priceLevels.filter((id) => id !== priceId)
      : [...filters.priceLevels, priceId];
    const updatedFilters = { ...filters, priceLevels: updatedPriceLevels };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  // Fetch filter options from backend
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [locRes, priceRes, minRes, catRes] = await Promise.all([
          fetch("http://localhost:8000/locations"),
          fetch("http://localhost:8000/prices"),
          fetch("http://localhost:8000/minimums"),
          fetch("http://localhost:8000/product-categories"),
        ]);

        if (locRes.ok) {
          const locData = await locRes.json();
          setLocations(Array.isArray(locData) ? locData : []);
        }

        if (priceRes.ok) {
          const priceData = await priceRes.json();
          setPriceLevels(Array.isArray(priceData) ? priceData : []);
        }

        if (minRes.ok) {
          const minData = await minRes.json();
          setMinimums(Array.isArray(minData) ? minData : []);
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          setProductCategories(Array.isArray(catData) ? catData : []);
        }
      } catch (err) {
        console.error("Failed to fetch filter options:", err);
        setLocations([]);
        setPriceLevels([]);
        setMinimums([]);
        setProductCategories([]);
      }
    };

    fetchFilterOptions();
  }, []);

  const hasActiveFilters = Object.values(filters).some((v) => v !== "" && (Array.isArray(v) ? v.length > 0 : true));

  return (
    <div className={`mb-6 bg-gray-50 rounded-lg border border-gray-200 ${!isExpanded ? "h-[2.75rem]" : ""}`}>
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition ${!isExpanded ? "h-full" : ""}`}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {/* Filter Controls */}
      {isExpanded && (
        <div className="space-y-4 p-4 border-t border-gray-200">
          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Location
            </label>
            <select
              value={filters.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Any</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Price Levels */}
          <div>
            <button
              onClick={() => setIsPriceLevelsDropdownOpen(!isPriceLevelsDropdownOpen)}
              className="w-full text-left flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <span>Price Levels {filters.priceLevels.length > 0 && `(${filters.priceLevels.length})`}</span>
              <svg
                className={`w-4 h-4 transition-transform ${isPriceLevelsDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
            {isPriceLevelsDropdownOpen && (
              <div className="border border-gray-300 border-t-0 rounded-b-md p-3 max-h-48 overflow-y-auto bg-white">
                {priceLevels.length > 0 ? (
                  priceLevels.map((price) => (
                    <label key={price.price_id} className="flex items-center gap-2 mb-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={filters.priceLevels.includes(price.price_id)}
                        onChange={() => handlePriceLevelToggle(price.price_id)}
                        className="w-4 h-4 accent-blue-500"
                      />
                      <span className="text-sm text-gray-700">{price.price_level}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No price levels available</p>
                )}
              </div>
            )}
          </div>

          {/* Product Categories */}
          <div>
            <button
              onClick={() => setIsProductCategoriesDropdownOpen(!isProductCategoriesDropdownOpen)}
              className="w-full text-left flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <span>Product Categories {filters.productCategories.length > 0 && `(${filters.productCategories.length})`}</span>
              <svg
                className={`w-4 h-4 transition-transform ${isProductCategoriesDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
            {isProductCategoriesDropdownOpen && (
              <div className="border border-gray-300 border-t-0 rounded-b-md p-3 max-h-48 overflow-y-auto bg-white">
                {productCategories.length > 0 ? (
                  productCategories.map((category) => (
                    <label key={category.product_category_id} className="flex items-center gap-2 mb-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={filters.productCategories.includes(category.product_category_id)}
                        onChange={() => handleCategoryToggle(category.product_category_id)}
                        className="w-4 h-4 accent-blue-500"
                      />
                      <span className="text-sm text-gray-700">{category.category_name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No categories available</p>
                )}
              </div>
            )}
          </div>

          {/* Minimum Order Quantity */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              MOQ
            </label>
            <select
              value={filters.moq}
              onChange={(e) => handleChange("moq", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Any</option>
              {minimums.map((min) => (
                <option key={min.minimum_id} value={min.minimum_id}>
                  {min.minimum_range}
                </option>
              ))}
            </select>
          </div>

          {/* Minimum Rating */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Minimum Rating
            </label>
            <select
              value={filters.minRating}
              onChange={(e) => handleChange("minRating", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Any</option>
              <option value="3">3+ stars</option>
              <option value="3.5">3.5+ stars</option>
              <option value="4">4+ stars</option>
              <option value="4.5">4.5+ stars</option>
              <option value="5">5 stars</option>
            </select>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="w-full py-2 px-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
