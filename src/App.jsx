import React, { useState } from 'react';
import './App.css';
import TemplateSelector from './components/TemplateSelector';
import CaptureScreen from './components/CaptureScreen';
import EditorScreen from './components/EditorScreen';

function App() {
  const [phase, setPhase] = useState('TEMPLATE'); // TEMPLATE, CAPTURE, EDIT
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('none'); // Add this state

  return (
    <div className="app-wrapper">
      <header style={{ textAlign: 'center', fontFamily: 'Fredoka', color: '#FFB7B2' }}>
        <h1>✨ Kawaii-Booth ✨</h1>
      </header>

      <div className="card-container">
        {phase === 'TEMPLATE' && (
          <TemplateSelector onSelect={(template) => {
            setSelectedTemplate(template);
            setPhase('CAPTURE');
          }} />
        )}

     
        {phase === 'CAPTURE' && (
          <CaptureScreen
            template={selectedTemplate}
            onComplete={(photos, filter) => { // Accept filter here
              setCapturedPhotos(photos);
              setSelectedFilter(filter); // Store it
              setPhase('EDIT');
            }}
          />
        )}

        {phase === 'EDIT' && (
          <EditorScreen
            photos={capturedPhotos}
            template={selectedTemplate}
            filter={selectedFilter} // Pass it to Editor (You'll need to handle it there later)
            onRestart={() => {
              setCapturedPhotos([]);
              setPhase('TEMPLATE');
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;