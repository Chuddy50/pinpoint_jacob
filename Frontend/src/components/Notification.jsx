// Notification.jsx
import React from 'react';

const Notification = ({ message, type }) => {
  if (!message) return null;

  return (
    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20">
      <div className={`px-6 py-3 rounded-lg shadow-lg ${
        type === 'success' 
          ? 'bg-green-600 text-white' 
          : 'bg-red-600 text-white'
      }`}>
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
};

export default Notification;