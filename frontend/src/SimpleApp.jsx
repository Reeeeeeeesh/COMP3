import React from 'react';
import ReactDOM from 'react-dom/client';

function SimpleApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Compensation Calculator</h1>
      <p>This is a simple test component.</p>
      <button onClick={() => alert('Button clicked!')}>Click Me</button>
    </div>
  );
}

export default SimpleApp;
