import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SavedDesignsProfile = ({ userId }) => {

  const { authHeaders } = useAuth()
  
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();
  const DESIGNS_PER_PAGE = 6;

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const response = await fetch(`http://localhost:8000/designs/saved_designs`, {
          headers: authHeaders
        });
        const data = await response.json();
        setDesigns(data.designs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchDesigns();
  }, [userId]);

  if (loading) return <div className="p-4">Loading designs...</div>;

  const totalPages = Math.ceil(designs.length / DESIGNS_PER_PAGE);
  const startIdx = currentPage * DESIGNS_PER_PAGE;
  const visibleDesigns = designs.slice(startIdx, startIdx + DESIGNS_PER_PAGE);

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="p-4 border border-gray-300 rounded mt-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          Saved Designs ({designs.length})
        </h2>
        {totalPages > 1 && (
          <span className="text-sm text-gray-500">
            Page {currentPage + 1} of {totalPages}
          </span>
        )}
      </div>
  
      {designs.length === 0 ? (
        <p className="text-gray-500">No saved designs yet</p>
      ) : (
        <div className="relative">
          {/* Left Arrow */}
          {currentPage > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-gray-50 z-10"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* designs Grid */}
          <div className="grid grid-cols-3 gap-4">
            {visibleDesigns.map((design) => (
              <div
                key={design.id}
                onClick={() => navigate(`/prototype?designId=${design.id}`)}
                className="border border-gray-200 p-3 rounded cursor-pointer hover:border-blue-500 transition"
              >
                <h3 className="font-semibold text-gray-900 truncate">{design.name}</h3>
                <p className="text-xs text-gray-400">
                  {new Date(design.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          {currentPage < totalPages - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-gray-50 z-10"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedDesignsProfile;