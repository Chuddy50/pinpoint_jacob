import { useEffect, useState } from "react";

export default function ManufacturerMinimums({ manufacturerId }) {
  const [minimums, setMinimums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMinimums() {
      try {
        console.log("starting to fetch minimums in frontend")
        const response = await fetch(`http://localhost:8000/manufacturers/${manufacturerId}/minimums`);
        if(!response.ok){
          const errorData = await respinse.json()
          throw new Error(errorData.detail || "Failed to fetch manufacturer minimums")
        }
        const data = await response.json();
        setMinimums(data.minimums);
      } catch (err) {
        console.error("Failed to load minimums:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMinimums();
  }, [manufacturerId]);

  if (loading) return <p className="text-sm text-gray-600">Loading minimums...</p>;
  if (!minimums.length) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Minimums</h2>
      <div className="flex flex-wrap gap-2">
        {minimums.map((min) => (
          <span
            key={min.minimum_id}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700"
          >
            {min.minimum_range}
          </span>
        ))}
      </div>
    </div>
  );
}