import NavBar from "../components/NavBar";
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from "react";


function Ratings() {
    const { user } = useAuth()

    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");

    const [manufacturers, setManufacturers] = useState([]);
    const [selectedManufacturerId, setSelectedManufacturerId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    //for error message, type = success/error
    const [message, setMessage] = useState({text: "", type: ""});

    // this function fetches manufacturers for the dropdown
    useEffect(() => {
        let isActive = true;
        async function fetchManufacturers() {
            setLoading(true);
            try {
                const res = await fetch("http://localhost:8000/manufacturers");
                if (!res.ok) {
                    throw new Error("Failed to fetch manufacturers");
                }
                const data = await res.json();
                if (isActive) {
                    setManufacturers(data);
                    setLoadError("");
                }
            } catch (err) {
                if (isActive) {
                    setLoadError("Unable to load manufacturers.");
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

    // this function submits a review
    const submitReview = async () => {

        console.log("Rating:", rating);
        console.log("Review:", review);
        setMessage({ text: "", type: "" });

        // check if user is logged in
        if (!user) {
            setMessage({text:"Please log in to leave a review", type:"error"})
            return
        }

        if(!selectedManufacturerId || rating === 0 || !review.trim()){
            setMessage({text:"Please fill out all fields", type:"error"})
            return
        }

        //send to backend to process
        setIsSubmitting(true);

        try{

            const response = await fetch("http://localhost:8000/reviews", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    manufacturer_id: Number(selectedManufacturerId),
                    user_id: user.user_id,
                    rating: rating,
                    review: review
                })
            });

            const data = await response.json()

            if(!data.success){
                setMessage({text:data.message || "Failed to submit review", type:"error"});
                setIsSubmitting(false);
                return;
            }

            setMessage({text:"Review successfully submitted", type:"success"})
            setRating(0);
            setReview("");
            setSelectedManufacturerId("");

        } catch(error) {
            console.error("Error submitting review: ", error)
            setMessage({text:error.message || "Failed to submit review", type:"error"});
        } finally {
            setIsSubmitting(false);
        }

    };


    return (
        <div className="flex min-h-screen w-full bg-[#F3F4F6] p-6 gap-6">
            <aside className="w-72">
                <NavBar />
            </aside>
            {/* Ratings + Reviews System */}
            <div className="space-y-8 flex-1 rounded-3xl bg-white p-10 shadow-sm">

                {message.text && (
                    <div className={`p-3 mb-4 border rounded ${
                        message.type === "success" 
                            ? "bg-green-50 border-green-300 text-green-800" 
                            : "bg-red-50 border-red-300 text-red-800"
                    }`}>
                        {message.text}
                    </div>
                )}

                {!user && (
                    <div className="p-4 mb-4 bg-yellow-50 border border-yellow-300 rounded">
                        <p className="text-yellow-800">Please log in to leave a review</p>
                    </div>
                )}

                {/* Manufacturer Dropdown */}
                <div className="mb-4">
                    <label className="block mb-2 font-semibold">Select Manufacturer</label>
                    <select
                        value={selectedManufacturerId}
                        onChange={(e) => setSelectedManufacturerId(e.target.value)}
                        className="w-full p-2 border rounded"
                        disabled={loading || !!loadError}
                    >
                        <option value="">
                            {loading ? "Loading..." : loadError ? "Unable to load manufacturers" : "Choose a manufacturer..."}
                        </option>
                        {!loading && !loadError &&
                            manufacturers.map((m) => (
                                <option key={m.manufacturer_id} value={m.manufacturer_id}>
                                    {m.name || "Unnamed"}
                                </option>
                            ))}
                    </select>
                    {loadError && (
                        <p className="mt-2 text-sm text-red-600">{loadError}</p>
                    )}
                </div>


                {/* Star Rating */}
                <div>
                    <h2 className="text-xl font-semibold mb-3">Rate Manufacturer</h2>
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

                {/* Submit Button */}
                <button
                    onClick={submitReview}
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                    {isSubmitting? "Submitting..." : "Submit Review"}
                </button>
            </div>
        </div>
    );
}

export default Ratings;
