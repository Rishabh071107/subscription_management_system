import React from 'react';

const LoadingSpinner = ({ size = 28, text = 'Loading...' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div
        style={{
          width: size,
          height: size,
          border: '3px solid #ede9fe',
          borderTop: '3px solid #7c3aed',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      {text && <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>{text}</p>}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
