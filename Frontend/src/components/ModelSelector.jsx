import React from 'react';

const models = [
    {id: 'short tshirt', name: 'Short Sleeved T-Shirt'},
    {id: 'long tshirt', name: 'Long Sleeeved T-Shirt'},
    {id: 'pants', name: 'Pants'},
    {id: 'hoodie', name: 'Hoodie'},
    {id: 'hat', name: 'Bucket Hat'}
];

const ModelSelector = ({ onSelect }) => {
    return (
      <div>
        <h1>Select a Model</h1>
        <div>
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => onSelect(model.id)}
            >
              {model.name}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  export default ModelSelector;