import React from 'react';

const SimpleApp: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Compensation Calculator</h1>
      <p>Simple test page to verify React is working</p>
      <button 
        style={{ 
          padding: '10px 15px', 
          backgroundColor: '#003366', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
        onClick={() => alert('Button clicked!')}
      >
        Test Button
      </button>
    </div>
  );
};

export default SimpleApp;
