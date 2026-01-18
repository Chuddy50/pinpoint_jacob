import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ModelSelector = ({ onSelect }) => {

    const [savedDesigns, setSavedDesigns] = useState([]);
    const { user } = useAuth()
    
    const models = [
        {id: 'short_tshirt', name: 'Short Sleeved T-Shirt'},
        {id: 'long_tshirt', name: 'Long Sleeeved T-Shirt'},
        {id: 'pants', name: 'Pants'},
        {id: 'hoodie', name: 'Hoodie'},
        {id: 'bucket_hat', name: 'Bucket Hat'}
    ];
    
    
    useEffect(() => {
      const fetchUsersDesigns = async () => {
        if (user) {
          try {
            const response = await fetch(`http://localhost:8000/designs/saved_designs/${user.user_id}`);
            const data = await response.json();
            setSavedDesigns(data.designs);
          } catch (error) {
            console.error('Error fetching saved designs: ', error);
          }
        }
      };
      fetchUsersDesigns();
    }, [user]);

    return (
      <div>
        <h2>Select a Model</h2>
    
        {/* Saved Designs Section */}
        {savedDesigns.length > 0 && (
          <div>
            <h3>Your Saved Designs</h3>
            <div>
              {savedDesigns.map((design) => (
                <button
                  key={design.id}
                  onClick={() => onSelect(design.model_type, design.file_url)}
                >
                  <p>{design.design_name}</p>
                  <p>{design.model_type}</p>
                  <p>{new Date(design.created_at).toLocaleDateString()}</p>
                </button>
              ))}
            </div>
          </div>
        )}
    
        {/* Base Models Section */}
        <h3>Base Models</h3>
        <div>
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => onSelect(model.id)}
            >
              <p>{model.name}</p>
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  export default ModelSelector;