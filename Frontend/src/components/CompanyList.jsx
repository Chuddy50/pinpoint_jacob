import { useMemo, useState } from "react";
import ManufacturerCard from "./ManufacturerCard";

const manufacturers = [
  { name: "ABC Manufacturing", location: "Salt Lake City, UT", rating: 4.5 },
  { name: "Summit Precision", location: "Provo, UT", rating: 4.2 },
  { name: "AeroFab", location: "Ogden, UT", rating: 5.0 },
  { name: "ZX Manufacturing", location: "Logan, UT", rating: 3.5 },
  { name: "Blue Ridge CNC", location: "Denver, CO", rating: 4.0 },
  { name: "Allied Works", location: "Boise, ID", rating: 3.8 },
];

export default function CompanyList() {
  const sortModes = ["alphabetical", "rating-desc", "rating-asc"];
  const [sortMode, setSortMode] = useState(sortModes[0]);

  const sortedManufacturers = useMemo(() => {
    const list = [...manufacturers];
    if (sortMode === "rating-desc") {
      return list.sort((a, b) => b.rating - a.rating);
    }
    if (sortMode === "rating-asc") {
      return list.sort((a, b) => a.rating - b.rating);
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [sortMode]);

  // this function changes the sort mode from the select dropdown
  function handleSortChange(event) {
    setSortMode(event.target.value);
  }

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
      <div className="manufacturer-grid">
        {sortedManufacturers.map((m) => (
          <ManufacturerCard key={m.name} {...m} />
        ))}
      </div>
    </section>
  );
}
