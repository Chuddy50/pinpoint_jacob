import { useEffect, useMemo, useState } from "react";
import ManufacturerCard from "./ManufacturerCard";

const sortModes = ["alphabetical", "rating-desc", "rating-asc"];
const PAGE_SIZE = 18;

export default function CompanyList({ searchTerm = "", filters = {} }) {
  const [sortMode, setSortMode] = useState(sortModes[0]);
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // this function changes the sort mode from the select dropdown
  function handleSortChange(event) {
    setSortMode(event.target.value);
    setCurrentPage(1);
  }

  // this function fetches manufacturers from the backend
  useEffect(() => {
    let isActive = true;
    async function fetchManufacturers() {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        if(filters.location) {
          params.append("location", filters.location)
        }

        if(filters.priceLevels && filters.priceLevels.length > 0) {
          filters.priceLevels.forEach(priceLevel => {
            params.append("priceLevel", priceLevel)
          })
        }

        if(filters.productCategories && filters.productCategories.length > 0) {
          filters.productCategories.forEach(category => {
            params.append("productCategory", category)
          })
        }

        if(filters.services && filters.services.length > 0) {
          filters.services.forEach(service => {
            params.append("services", service)
          })
        }

        if(filters.moq) {
          params.append("moq", filters.moq)
        }

        if(filters.minRating) {
          params.append("rating", filters.minRating)
        }

        const queryString = params.toString();
        let url = "";
        if(queryString)
          url = `http://localhost:8000/manufacturers?${queryString}`
        else url = "http://localhost:8000/manufacturers";

        const response = await fetch(url);

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
  }, [filters, searchTerm]);

  // filter manufacturers based on search bar
  // useMemo = only runs when manufacturers or searchTerm changes
  const filteredManufacturers = useMemo(() => {

    //if search bar is empty, show all manufacturers, not none
    if(!searchTerm.trim()){
      return manufacturers
    }

    // filter by checking if the manufacturer name includes the searched term case-insensitive
    // TODO: maybe update search logic ?? only starts with maybe ??
    return manufacturers.filter((m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [manufacturers, searchTerm]);

  // sort the manufacturers based on selected sort mode
  const sortedManufacturers = useMemo(() => {
    const list = [...filteredManufacturers];

    // sort rating high -> low
    if (sortMode === "rating-desc") {
      return list.sort(
        (a, b) => (Number(b.rating ?? 0) || 0) - (Number(a.rating ?? 0) || 0)
      );
    }

    //sort rating low -> high
    if (sortMode === "rating-asc") {
      return list.sort(
        (a, b) => (Number(a.rating ?? 0) || 0) - (Number(b.rating ?? 0) || 0)
      );
    }

    //alphabetical sorting
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredManufacturers, sortMode]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedManufacturers.length / PAGE_SIZE)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  //reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const pagedManufacturers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedManufacturers.slice(start, start + PAGE_SIZE);
  }, [sortedManufacturers, currentPage]);

  const paginationItems = useMemo(() => {
    const items = [];
    if (totalPages <= 6) {
      for (let page = 1; page <= totalPages; page += 1) {
        items.push(page);
      }
      return items;
    }
    items.push(1);
    if (currentPage > 3) {
      items.push("ellipsis");
    }
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let page = start; page <= end; page += 1) {
      items.push(page);
    }
    if (currentPage < totalPages - 2) {
      items.push("ellipsis");
    }
    items.push(totalPages);
    return items;
  }, [currentPage, totalPages]);

  const sortLabel =
    sortMode === "alphabetical"
      ? "Alphabetical (A→Z)"
      : sortMode === "rating-desc"
      ? "Rating (High→Low)"
      : "Rating (Low→High)";

  return (
    <section className="flex-1 px-2 py-4 space-y-6 md:px-10 md:py-12 md:space-y-8">
      <header className="mb-6 md:mb-10">
        <p className="text-xs uppercase tracking-[0.35em] text-gray-400">
          PinPoint
        </p>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-light text-gray-900 md:text-4xl">
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
        <p className="mt-3 text-sm text-gray-500">
        Showing {sortedManufacturers.length} manufacturer{sortedManufacturers.length !== 1 ? 's' : ''} • Page {currentPage} of {totalPages}
        </p>
      </header>

      {loading && (
        <div className="text-sm text-gray-500">Loading manufacturers...</div>
      )}
      {error && <div className="text-sm text-red-500">{error}</div>}

      {/* show message when no manufacturers match search */}
      {!loading && !error && sortedManufacturers.length === 0 && (
        <div className="text-sm text-gray-500">No manufacturers found matching "{searchTerm}"</div>
      )}

      <div className="manufacturer-grid">
        {pagedManufacturers.map((m) => (
          <ManufacturerCard
            key={m.manufacturer_id || m.name}
            {...m}
            rating={m.rating ?? 0}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 pt-6">
          {paginationItems.map((item, index) =>
            item === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                …
              </span>
            ) : (
              <button
                key={`page-${item}`}
                type="button"
                onClick={() => setCurrentPage(item)}
                className={`min-w-[36px] rounded-lg px-3 py-2 text-sm font-medium transition ${
                  item === currentPage
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {item}
              </button>
            )
          )}
        </nav>
      )}
    </section>
  );
}
