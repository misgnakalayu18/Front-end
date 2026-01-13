import React from 'react';

export default function TestEnv() {
  return (
    <div style={{ padding: '20px', background: '#f0f0f0' }}>
      <h2>Environment Debug</h2>
      <pre>
        {JSON.stringify({
          MODE: import.meta.env.MODE,
          VITE_BASE_URL: import.meta.env.VITE_BASE_URL,
          PROD: import.meta.env.PROD,
          DEV: import.meta.env.DEV,
        }, null, 2)}
      </pre>
    </div>
  );
}