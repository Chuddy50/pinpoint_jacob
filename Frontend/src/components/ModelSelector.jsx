import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ModelSelector = ({ onSelect }) => {

    const [savedDesigns, setSavedDesigns] = useState([]);
    const { user } = useAuth()

    const [deleteModal, setDeleteModal] = useState({ open: false, design: null});
    const [deleteLoading, setDeleteLoading] = useState(false);
    
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
            const response = await fetch(`http://localhost:8000/designs/saved_designs/${user.id}`);
            const data = await response.json();
            setSavedDesigns(data.designs);
          } catch (error) {
            console.error('Error fetching saved designs: ', error);
          }
        }
      };
      fetchUsersDesigns();
    }, [user]);

    
    const handleDelete = async () => {
      if (!deleteModal.design) return;

      setDeleteLoading(true);

      try{
        const response = await fetch(`http://localhost:8000/designs/delete/${deleteModal.design.design_id}?user_id=${user.id}`, {
          method: 'DELETE',
        });

        console.log('Response status: ', response.status);
        console.log('REsponse ok: ', response.ok);

        const data = await response.json();
        console.log('Response data: ', data);

        if(data.success){
          setSavedDesigns(prev => prev.filter(d => d.design_id !== deleteModal.design.design_id));
          setDeleteModal({open: false, design: null});
        }
        else{
          alert(data.message || "data not success, Failed to delete design");
        }
      }
      catch (error) {
        console.error('Error deleting design: ', error);
        alert('ERROR Failed to delete design');
      }
      finally {
        setDeleteLoading(false);
      }
    }

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
                    className="group py-6 flex items-center justify-between hover:bg-slate-50 -mx-6 px-6 transition-colors"
                  >
                    <div 
                      className="flex items-baseline gap-6 flex-1 cursor-pointer"
                      onClick={() => onSelect(design.model_url, design.material_used)}
                    >
                      <span className="text-3xl font-light text-slate-900 group-hover:text-slate-700 transition-colors">
                        {design.name}
                      </span>
                      <span className="text-sm text-slate-400">
                        {new Date(design.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({ open: true, design });
                        }}
                        className="text-slate-400 hover:text-red-600 transition-colors p-2"
                        title="Delete design"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
    
                      {/* Open button */}
                      <div 
                        className="flex items-center gap-3 text-slate-400 group-hover:text-slate-700 transition-colors cursor-pointer"
                        onClick={() => onSelect(design.model_url, design.material_used)}
                      >
                        <span className="text-sm">Open</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
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
    
        {/* Delete Confirmation Modal */}
        {deleteModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md mx-4 shadow-xl">
              <h3 className="text-2xl font-light text-slate-900 mb-4">
                Delete {deleteModal.design?.name}?
              </h3>
              <p className="text-slate-600 mb-8">
                This can't be undone.
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteModal({ open: false, design: null })}
                  disabled={deleteLoading}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
export default ModelSelector;