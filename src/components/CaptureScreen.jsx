import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';

const FILTERS = {
  'normal': { name: 'Normal', style: 'none' },
  'bw': { name: 'B&W', style: 'grayscale(100%)' },
  'sepia': { name: 'Sepia', style: 'sepia(100%)' },
  'vintage': { name: 'Vintage', style: 'sepia(50%) contrast(150%) saturate(80%)' },
  'soft': { name: 'Soft', style: 'brightness(110%) contrast(90%) saturate(80%)' },
  'noir': { name: 'Noir', style: 'grayscale(100%) contrast(150%) brightness(80%)' },
  'vivid': { name: 'Vivid', style: 'saturate(200%) contrast(110%)' },
  'ocean': { name: 'Ocean', style: 'sepia(20%) hue-rotate(180deg) saturate(140%)' },
};

// ✨ 1. Added 'onBack' to props here
export default function CaptureScreen({ template = { shots: 4 }, onComplete, onBack }) {
  const webcamRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [timer, setTimer] = useState(null);
  const [selectedCountdown, setSelectedCountdown] = useState(3);
  const [flash, setFlash] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('normal');

  // Timer Logic
  useEffect(() => {
    if (timer === null) return;
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    } else if (timer === 0) {
      performCapture();
    }
  }, [timer]);

  // Sequence Logic
  useEffect(() => {
    if (!isActive || photos.length === 0) return;
    if (photos.length < template.shots) {
      const delay = setTimeout(() => setTimer(selectedCountdown), 1500);
      return () => clearTimeout(delay);
    } else {
      const finish = setTimeout(() => {
        setIsActive(false);
        onComplete(photos, currentFilter);
      }, 1000);
      return () => clearTimeout(finish);
    }
  }, [photos, isActive, template.shots, onComplete, selectedCountdown, currentFilter]);

  const startBooth = () => {
    setIsActive(true);
    setPhotos([]);
    setTimer(selectedCountdown);
  };

  const performCapture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    setPhotos(prev => [...prev, imageSrc]);
    setTimer(null);
  };

  return (
    <div className="booth-container">
      <style>{`
        .booth-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding: 10px;
          box-sizing: border-box;
          font-family: 'Fredoka', sans-serif;
          position: relative;
        }

        /* ✨ BACK BUTTON STYLES */
        .back-btn {
          align-self: flex-start;
          background: white;
          margin-top:30px;
          border: 2px solid #FFB7B2;
          color: #FFB7B2;
          padding: 8px 15px;
          border-radius: 20px;
          font-weight: bold;
          font-family: 'Fredoka', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 5px;
          box-shadow: 0 4px 0 rgba(0,0,0,0.05);
        }
        .back-btn:hover {
          background: #FFB7B2;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 0 rgba(0,0,0,0.05);
        }
        .back-btn:active {
          transform: translateY(0);
          box-shadow: none;
        }

        /* --- CAMERA MAIN BLOCK --- */
        .camera-section {
          position: relative;
          flex: 2;
          background: #000;
          border-radius: 20px;
          border: 6px solid white;
          box-shadow: 0 8px 30px rgba(0,0,0,0.15);
          overflow: hidden;
          aspect-ratio: 4 / 3; 
        }

        .flash-overlay {
          position: absolute;
          inset: 0;
          background: white;
          opacity: ${flash ? 1 : 0};
          transition: opacity 0.15s;
          z-index: 30;
          pointer-events: none;
        }

        .countdown-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: clamp(4rem, 15vw, 8rem);
          color: white;
          font-weight: 900;
          text-shadow: 0 4px 20px rgba(0,0,0,0.5);
          z-index: 40;
        }

        /* --- FILTER BAR --- */
        .filter-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 15px;
          overflow-x: auto;
          z-index: 20;
          scrollbar-width: none;
        }
        .filter-bar::-webkit-scrollbar { display: none; }

        .filter-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          min-width: 50px;
          transition: transform 0.2s;
        }

        /* --- SIDEBAR / BOTTOM STRIP --- */
        .sidebar {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
          gap: 10px;
        }

        .photo-slot {
          aspect-ratio: 1/1;
          border-radius: 12px;
          overflow: hidden;
          background: #f0f0f0;
          border: 2px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .controls-card {
          background: white;
          padding: 15px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }

        /* --- DESKTOP ADAPTATION --- */
        @media (min-width: 768px) {
          .booth-container {
            flex-direction: row;
            height: 80vh;
            max-height: 600px;
            padding: 20px;
          }
          .back-btn {
             position: absolute; /* Float it on desktop */
             margin-top:0;
             top: -50px;
             left: 20px;
          }
          .camera-section {
            aspect-ratio: auto;
            height: 100%;
          }
          .sidebar {
            max-width: 250px;
          }
          .photo-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      {/* ✨ 2. BACK BUTTON (Only shows if not active) */}
      {!isActive && (
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
      )}

      {/* --- CAMERA AREA --- */}
      <div className="camera-section">
        <div className="flash-overlay" />
        
        {timer !== null && timer > 0 && (
          <div className="countdown-text">{timer}</div>
        )}

        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/png"
          forceScreenshotSourceSize={true}
          videoConstraints={{
            facingMode: "user",
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            filter: FILTERS[currentFilter].style,
          }}
        />

        {!isActive && (
          <div className="filter-bar">
            {Object.entries(FILTERS).map(([key, filter]) => (
              <div 
                key={key} 
                className="filter-item"
                onClick={() => setCurrentFilter(key)}
                style={{ opacity: currentFilter === key ? 1 : 0.5 }}
              >
                <div style={{
                  width: '35px', height: '35px', borderRadius: '50%',
                  border: currentFilter === key ? '3px solid #FFB7B2' : '2px solid #ddd',
                  background: '#FFB7B2', filter: filter.style
                }} />
                <span style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>{filter.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- SIDEBAR CONTROLS --- */}
      <div className="sidebar">
        <div className="photo-grid">
          {photos.map((p, i) => (
            <div key={i} className="photo-slot">
              <img src={p} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', filter: FILTERS[currentFilter].style }} />
            </div>
          ))}
          {[...Array(template.shots - photos.length)].map((_, i) => (
            <div key={i} className="photo-slot" style={{ border: '2px dashed #FFB7B2', color: '#FFB7B2' }}>?</div>
          ))}
        </div>

        {!isActive && (
          <div className="controls-card">
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {[3, 5, 10].map(t => (
                <button 
                  key={t} 
                  onClick={() => setSelectedCountdown(t)}
                  style={{
                    background: selectedCountdown === t ? '#FFB7B2' : '#eee',
                    color: selectedCountdown === t ? 'white' : '#555',
                    border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', fontWeight: 'bold'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <button 
              className="kawaii-btn mint" 
              onClick={startBooth} 
              style={{ padding: '12px', borderRadius: '15px', border: 'none', background: '#B2F2BB', fontWeight: 'bold', cursor: 'pointer' }}
            >
              📸 START BOOTH
            </button>
          </div>
        )}
      </div>
    </div>
  );
}