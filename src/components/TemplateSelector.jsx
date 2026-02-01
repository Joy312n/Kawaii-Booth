import React from 'react';

export const TEMPLATES = [
  { 
    id: 'strip-4', 
    name: 'Classic Strip', 
    shots: 4, cols: 1, rows: 4, 
    width: 300, height: 1200, 
  },
  { 
    id: 'grid-2x2', 
    name: '2x2 Grid', 
    shots: 4, cols: 2, rows: 2, 
    width: 600, height: 800, 
  },
  { 
    id: 'strip-3', 
    name: '3-Pose Strip', 
    shots: 3, cols: 1, rows: 3, 
    width: 300, height: 900,
  },
  { 
    id: 'grid-6', 
    name: 'The 6-Pack', 
    shots: 6, cols: 2, rows: 3, 
    width: 600, height: 1000,
  },
  { 
    id: 'strip-2', 
    name: 'Cute Duo', 
    shots: 2, cols: 1, rows: 2, 
    width: 300, height: 600,
  },
];

export default function TemplateSelector({ onSelect }) {
  return (
    <div style={{
      textAlign: 'center', padding: '40px 10px', maxWidth: '1200px', margin: '0 auto'
    }}>
      <h1 style={{fontFamily: 'Fredoka, sans-serif', color: '#FFB7B2', fontSize: 'clamp(2rem, 5vw, 2.5rem)', marginBottom: '10px'}}>
        ✨ Pick Your Layout! ✨
      </h1>
      <p style={{color: '#888', marginBottom: '40px'}}>Choose how you want your photos to look</p>
      
      <div style={{display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center'}}>
        {TEMPLATES.map((t) => (
          <button 
            key={t.id} 
            onClick={() => onSelect(t)}
            className="template-card"
          >
            {/* --- PREVIEW AREA BACKGROUND (Gray Context) --- */}
            <div style={{
              width: '100%',
              height: '180px', // Fixed height for alignment
              background: '#f0f0f0',
              borderRadius: '15px',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden', // Hide scrollbars
              padding: '10px'
            }}>
                
                {/* --- MINIATURE STRIP SIMULATION --- */}
                <div style={{
                  // 1. Make it look like paper
                  backgroundColor: 'white',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
                  padding: '8px', // This creates the "White Border" effect
                  
                  // 2. Control Size based on Layout Type
                  width: t.cols === 1 ? '60px' : '120px', // Narrow for strips, wide for grids
                  height: 'auto', 
                  maxHeight: '100%',
                  
                  // 3. The Grid Logic
                  display: 'grid',
                  gridTemplateColumns: `repeat(${t.cols}, 1fr)`,
                  gap: '4px', // Space between photos
                  alignContent: 'center'
                }}>
                   {[...Array(t.shots)].map((_, i) => (
                     <div key={i} style={{
                       // 4. The "Photo" Placeholder
                       backgroundColor: '#333', // Dark like a turned-off screen
                       borderRadius: '2px',
                       aspectRatio: t.width === 300 && t.cols === 1 ? '4/3' : '3/4', // Match aspect ratio roughly
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       opacity: 0.8
                     }}>
                        {/* Cute Tiny Icon */}
                        <span style={{fontSize: '10px', filter: 'grayscale(1)'}}>📷</span>
                     </div>
                   ))}
                </div>

            </div>

            <div className="card-info">
              <h3>{t.name}</h3>
              <span>{t.shots} Shots</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}