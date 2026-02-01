import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer, Text, Circle, Group, Path } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import { saveAs } from 'file-saver';

// --- 🛠️ 1. STABLE RANDOM GENERATOR ---
const StableRandomBackground = ({ width, height, count, items, opacity = 1, scaleRange = [0.8, 1.2] }) => {
  const particles = useMemo(() => {
    return [...Array(count)].map((_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      rotation: (Math.random() * 60) - 30,
      scale: scaleRange[0] + Math.random() * (scaleRange[1] - scaleRange[0]),
      symbol: items[Math.floor(Math.random() * items.length)]
    }));
  }, [width, height, count, items]);

  return (
    <Group opacity={opacity}>
      {particles.map((p) => (
        <Text key={p.id} text={p.symbol} x={p.x} y={p.y} fontSize={24} rotation={p.rotation} scaleX={p.scale} scaleY={p.scale} offsetX={12} offsetY={12} />
      ))}
    </Group>
  );
};

// --- ✂️ 2. CLIPPING MASKS ---
const roundedClip = (ctx, w, h, radius) => {
  ctx.beginPath();
  ctx.moveTo(radius, 0); ctx.lineTo(w - radius, 0); ctx.quadraticCurveTo(w, 0, w, radius);
  ctx.lineTo(w, h - radius); ctx.quadraticCurveTo(w, h, w - radius, h); ctx.lineTo(radius, h);
  ctx.quadraticCurveTo(0, h, 0, h - radius); ctx.lineTo(0, radius); ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
};

const pixelHeartClip = (ctx, w, h) => {
  const map = [
    [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0], [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0], [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]
  ];
  const unitW = w / 15; const unitH = h / 12;
  ctx.beginPath();
  map.forEach((row, rIndex) => {
    row.forEach((val, cIndex) => { if (val === 1) ctx.rect(cIndex * unitW, rIndex * unitH, unitW + 0.5, unitH + 0.5); });
  });
};

const stampClip = (ctx, w, h) => {
  const radius = 6;
  ctx.beginPath();
  for (let x = 0; x < w; x += radius * 2) ctx.arc(x + radius, 0, radius, Math.PI, 0);
  for (let y = 0; y < h; y += radius * 2) ctx.arc(w, y + radius, radius, -Math.PI / 2, Math.PI / 2);
  for (let x = w; x > 0; x -= radius * 2) ctx.arc(x - radius, h, radius, 0, Math.PI);
  for (let y = h; y > 0; y -= radius * 2) ctx.arc(0, y - radius, radius, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
};

const starClip = (ctx, w, h) => {
  const cx = w / 2; const cy = h / 2;
  const outerRadius = Math.min(w, h) / 2; const innerRadius = outerRadius / 2; const spikes = 5;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = (i % 2 === 0) ? outerRadius : innerRadius;
    const angle = (Math.PI * i) / spikes - Math.PI / 2;
    const x = cx + Math.cos(angle) * r; const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
};

// --- 🎨 3. DECORATION HELPERS ---
const Emoji = ({ symbol, x, y, size, rotation = 0 }) => (
  <Text text={symbol} x={x} y={y} fontSize={size} rotation={rotation} offsetX={size / 2} offsetY={size / 2} />
);

const PuffyCloud = ({ x, y, scale = 1 }) => (
  <Group x={x} y={y} scaleX={scale} scaleY={scale}>
    <Circle x={0} y={0} radius={25} fill="white" />
    <Circle x={-20} y={10} radius={18} fill="white" />
    <Circle x={20} y={10} radius={18} fill="white" />
  </Group>
);

// --- 🎨 4. MASTER THEME LIST ---
const THEMES = [
  {
    id: 'simple', name: 'Simple White',
    bg: '#ffffff', text: '#aaa',
    clipFunc: (ctx, w, h) => roundedClip(ctx, w, h, 2),
    renderFrame: (w, h) => <Rect width={w} height={h} stroke="#eee" strokeWidth={2} cornerRadius={2} />
  },
  {
    id: 'pixel-heart', name: 'Pixel Heart 👾',
    bg: '#ffebee', text: '#d32f2f',
    clipFunc: (ctx, w, h) => pixelHeartClip(ctx, w, h),
    renderBackground: (w, h) => (
      <Group>
        {[...Array(25)].map((_, i) => <Rect key={`h${i}`} x={0} y={i * 30} width={w} height={1} fill="#ffcdd2" opacity={0.5} />)}
        <StableRandomBackground width={w} height={h} count={10} items={['❤️', '👾', '✨']} opacity={0.4} />
      </Group>
    ),
    renderFrame: (w, h) => (
      <Group><Path stroke="#D32F2F" strokeWidth={4} sceneFunc={(ctx) => { pixelHeartClip(ctx, w, h); ctx.stroke(); }} /></Group>
    )
  },
  {
    id: 'star-cut', name: 'Super Star ⭐',
    bg: '#FFF8E1', text: '#FF8F00',
    clipFunc: (ctx, w, h) => starClip(ctx, w, h),
    renderBackground: (w, h) => (
      <Group>
        <StableRandomBackground width={w} height={h} count={15} items={['✨', '⭐', '💫']} opacity={0.5} />
      </Group>
    ),
    renderFrame: (w, h) => (
      <Path stroke="#FF8F00" strokeWidth={5} sceneFunc={(ctx) => { starClip(ctx, w, h); ctx.stroke(); }} />
    )
  },
  {
    id: 'stamp', name: 'Postage Stamp 💌',
    bg: '#E0F2F1', text: '#00695C',
    clipFunc: (ctx, w, h) => stampClip(ctx, w, h),
    renderBackground: (w, h) => <StableRandomBackground width={w} height={h} count={15} items={['💌', '🕊️', '🌿']} opacity={0.3} />,
    renderFrame: (w, h) => <Path stroke="#009688" strokeWidth={3} sceneFunc={(ctx) => { stampClip(ctx, w, h); ctx.stroke(); }} />
  },
  {
    id: 'kawaii', name: 'Kawaii Pink 🎀',
    bg: '#FFF0F5', text: '#FFB7B2',
    clipFunc: (ctx, w, h) => roundedClip(ctx, w, h, 18),
    renderBackground: (w, h) => (
      <Group>
        <StableRandomBackground width={w} height={h} count={50} items={['•']} opacity={0.3} scaleRange={[0.5, 1.5]} />
        <StableRandomBackground width={w} height={h} count={8} items={['🎀', '🍭', '✨']} opacity={0.6} />
      </Group>
    ),
    renderFrame: (w, h) => <Rect width={w} height={h} stroke="#FFB7B2" strokeWidth={5} dash={[12, 10]} cornerRadius={20} />
  },
  {
    id: 'fish', name: 'Cute Fish 🐠',
    bg: '#E0F7FA', text: '#006064',
    clipFunc: (ctx, w, h) => roundedClip(ctx, w, h, 25),
    renderBackground: (w, h) => (
      <Group>
        <Rect width={w} height={h} fillLinearGradientStartPoint={{ x: 0, y: 0 }} fillLinearGradientEndPoint={{ x: 0, y: h }} fillLinearGradientColorStops={[0, '#E0F7FA', 1, '#B2EBF2']} />
        <StableRandomBackground width={w} height={h} count={15} items={['🫧', '🐟', '🐠', '🐙']} opacity={0.5} />
      </Group>
    ),
    renderFrame: (w, h) => (
      <Group>
        <Rect width={w} height={h} stroke="#4DD0E1" strokeWidth={8} cornerRadius={25} />
        <Emoji symbol="🐡" x={w - 15} y={15} size={30} rotation={-10} />
        <Emoji symbol="🦀" x={20} y={h - 20} size={25} rotation={10} />
      </Group>
    )
  },
  {
    id: 'beach', name: 'Beach Day 🏖️',
    bg: '#FFF3E0', text: '#F57F17',
    clipFunc: (ctx, w, h) => roundedClip(ctx, w, h, 20),
    renderBackground: (w, h) => (
      <Group>
        <Rect width={w} height={h} fill="#E1F5FE" />
        <Rect x={0} y={h * 0.7} width={w} height={h * 0.3} fill="#FFF9C4" />
        <StableRandomBackground width={w} height={h} count={12} items={['☀️', '🌴', '🐚', '🌊']} opacity={0.4} />
      </Group>
    ),
    renderFrame: (w, h) => (
      <Group>
        <Rect width={w} height={h} stroke="#FFCC80" strokeWidth={6} cornerRadius={20} />
        <Emoji symbol="🍉" x={0} y={h} size={40} />
        <Emoji symbol="🍹" x={w} y={0} size={35} />
      </Group>
    )
  },
  {
    id: 'starry', name: 'Starry Night 🌌',
    bg: '#0D47A1', text: '#FFF176',
    clipFunc: (ctx, w, h) => roundedClip(ctx, w, h, 15),
    renderBackground: (w, h) => (
      <Group>
        <Rect width={w} height={h} fill="#0f172a" />
        <StableRandomBackground width={w} height={h} count={30} items={['.', '✨', '⭐']} opacity={0.7} scaleRange={[0.5, 1.2]} />
      </Group>
    ),
    renderFrame: (w, h) => (
      <Group>
        <Rect width={w} height={h} stroke="#FDD835" strokeWidth={3} cornerRadius={15} shadowColor="#FDD835" shadowBlur={10} />
        <Emoji symbol="🌙" x={30} y={30} size={35} rotation={-15} />
        <Emoji symbol="🪐" x={w - 20} y={h - 20} size={30} rotation={15} />
      </Group>
    )
  },
  {
    id: 'anime', name: 'Anime Pop 🌸',
    bg: '#F3E5F5', text: '#AB47BC',
    clipFunc: (ctx, w, h) => roundedClip(ctx, w, h, 10),
    renderBackground: (w, h) => (
      <Group>
        <Rect width={w} height={h} fill="#F3E5F5" />
        <StableRandomBackground width={w} height={h} count={20} items={['🌸', '💮', '✨']} opacity={0.6} />
      </Group>
    ),
    renderFrame: (w, h) => (
      <Group>
        <Rect width={w} height={h} stroke="#AB47BC" strokeWidth={4} cornerRadius={10} />
        <Emoji symbol="🍥" x={0} y={0} size={35} />
        <Emoji symbol="🍡" x={w} y={h} size={35} />
      </Group>
    )
  },
  {
    id: 'cloud', name: 'Soft Clouds ☁️',
    bg: '#E3F2FD', text: '#1976D2',
    clipFunc: (ctx, w, h) => roundedClip(ctx, w, h, 25),
    renderFrame: (w, h) => (
      <Group>
        <Rect x={-5} y={-5} width={w + 10} height={h + 10} stroke="#BBDEFB" strokeWidth={5} cornerRadius={30} />
        <Rect width={w} height={h} stroke="white" strokeWidth={5} cornerRadius={25} />
        <PuffyCloud x={-10} y={-10} scale={0.8} />
        <PuffyCloud x={w + 10} y={h + 10} scale={1} />
        <PuffyCloud x={w} y={-15} scale={0.6} />
        <PuffyCloud x={-15} y={h} scale={0.7} />
      </Group>
    )
  },
];

// --- SMART PHOTO COMPONENT ---
const SmartPhoto = ({ src, x, y, width, height, theme }) => {
  const [image] = useImage(src, 'Anonymous');
  const imageRef = useRef();

  useEffect(() => {
    if (image && imageRef.current) {
      imageRef.current.cache();
      imageRef.current.getLayer().batchDraw();
    }
  }, [image]);

  const cropConfig = useMemo(() => {
    if (!image) return { x: 0, y: 0, width: 0, height: 0 };
    const aspectRatio = width / height;
    const imageRatio = image.width / image.height;
    let newWidth, newHeight, cropX, cropY;

    if (imageRatio > aspectRatio) {
      newWidth = image.height * aspectRatio;
      newHeight = image.height;
      cropX = (image.width - newWidth) / 2;
      cropY = 0;
    } else {
      newWidth = image.width;
      newHeight = image.width / aspectRatio;
      cropX = 0;
      cropY = (image.height - newHeight) / 2;
    }
    return { x: cropX, y: cropY, width: newWidth, height: newHeight };
  }, [image, width, height]);

  if (!image) return null;

  return (
    <Group x={x} y={y}>
      <Group clipFunc={theme.clipFunc ? (ctx) => theme.clipFunc(ctx, width, height) : undefined}>
        <KonvaImage
          ref={imageRef}
          image={image}
          x={width} y={0} scaleX={-1} width={width} height={height}
          crop={cropConfig}
        />
      </Group>
      {theme.renderFrame && theme.renderFrame(width, height)}
    </Group>
  );
};

// --- EMOJI STICKER COMPONENT ---
const EmojiSticker = ({ shapeProps, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Text
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...shapeProps}
        draggable
        onDragEnd={(e) => {
          onChange({ ...shapeProps, x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          node.scaleX(1); node.scaleY(1);
          onChange({
            ...shapeProps,
            x: node.x(), y: node.y(),
            fontSize: Math.max(20, node.fontSize() * scaleX),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && <Transformer ref={trRef} />}
    </>
  );
};

// --- MAIN EDITOR ---
export default function EditorScreen({ photos, template, filter, onRestart }) {
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [stickers, setStickers] = useState([]);
  const [selectedId, selectSticker] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState('png');
  const stageRef = useRef(null);

  // ✨ NEW: Responsive Scaling
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);

  // 💪 Robust Resize Logic
  useEffect(() => {
    const calculateScale = () => {
      if (containerRef.current) {
        // Use window innerWidth as a fallback limit if container isn't ready
        const screenWidth = Math.min(window.innerWidth, containerRef.current.offsetWidth);
        // Padding safety (40px)
        const availableWidth = screenWidth - 40;

        // Calculate scale, maxing out at 1 (100% size)
        const newScale = Math.min(1, availableWidth / template.width);
        setScale(newScale);
      }
    };

    // Calculate immediately and on resize
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [template.width]);

  const emojiList = [
    // Simple White
    "🤍", "🕊️",   "✨",
    // Pixel Heart
    "🩷", "💜", "💙", "❤️", "🖤", "🎮", "🕹️", "👾", "⭐", "◻️", "◼️",

    // Super Star
    "⭐", "🌟", "💫", "✨", "🌈", "🎤", "🎶", "🎉", "💛",

    // Postage Stamp
    "💌", "✉️", "🕊️", "🌷", "🕰️", "📜", "🖋️", "🤎",

    // Kawaii Pink
    "🎀", "💗", "🌸", "🍓", "🧸", "🐰", "🍬", "💞", "🩷",

    // Cute Fish
    "🐠", "🐟", "🫧", "🌊", "🐚", "🪸", "🩵", "💙",

    // Beach Day
    "🏖️", "🌞", "🌴", "🌊", "🐚", "🕶️", "🍹", "🩴",

    // Starry Night
    "🌌", "🌙", "⭐", "✨", "☄️", "🪐", "🌠", "💫",

    // Anime Pop
    "🌸", "🌈", "🎧", "✨", "💥", "💖", "🐱", "🍡",

    // Soft Clouds
    "☁️", "🌥️", "🌙", "🫧", "🤍", "💭",  "✨",
    
    "✧", "☾", "𓂃", "𓈒𓏸","❀", "✿",

  ];


  const addEmoji = (symbol) => {
    const id = 'emoji-' + Date.now();
    setStickers([...stickers, {
      id, text: symbol, x: 150, y: 150, fontSize: 60, rotation: 0
    }]);
  };

  const deleteSelected = useCallback(() => {
    if (selectedId) {
      setStickers(prev => prev.filter(s => s.id !== selectedId));
      selectSticker(null);
    }
  }, [selectedId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, deleteSelected]);

  // ✨ DOWNLOAD FUNCTION WITH FORMAT OPTION AND SCALE RESET
  const downloadImage = () => {
    selectSticker(null);
    setTimeout(() => {
      if (stageRef.current) {
        // 1. Save current visual scale
        const oldScaleX = stageRef.current.scaleX();
        const oldScaleY = stageRef.current.scaleY();
        const oldWidth = stageRef.current.width();
        const oldHeight = stageRef.current.height();

        // 2. Reset to full resolution (1:1) for export
        stageRef.current.scale({ x: 1, y: 1 });
        stageRef.current.width(template.width);
        stageRef.current.height(template.height);

        const mime = downloadFormat === 'png' ? 'image/png' : 'image/jpeg';
        const ext = downloadFormat;
        const uri = stageRef.current.toDataURL({
          pixelRatio: 2,
          mimeType: mime,
          quality: 0.95
        });

        // 3. Restore visual scale for the UI
        stageRef.current.scale({ x: oldScaleX, y: oldScaleY });
        stageRef.current.width(oldWidth);
        stageRef.current.height(oldHeight);

        saveAs(uri, `kawaii-booth.${ext}`);
      }
    }, 200);
  };

  const margin = 40;
  const padding = 20;
  const totalGapX = (template.cols - 1) * padding;
  const availableWidth = template.width - (margin * 2) - totalGapX;
  const slotW = availableWidth / template.cols;
  const totalGapY = (template.rows - 1) * padding;
  const availableHeight = template.height - (margin * 2) - totalGapY - 40;
  const slotH = availableHeight / template.rows;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', paddingBottom: '50px', width: '100%', maxWidth: '100vw', boxSizing: 'border-box' }}>

      {/* Theme Selection */}
      <div style={{
        background: 'white', padding: '15px', borderRadius: '20px',
        display: 'flex', flexDirection: 'column', gap: '15px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
        width: '100%', maxWidth: '100%',
        boxSizing: 'border-box'
      }}>

        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#888' }}>Choose Theme:</h4>
          {/* ✨ FIX: flex-wrap to prevent overflow */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingBottom: '5px' }}>
            {THEMES.map(theme => (
              <button
                key={theme.id} onClick={() => setSelectedTheme(theme)}
                style={{
                  padding: '8px 12px', borderRadius: '20px',
                  border: selectedTheme.id === theme.id ? `2px solid #FFB7B2` : '1px solid #eee',
                  background: selectedTheme.id === theme.id ? '#FFF0F5' : 'white',
                  cursor: 'pointer', fontWeight: 'bold', color: '#555',
                  fontSize: '0.85rem', flexGrow: 1, textAlign: 'center'
                }}
              >
                {theme.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#888' }}>Add Emojis:</h4>
          <div
            className="emoji-scroll"
            style={{
              display: 'flex',
              gap: '5px',
              flexWrap: 'wrap',
              maxHeight: '120px',
              overflowY: 'auto'
            }}
          >

            {emojiList.map(emoji => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                style={{
                  fontSize: '24px',
                  
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px',
                  transition: 'transform 0.15s ease'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1.0)'}
              >
                {emoji}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* CANVAS CONTAINER */}
      <div
        ref={containerRef}
        style={{
          border: '1px solid #eee',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          borderRadius: '5px',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '100%',
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: '#fafafa'
        }}
      >
        <Stage
          width={template.width * scale}
          height={template.height * scale}
          scaleX={scale}
          scaleY={scale}
          ref={stageRef}
          onMouseDown={(e) => { if (e.target === e.target.getStage()) selectSticker(null); }}
          onTouchStart={(e) => { if (e.target === e.target.getStage()) selectSticker(null); }}
        >
          <Layer>
            <Rect width={template.width} height={template.height} fill={selectedTheme.bg} />
            {selectedTheme.renderBackground && selectedTheme.renderBackground(template.width, template.height)}

            {photos.map((src, i) => {
              const colIndex = i % template.cols; const rowIndex = Math.floor(i / template.cols);
              const x = margin + (colIndex * (slotW + padding)); const y = margin + (rowIndex * (slotH + padding));
              return (<SmartPhoto key={i} src={src} x={x} y={y} width={slotW} height={slotH} theme={selectedTheme} />);
            })}

            <Text
              text={new Date().toLocaleDateString()} x={0} y={template.height - 35} width={template.width}
              align="center" fontFamily="Quicksand" fontStyle="bold" fontSize={16} fill={selectedTheme.text}
            />

            {stickers.map((sticker, i) => (
              <EmojiSticker key={sticker.id} shapeProps={sticker} isSelected={sticker.id === selectedId} onSelect={() => selectSticker(sticker.id)} onChange={(newAttrs) => { const slice = stickers.slice(); slice[i] = newAttrs; setStickers(slice); }} />
            ))}
          </Layer>
        </Stage>
      </div>

      {/* ✨ FOOTER CONTROLS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '450px', padding: '0 20px', boxSizing: 'border-box' }}>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.9rem', color: '#888', fontWeight: 'bold', alignSelf: 'center' }}>Save as:</span>
          <button onClick={() => setDownloadFormat('png')} style={{ padding: '5px 15px', borderRadius: '15px', border: 'none', background: downloadFormat === 'png' ? '#B5EAD7' : '#eee', color: downloadFormat === 'png' ? 'white' : '#555', cursor: 'pointer', fontWeight: 'bold' }}>PNG</button>
          <button onClick={() => setDownloadFormat('jpg')} style={{ padding: '5px 15px', borderRadius: '15px', border: 'none', background: downloadFormat === 'jpg' ? '#B5EAD7' : '#eee', color: downloadFormat === 'jpg' ? 'white' : '#555', cursor: 'pointer', fontWeight: 'bold' }}>JPG</button>
        </div>

        <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap' }}>
          <button className="kawaii-btn" onClick={onRestart} style={{ flex: '1 1 80px', background: '#eee', color: '#555', fontSize: '0.9rem', padding: '10px' }}>↺ Restart</button>
          <button
            className="kawaii-btn" onClick={deleteSelected} disabled={!selectedId}
            style={{
              flex: '1 1 80px', background: selectedId ? '#FFCDD2' : '#f0f0f0', color: selectedId ? '#D32F2F' : '#ccc',
              cursor: selectedId ? 'pointer' : 'default', opacity: selectedId ? 1 : 0.6, fontSize: '0.9rem', padding: '10px'
            }}
          >
            🗑️ Cut
          </button>
          <button className="kawaii-btn mint" onClick={downloadImage} style={{ flex: '2 1 120px', fontSize: '1rem', padding: '10px' }}>💾 Download</button>
        </div>
      </div>
    </div>
  );
}