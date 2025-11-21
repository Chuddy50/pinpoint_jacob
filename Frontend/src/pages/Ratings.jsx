import NavBar from "../components/NavBar";
import { useState } from "react";

function Ratings() {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");

    const submitReview = () => {
    console.log("Rating:", rating);
    console.log("Review:", review);
    // TODO: send to backend
    };


    return (
        <div className="flex min-h-screen w-full bg-[#F3F4F6] p-6 gap-6">
            <aside className="w-72">
                <NavBar />
            </aside>
            {/* Ratings + Reviews System */}
            <div className="space-y-8 flex-1 rounded-3xl bg-white p-10 shadow-sm">

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
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                    Submit Review
                </button>
            </div>
        </div>
    );
}

export default Ratings;