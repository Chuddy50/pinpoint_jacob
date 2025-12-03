import { useEffect, useMemo, useState } from "react";
import ManufacturerCard from "./ManufacturerCard";

const sortModes = ["alphabetical", "rating-desc", "rating-asc"];

export default function CompanyList() {
  const [sortMode, setSortMode] = useState(sortModes[0]);
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // this function changes the sort mode from the select dropdown
  function handleSortChange(event) {
    setSortMode(event.target.value);
  }

  // this function fetches manufacturers from the backend
  useEffect(() => {
    let isActive = true;
    async function fetchManufacturers() {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:8000/manufacturers");
        if (!response.ok) {
          throw new Error("Failed to fetch manufacturers");
        }
        const data = await response.json();
        if (isActive) {
          setManufacturers(data);
          setError("");
        }
      } catch (err) {
        if (isActive) {
          setError("Unable to load manufacturers right now.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }
    fetchManufacturers();
    return () => {
      isActive = false;
    };
  }, []);

  const sortedManufacturers = useMemo(() => {
    const list = [...manufacturers];
    if (sortMode === "rating-desc") {
      return list.sort(
        (a, b) => (Number(b.rating ?? 0) || 0) - (Number(a.rating ?? 0) || 0)
      );
    }
    if (sortMode === "rating-asc") {
      return list.sort(
        (a, b) => (Number(a.rating ?? 0) || 0) - (Number(b.rating ?? 0) || 0)
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [manufacturers, sortMode]);

  const sortLabel =
    sortMode === "alphabetical"
      ? "Alphabetical (A→Z)"
      : sortMode === "rating-desc"
      ? "Rating (High→Low)"
      : "Rating (Low→High)";

  return (
    <section className="flex-1 px-10 py-12 space-y-8">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.35em] text-gray-400">
          PinPoint
        </p>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-4xl font-light text-gray-900">
            Browse manufacturers
          </h1>
          <label className="flex items-center gap-2 text-sm text-[#2A2A2A]">
            Sort:
            <select
              value={sortMode}
              onChange={handleSortChange}
              className="rounded-md border border-[#E6E6E6] bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_3px_10px_rgba(0,0,0,0.08)] transition focus:outline-none"
            >
              <option value="alphabetical">Alphabetical (A→Z)</option>
              <option value="rating-desc">Rating (High→Low)</option>
              <option value="rating-asc">Rating (Low→High)</option>
            </select>
          </label>
        </div>
      </header>

      {loading && (
        <div className="text-sm text-gray-500">Loading manufacturers...</div>
      )}
      {error && <div className="text-sm text-red-500">{error}</div>}

      <div className="manufacturer-grid">
        {sortedManufacturers.map((m) => (
          <ManufacturerCard
            key={m.manufacturer_id || m.name}
            {...m}
            rating={m.rating ?? 0}
          />
        ))}
      </div>
    </section>
  );
}
