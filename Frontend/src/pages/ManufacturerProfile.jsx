import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import ManufacturerProducts from "../components/ManufacturerProducts";
import ManufacturerCategories from "../components/ManufacturerCategories";
import ManufacturerServices from "../components/ManufacturerServices";
import ManufacturerMinimums from "../components/ManufacturerMinimums";
import ManufacturerReviews from "../components/ManufacturerReviews";

function InfoRow({ label, value }) {
  const resolved =
    value === null ||
    value === undefined ||
    value === "" ||
    value === "NULL" ||
    value === "EMPTY"
      ? "Not provided yet"
      : value;
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
        {resolved}
      </p>
    </div>
  );
}

export default function ManufacturerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [manufacturer, setManufacturer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    async function fetchManufacturer() {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/manufacturers/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch manufacturers");
        }
        const data = await response.json();
        
        if (!isActive) return;
        
        //check if api returned error
        if (data.success === false) {
          setError(data.message || "We couldnt find that manufacturer yet")
          setManufacturer(null)
        } else {
          setManufacturer(data)
          setError("")
        }
      } catch (err) {
        if (isActive) {
          setError("Unable to load manufacturer right now.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }
    fetchManufacturer();
    return () => {
      isActive = false;
    };
  }, [id]);

  const ratingDisplay =
    manufacturer && manufacturer.rating
      ? Number(manufacturer.rating).toFixed(1)
      : "No rating yet";

  function handleRequestQuote() {
    if (!manufacturer) return;
    navigate("/request-quote", {
      state: {
        manufacturer: {
          id: manufacturer.manufacturer_id,
          name: manufacturer.name,
        },
      },
    });
  }

  return (
    <div className="flex min-h-screen w-full bg-[#F3F4F6] p-6 gap-6">
      <aside className="w-45">
        <NavBar />
      </aside>

      <div className="flex-1 rounded-3xl bg-white p-10 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
            >
              ← Back
            </button>
            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
              Manufacturer profile
            </p>
          </div>
        </div>

        {loading && (
          <p className="text-sm text-gray-600">Loading manufacturer...</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && manufacturer && (
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-semibold text-gray-900">
                  {manufacturer.name || "Untitled manufacturer"}
                </h1>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black transition"
                    onClick={handleRequestQuote}
                  >
                    Request a quote
                  </button>
                  <button
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                    onClick={() =>
                      navigate(`/ratings/${manufacturer.manufacturer_id}`)
                    }
                  >
                    Add Rating
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1 text-[#FFC043] text-lg">
                  {"★".repeat(
                    Math.max(0, Math.round(Number(manufacturer.rating) || 0))
                  ).padEnd(5, "☆")}
                </span>
                <span>{ratingDisplay}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Location" value={manufacturer.location} />
              <InfoRow label="Address" value={manufacturer.address} />
              <InfoRow label="Phone" value={manufacturer.phone} />
              <InfoRow label="Email" value={manufacturer.email} />
              <InfoRow label="Contact" value={manufacturer.contactee} />
              <InfoRow label="Price Range" value={manufacturer.price_range} />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Description
              </p>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 min-h-[80px]">
                {manufacturer.description &&
                manufacturer.description !== "NULL" &&
                manufacturer.description !== ""
                  ? manufacturer.description
                  : "No description available yet."}
              </div>
            </div>

            <ManufacturerProducts manufacturerId={id} />
            <ManufacturerCategories manufacturerId={id} />
            <ManufacturerServices manufacturerId={id} />
            <ManufacturerMinimums manufacturerId={id} />
            <ManufacturerReviews manufacturerId={id} />
          </div>
        )}
      </div>
    </div>
  );
}
