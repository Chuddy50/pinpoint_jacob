import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function SavedManufacturers() {
  const { authHeaders } = useAuth();
  const navigate = useNavigate();
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSaved() {
      if (!authHeaders) return;
      try {
        const res = await fetch("http://localhost:8000/manufacturers/saved", {
          headers: authHeaders,
        });
        const data = await res.json();
        setManufacturers(data.manufacturers);
      } catch (err) {
        console.error("Failed to fetch saved manufacturers:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSaved();
  }, [authHeaders]);

  if (loading) return <p className="text-sm text-gray-500">Loading saved manufacturers...</p>;

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-3">Saved Manufacturers</h2>
      {manufacturers.length === 0 ? (
        <p className="text-sm text-gray-500">No saved manufacturers yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {manufacturers.map((m) => (
            <div
              key={m.manufacturer_id}
              onClick={() => navigate(`/manufacturers/${m.manufacturer_id}`)}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{m.name}</p>
                <p className="text-xs text-gray-500">{m.location || "Location not provided"}</p>
              </div>
              <span className="text-yellow-500 text-sm">
                {"★".repeat(Math.round(Number(m.average_rating) || 0)).padEnd(5, "☆")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}