import { useEffect, useState } from "react";

export default function ManufacturerCategories({ manufacturerId }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch(`http://localhost:8000/manufacturers/${manufacturerId}/categories`);
        if(!response.ok){
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Failed to fetch manufacturer categories')
        }
        
        const result = await response.json();
        setCategories(result.categories);
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, [manufacturerId]);

  if (loading) return <p className="text-sm text-gray-600">Loading categories...</p>;
  if (!categories.length) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Categories</h2>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <span
            key={cat.category_id}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700"
          >
            {cat.category_name}
          </span>
        ))}
      </div>
    </div>
  );
}