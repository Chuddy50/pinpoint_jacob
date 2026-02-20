import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function SavedManufacturers() {
  const { authHeaders } = useAuth();
  const navigate = useNavigate();
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const manufacturersPerPage = 4;

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

  if (loading) return <div className="p-4">Loading saved manufacturers...</div>;

  const indexOfLast = currentPage * manufacturersPerPage;
  const indexOfFirst = indexOfLast - manufacturersPerPage;
  const currentManufacturers = manufacturers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(manufacturers.length / manufacturersPerPage);

  return (
    <div className="p-4 border border-gray-300 rounded mt-4 mb-4">
      <h2 className="text-xl font-bold mb-4">
        Saved Manufacturers ({manufacturers.length})
      </h2>

      {manufacturers.length === 0 ? (
        <p className="text-gray-500">No saved manufacturers yet</p>
      ) : (
        <>
          <div className="space-y-3">
            {currentManufacturers.map((m) => (
              <div
                key={m.manufacturer_id}
                onClick={() => navigate(`/manufacturers/${m.manufacturer_id}`)}
                className="border border-gray-200 p-3 rounded cursor-pointer hover:border-blue-500 transition"
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">{m.name}</h3>
                  <span className="text-xs text-gray-400">{m.location || "Location not provided"}</span>
                </div>
                <span className="text-yellow-500 text-sm">
                  {"★".repeat(Math.round(Number(m.average_rating) || 0)).padEnd(5, "☆")}
                </span>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}