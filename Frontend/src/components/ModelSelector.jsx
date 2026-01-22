import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ModelSelector = ({ onSelect }) => {

    const [savedDesigns, setSavedDesigns] = useState([]);
    const { user } = useAuth()
    
    const models = [
        {
          id: 'short_tshirt', 
          name: 'Short Sleeved T-Shirt',
          description: 'Classic crew neck tee with short sleeves',
          url: 'https://nsxnjccttoutxxagdlai.supabase.co/storage/v1/object/public/base-models/short_tshirt.glb'
        },
        {
          id: 'long_tshirt', 
          name: 'Long Sleeved T-Shirt',
          description: 'Full sleeve crew neck for cooler weather',
          url: 'https://nsxnjccttoutxxagdlai.supabase.co/storage/v1/object/public/base-models/long_tshirt.glb'
        },
        {
          id: 'pants', 
          name: 'Pants',
          description: 'Versatile straight-leg trousers',
          url: 'https://nsxnjccttoutxxagdlai.supabase.co/storage/v1/object/public/base-models/pants.glb'
        },
        {
          id: 'hoodie', 
          name: 'Hoodie',
          description: 'Pullover hoodie with front pocket',
          url: 'https://nsxnjccttoutxxagdlai.supabase.co/storage/v1/object/public/base-models/hoodie.glb'
        },
        {
          id: 'bucket_hat', 
          name: 'Bucket Hat',
          description: 'Wide-brim casual headwear',
          url: 'https://nsxnjccttoutxxagdlai.supabase.co/storage/v1/object/public/base-models/bucket_hat.glb'
        }
    ];
    
    
    useEffect(() => {
      const fetchUsersDesigns = async () => {
        if (user) {
          try {
            // get all saved designs for this user from backend
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
      <div className="min-h-full bg-white p-12">
        <div className="max-w-5xl ml-8">
          {/* Header */}
          <div className="mb-20">
            <h1 className="text-6xl font-extralight text-slate-900 tracking-tight mb-4">
              Select a Model
            </h1>
            <div className="w-20 h-0.5 bg-slate-900" />
          </div>
    
          {/* Your Saved Designs */}
          <section className="mb-24">
            <h2 className="text-xs uppercase tracking-widest text-slate-400 mb-8 font-semibold">
              Saved Designs
            </h2>
            
            {savedDesigns.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {savedDesigns.map((design) => (
                  <div
                    key={design.design_id}
                    className="group py-6 flex items-center justify-between hover:bg-slate-50 -mx-6 px-6 transition-colors cursor-pointer"
                    onClick={() => onSelect(design.model_url, design.material_used)}
                  >
                    <div className="flex items-baseline gap-6">
                      <span className="text-3xl font-light text-slate-900 group-hover:text-slate-700 transition-colors">
                        {design.name}
                      </span>
                      <span className="text-sm text-slate-400">
                        {new Date(design.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-700 transition-colors">
                      <span className="text-sm">Open</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-slate-300 bg-slate-100 p-8 text-center">
                <p className="text-slate-600 font-light">
                  You must be signed in to save designs
                </p>
              </div>
            )}
          </section>
    
          {/* Base Models */}
          <section>
            <h2 className="text-xs uppercase tracking-widest text-slate-400 mb-8 font-semibold">
              Base Models
            </h2>
            
            <div className="divide-y divide-slate-100">
              {models.map((model) => (
                <div
                  key={model.id}
                  className="group py-6 flex items-center justify-between hover:bg-slate-50 -mx-6 px-6 transition-colors cursor-pointer"
                  onClick={() => onSelect(model.url, 'cotton')}
                >
                  <div>
                    <h3 className="text-3xl font-light text-slate-900 group-hover:text-slate-700 transition-colors mb-1">
                      {model.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {model.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-700 transition-colors">
                    <span className="text-sm">Open</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  };
  
export default ModelSelector;