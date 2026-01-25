import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SavedDesignsProfile = ({ userId }) => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const response = await fetch(`http://localhost:8000/designs/saved_designs/${userId}`);
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

  return (
    <div className="p-4 border border-gray-300 rounded mt-4 mb-4">
      <h2 className="text-xl font-bold mb-4">
        Saved Designs ({designs.length})
      </h2>

      {designs.length === 0 ? (
        <p className="text-gray-500">No saved designs yet</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {designs.map((design) => (
            <div
              key={design.id}
              onClick={() => navigate(`/prototype?designId=${design.id}`)}
              className="border border-gray-200 p-3 rounded cursor-pointer hover:border-blue-500 transition"
            >
              <h3 className="font-semibold text-gray-900">{design.name}</h3>
              <p className="text-xs text-gray-400">
                {new Date(design.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedDesignsProfile;