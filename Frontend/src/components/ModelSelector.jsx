import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ModelSelector = ({ onSelect }) => {

    const [savedDesigns, setSavedDesigns] = useState([]);
    const { user } = useAuth()
    
    const models = [
        {
          id: 'short_tshirt', 
          name: 'Short Sleeved T-Shirt',
          url: 'https://nsxnjccttoutxxagdlai.supabase.co/storage/v1/object/public/base-models/short_tshirt.glb'
        },
        {
          id: 'long_tshirt', 
          name: 'Long Sleeeved T-Shirt',
          url: 'https://nsxnjccttoutxxagdlai.supabase.co/storage/v1/object/public/base-models/long_tshirt.glb'
        },
        {
          id: 'pants', 
          name: 'Pants',
          url: 'https://nsxnjccttoutxxagdlai.supabase.co/storage/v1/object/public/base-models/pants.glb'
        },
        {
          id: 'hoodie', 
          name: 'Hoodie',
          url: 'https://nsxnjccttoutxxagdlai.supabase.co/storage/v1/object/public/base-models/hoodie.glb'
        },
        {
          id: 'bucket_hat', 
          name: 'Bucket Hat',
          url: 'https://nsxnjccttoutxxagdlai.supabase.co/storage/v1/object/public/base-models/bucket_hat.glb'
        }
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
                  key={design.design_id}
                  onClick={() => onSelect(design.model_url, design.material_used)}
                >
                  <p>{design.name}</p>
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
              onClick={() => onSelect(model.url, 'cotton')}
            >
              <p>{model.name}</p>
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  export default ModelSelector;