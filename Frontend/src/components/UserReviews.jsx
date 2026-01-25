import { useState, useEffect } from 'react';
import { useAuth } from "../contexts/AuthContext"

const UserReviews = ({ userId }) => {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 4;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/reviews/${user.user_id}`);
        if (!response.ok) throw new Error('Failed to fetch reviews');
        const data = await response.json();
        setReviews(data.reviews);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchReviews();
  }, [userId]);

  if (loading) return <div className="p-4">Loading reviews...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  return (
    <div className="p-4 border border-gray-300 rounded">
      <h2 className="text-xl font-bold mb-4">
        Reviews ({reviews.length})
      </h2>
  
      {reviews.length === 0 ? (
        <p className="text-gray-500">No reviews yet</p>
      ) : (
        <>
          <div className="space-y-3">
            {currentReviews.map((review) => (
              <div key={review.id} className="border border-gray-200 p-3 rounded">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{review.manufacturer_name}</h3>
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center mb-2">
                  <span className="text-yellow-500 text-sm">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{review.message}</p>
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
};

export default UserReviews;