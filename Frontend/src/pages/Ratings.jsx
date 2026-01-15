import NavBar from "../components/NavBar";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function Ratings() {
  const { id } = useParams();

  const navigate = useNavigate();
  const [manufacturerName, setManufacturerName] = useState("");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [message, setMessage] = useState({ text: "", type: "" });

  // fetch manufacturer name using the ID
  useEffect(() => {
    let isActive = true;

    async function fetchManufacturer() {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8000/manufacturers");
        if (!res.ok) {
          throw new Error("Failed to fetch manufacturers");
        }

        const data = await res.json();
        const found = data.find(
          (m) => String(m.manufacturer_id) === String(id)
        );

        if (!isActive) return;

        if (!found) {
          setLoadError("Manufacturer not found.");
        } else {
          setManufacturerName(found.name || "Unnamed manufacturer");
          setLoadError("");
        }
      } catch (err) {
        if (isActive) {
          setLoadError("Unable to load manufacturer.");
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

  const submitReview = async () => {
    setMessage({ text: "", type: "" });

    if (rating === 0 || !review.trim()) {
      setMessage({ text: "Please fill out all fields", type: "error" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:8000/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manufacturer_id: Number(id),
          rating,
          review,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setMessage({
          text: data.message || "Failed to submit review",
          type: "error",
        });
        return;
      }

      setMessage({ text: "Review successfully submitted", type: "success" });
      setRating(0);
      setReview("");

      // navigate back after 1.2 seconds
      setTimeout(() => {
      navigate(-1); // goes back to ManufacturerProfile
      }, 1200);
    } catch (error) {
      setMessage({
        text: error.message || "Failed to submit review",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F3F4F6] p-6 gap-6">
      <aside className="w-72">
        <NavBar />
      </aside>

      <div className="space-y-8 flex-1 rounded-3xl bg-white p-10 shadow-sm">
        {message.text && (
          <div
            className={`p-3 border rounded ${
              message.type === "success"
                ? "bg-green-50 border-green-300 text-green-800"
                : "bg-red-50 border-red-300 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {loading && (
          <p className="text-sm text-gray-600">Loading manufacturer...</p>
        )}

        {loadError && (
          <p className="text-sm text-red-600">{loadError}</p>
        )}

        {!loading && !loadError && (
          <>
            {/* Page Title */}
            <h1 className="text-3xl font-semibold text-gray-900">
              {manufacturerName}
            </h1>

            {/* Star Rating */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Your Rating</h2>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="text-4xl transition"
                  >
                    {rating >= star ? "★" : "☆"}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Review */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Leave Review</h2>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your thoughts about this manufacturer..."
                className="w-full min-h-[150px] p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit */}
            <button
              onClick={submitReview}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Ratings;
