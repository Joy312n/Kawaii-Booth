import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';

// Filter Definitions
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

export default function CaptureScreen({ template, onComplete }) {
  const webcamRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  
  const [timer, setTimer] = useState(null); 
  const [selectedCountdown, setSelectedCountdown] = useState(3);
  const [flash, setFlash] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('normal');

  // --- RESPONSIVE CHECK ---
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // ------------------------

  // 1. Timer Logic
  useEffect(() => {
    if (timer === null) return;
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    } else if (timer === 0) {
      performCapture();
    }
  }, [timer]);

  // 2. Sequence Logic
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
    <div style={{
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row', // Stack on mobile
      gap: '20px', 
      height: isMobile ? 'auto' : '550px', // Auto height on mobile
      width: '100%',
      maxWidth: '1000px', 
      margin: '0 auto',
      paddingBottom: isMobile ? '50px' : '0' // Space for scroll on mobile
    }}>
      
      {/* --- CAMERA AREA --- */}
      <div style={{
          flex: isMobile ? 'none' : 3, 
          height: isMobile ? '50vh' : '100%', // Take half screen on mobile
          position: 'relative', 
          borderRadius: '25px', 
          overflow: 'hidden', 
          border: '8px solid white', 
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)', 
          background: '#000', 
          display: 'flex', 
          flexDirection: 'column'
      }}>
        
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'white', opacity: flash ? 1 : 0, transition: 'opacity 0.2s', 
            zIndex: 20, pointerEvents: 'none'
        }}></div>

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width="100%"
            height="100%"
            forceScreenshotSourceSize={true} // Captures full resolution
            videoConstraints={{
                facingMode: "user",
                // These constraints try to get a square-ish aspect ratio if possible
                width: { ideal: 1920 },
                height: { ideal: 1920 }
            }}
            style={{
              display: 'block', 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', // ✨ THE MAGIC FIX: Crops instead of squeezing
              transform: 'scaleX(-1)', // ✨ MIRROR EFFECT
              filter: FILTERS[currentFilter].style, 
              transition: 'filter 0.3s ease'
            }}
          />
          
          {timer !== null && timer > 0 && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              fontSize: '8rem', color: 'white', fontWeight: 'bold', 
              textShadow: '0 4px 10px rgba(255, 183, 178, 0.8)', fontFamily: 'Fredoka', zIndex: 10
            }}>
              {timer}
            </div>
          )}
        </div>

        {/* Filter Bar */}
        {!isActive && (
           <div style={{
             height: '80px', background: 'rgba(255,255,255,0.9)', 
             backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', 
             gap: '15px', padding: '0 20px', overflowX: 'auto', whiteSpace: 'nowrap',
             zIndex: 15
           }}>
             {Object.entries(FILTERS).map(([key, filter]) => (
               <div key={key} onClick={() => setCurrentFilter(key)}
                 style={{
                   display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                   opacity: currentFilter === key ? 1 : 0.6,
                   transform: currentFilter === key ? 'scale(1.1)' : 'scale(1)',
                   transition: 'all 0.2s',
                   minWidth: '60px'
                 }}
               >
                 <div style={{
                   width: '40px', height: '40px', borderRadius: '50%', 
                   border: currentFilter === key ? '3px solid #FFB7B2' : '2px solid #ddd',
                   background: '#eee', overflow: 'hidden'
                 }}>
                    <div style={{width:'100%', height:'100%', background:'#FFB7B2', filter: filter.style}}></div>
                 </div>
                 <span style={{fontSize: '0.7rem', marginTop: '5px', fontWeight: 'bold', color: '#555'}}>{filter.name}</span>
               </div>
             ))}
           </div>
        )}
      </div>

      {/* --- SIDEBAR / BOTTOM BAR --- */}
      <div style={{
        flex: 1, 
        display: 'flex', 
        flexDirection: isMobile ? 'row' : 'column', // Horizontal on mobile
        height: isMobile ? '120px' : '100%', 
        gap: '10px',
        overflowX: isMobile ? 'auto' : 'hidden', // Scroll sideways on mobile
        justifyContent: isMobile ? 'flex-start' : 'space-between'
      }}>
        
        {/* Taken Photos Area */}
        <div style={{
            flex: 1, 
            display: 'flex', 
            flexDirection: isMobile ? 'row' : 'column',
            gap: '10px', 
            minWidth: isMobile ? '300px' : 'auto' // Ensure space on mobile
        }}>
          {/* Photos */}
          {photos.map((p, i) => (
            <div key={i} style={{
                flex: 1, 
                borderRadius: '15px', 
                overflow: 'hidden', 
                border: '3px solid white', 
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                minWidth: isMobile ? '80px' : 'auto' // Mobile thumbnail size
            }}>
              <img src={p} style={{
                  width: '100%', height: '100%', 
                  objectFit: 'cover', // ✨ Ensures thumbnails are cropped too
                  transform: 'scaleX(-1)', // ✨ Mirror thumbnails too
                  filter: FILTERS[currentFilter].style 
              }} />
            </div>
          ))}
          
          {/* Empty Slots */}
          {[...Array(template.shots - photos.length)].map((_, i) => (
            <div key={i} style={{
              flex: 1, 
              background: 'rgba(255,255,255,0.5)', 
              borderRadius: '15px', border: '2px dashed #FFB7B2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: '#FFB7B2', fontSize: '1.5rem',
              minWidth: isMobile ? '80px' : 'auto'
            }}>?</div>
          ))}
        </div>
        
        {/* Controls */}
        {!isActive && (
          <div style={{
              background: 'white', 
              padding: '10px', 
              borderRadius: '20px', 
              textAlign: 'center',
              minWidth: isMobile ? '140px' : 'auto', // Fixed width for controls on mobile
              display: 'flex', flexDirection: 'column', justifyContent: 'center'
          }}>
            <div style={{display: 'flex', justifyContent: 'center', gap: '5px', marginBottom: '10px'}}>
              {[3, 5, 10].map(t => (
                <button key={t} onClick={() => setSelectedCountdown(t)}
                  style={{
                    background: selectedCountdown === t ? '#FFB7B2' : '#eee',
                    color: selectedCountdown === t ? 'white' : '#555',
                    border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <button className="kawaii-btn mint" onClick={startBooth} style={{width: '100%', margin: '0', fontSize: '1rem', padding: '10px'}}>
              📸 GO
            </button>
          </div>
        )}
      </div>
    </div>
  );
}