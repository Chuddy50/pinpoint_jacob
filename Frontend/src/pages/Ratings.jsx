import NavBar from "../components/NavBar";
import { useState } from "react";

//dummy manufacturers to choose from for now, eventaully this will be apart of the
// manufacturers profile and wont do this, just for demo purposes
const manufacturers = [
  "ABC Manufacturing", 
  "Summit Precision", 
  "AeroFab", 
  "ZX Manufacturing", 
  "Blue Ridge CNC", 
  "Allied Works",
];


function Ratings() {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");

    const [selectedManufacturer, setSelectedManufacturer] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    //for error message, type = success/error
    const [message, setMessage] = useState({text: "", type: ""});

    const submitReview = async () => {

        console.log("Rating:", rating);
        console.log("Review:", review);
        setMessage({ text: "", type: "" });

        if(!selectedManufacturer || rating == 0 || !review.trim()){
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
                    //dummy manufacturer_id for now, once we built into a
                    //manufacturer page we will query for their id, then use it here
                    manufacturer_id: 1,
                    rating: rating,
                    review: review
                })
            });

            const data = await response.json()

            if(!data.sucess){
                setMessage({text:data.message, type:"error"});
                setIsSubmitting(false);
                return;
            }

            setMessage({text:"Review successfully submitted", type:"success"})
            setRating(0);
            setReview("");
            setSelectedManufacturer("");

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

                {/* Manufacturer Dropdown */}
                <div className="mb-4">
                    <label className="block mb-2 font-semibold">Select Manufacturer</label>
                    <select
                        value={selectedManufacturer}
                        onChange={(e) => setSelectedManufacturer(e.target.value)}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">Choose a manufacturer...</option>
                        {manufacturers.map((name, index) => (
                            <option key={index} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
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