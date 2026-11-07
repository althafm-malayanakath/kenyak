import React, { useState, useRef, useEffect } from 'react';
import { Trash2, RefreshCw, ShoppingCart, HelpCircle } from 'lucide-react';
import Logo from './Logo';

// Helper to programmatically make JPEG white backgrounds transparent inside the canvas
const makeImageTransparent = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          // Key out pixels that are very light/white (RGB > 245)
          if (r > 245 && g > 245 && b > 245) {
            data[i+3] = 0; // Alpha = 0 (transparent)
          }
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL());
      } catch (err) {
        console.warn("Canvas transparency processing failed (CORS limit):", err);
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
};

export default function StickerPlayground({ playgroundStickers, onRemoveSticker, onUpdateSticker, onClearPlayground, onAddAllToCart }) {
  const [selectedId, setSelectedId] = useState(null);
  const [activeDevice, setActiveDevice] = useState('laptop');
  const [deviceFinish, setDeviceFinish] = useState('dark');
  const [deviceRotation, setDeviceRotation] = useState(0);
  const [transparentCache, setTransparentCache] = useState({});
  const canvasRef = useRef(null);
  const dragInfoRef = useRef({ isDragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });
  const rotateRef = useRef({ isRotating: false, startX: 0, startRotation: 0 });

  // Finish options customized per physical device
  const finishOptions = {
    laptop: [
      { id: 'dark', label: 'Space Black', color: '#16171a' },
      { id: 'silver', label: 'Starlight Silver', color: '#d4d6dc' },
      { id: 'accent', label: 'Midnight Blue', color: '#1b2333' }
    ],
    phone: [
      { id: 'dark', label: 'Black Titanium', color: '#1c1d20' },
      { id: 'silver', label: 'Natural Titanium', color: '#888580' },
      { id: 'accent', label: 'Desert Titanium', color: '#a0897b' }
    ],
    trolley: [
      { id: 'dark', label: 'Stealth Black', color: '#18191c' },
      { id: 'silver', label: 'Silver Aluminum', color: '#cbd0d8' },
      { id: 'accent', label: 'Hyper Red', color: '#881337' }
    ],
    bottle: [
      { id: 'dark', label: 'Matte Obsidian', color: '#141518' },
      { id: 'silver', label: 'Brushed Steel', color: '#cbd0d8' },
      { id: 'accent', label: 'Alpine White', color: '#f1f5f9' }
    ],
    skateboard: [
      { id: 'dark', label: 'Carbon Grip', color: '#18181b' },
      { id: 'silver', label: 'Raw Timber', color: '#573d2a' },
      { id: 'accent', label: 'Neon Ink', color: '#312e81' }
    ],
    notebook: [
      { id: 'dark', label: 'Onyx Leather', color: '#141518' },
      { id: 'silver', label: 'Cognac Leather', color: '#6d3c22' },
      { id: 'accent', label: 'Navy Classic', color: '#1e293b' }
    ]
  };

  // Handle outside click to deselect
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (canvasRef.current && !canvasRef.current.contains(e.target) && !e.target.closest('.playground-control')) {
        setSelectedId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Reset rotation when device changes
  useEffect(() => {
    setDeviceRotation(0);
  }, [activeDevice]);

  // Process and cache transparent sticker images
  useEffect(() => {
    playgroundStickers.forEach((sticker) => {
      if (sticker.image && !transparentCache[sticker.image]) {
        makeImageTransparent(sticker.image).then((transparentUrl) => {
          setTransparentCache((prev) => ({
            ...prev,
            [sticker.image]: transparentUrl
          }));
        });
      }
    });
  }, [playgroundStickers, transparentCache]);

  const handleStartDrag = (e, stickerId) => {
    e.stopPropagation(); // Prevent background rotation trigger
    setSelectedId(stickerId);
    
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;

    const sticker = playgroundStickers.find(s => s.id === stickerId);
    if (!sticker) return;

    dragInfoRef.current = {
      isDragging: true,
      startX: clientX,
      startY: clientY,
      startLeft: sticker.x,
      startTop: sticker.y
    };
  };

  const handleDrag = (e) => {
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;

    if (clientX === undefined || clientY === undefined) return;

    if (dragInfoRef.current.isDragging && selectedId !== null) {
      const deltaX = clientX - dragInfoRef.current.startX;
      const deltaY = clientY - dragInfoRef.current.startY;

      const canvasWidth = canvasRef.current.clientWidth;
      const canvasHeight = canvasRef.current.clientHeight;

      // Adjust deltas based on mockup rotation so dragging stays intuitive!
      const rad = (-deviceRotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const localDeltaX = deltaX * cos - deltaY * sin;
      const localDeltaY = deltaX * sin + deltaY * cos;

      // Convert pixel delta to percentage delta
      const pctX = (localDeltaX / canvasWidth) * 100;
      const pctY = (localDeltaY / canvasHeight) * 100;

      let newX = dragInfoRef.current.startLeft + pctX;
      let newY = dragInfoRef.current.startTop + pctY;

      // Bound limits
      newX = Math.max(5, Math.min(newX, 90));
      newY = Math.max(5, Math.min(newY, 90));

      onUpdateSticker(selectedId, { x: newX, y: newY });
    } else if (rotateRef.current.isRotating) {
      const deltaX = clientX - rotateRef.current.startX;
      // 0.75 degrees of rotation per drag pixel
      let newRotation = (rotateRef.current.startRotation + deltaX * 0.75) % 360;
      if (newRotation < 0) newRotation += 360;
      setDeviceRotation(newRotation);
    }
  };

  const handleEndDrag = () => {
    dragInfoRef.current.isDragging = false;
    rotateRef.current.isRotating = false;
  };

  const handleCanvasStart = (e) => {
    // If they click the background/markup of the canvas (not on a sticker wrapper)
    if (!e.target.closest('.placed-sticker-wrapper')) {
      setSelectedId(null);
      
      const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      rotateRef.current = {
        isRotating: true,
        startX: clientX,
        startRotation: deviceRotation
      };
    }
  };

  const updateSelectedRotation = (amount) => {
    if (selectedId === null) return;
    const sticker = playgroundStickers.find(s => s.id === selectedId);
    if (sticker) {
      onUpdateSticker(selectedId, { rotation: (sticker.rotation + amount) % 360 });
    }
  };

  const updateSelectedScale = (factor) => {
    if (selectedId === null) return;
    const sticker = playgroundStickers.find(s => s.id === selectedId);
    if (sticker) {
      const newScale = Math.max(0.5, Math.min(sticker.scale * factor, 2.0));
      onUpdateSticker(selectedId, { scale: newScale });
    }
  };

  const deleteSelected = () => {
    if (selectedId === null) return;
    onRemoveSticker(selectedId);
    setSelectedId(null);
  };

  const selectedSticker = playgroundStickers.find(s => s.id === selectedId);

  return (
    <div className="playground-container">
      {/* Header Info */}
      <div className="playground-header">
        <div className="playground-info">
          <h2>💻 Sticker Playground</h2>
          <p>Drag, rotate, scale stickers. Preview before adding them to your custom gear!</p>
        </div>

        {/* Device and Finish Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="device-toggles" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              onClick={() => setActiveDevice('laptop')}
              className={`device-toggle-btn ${activeDevice === 'laptop' ? 'active' : ''}`}
            >
              💻 MacBook Pro
            </button>
            <button
              onClick={() => setActiveDevice('phone')}
              className={`device-toggle-btn ${activeDevice === 'phone' ? 'active' : ''}`}
            >
              📱 iPhone Pro
            </button>
            <button
              onClick={() => setActiveDevice('bottle')}
              className={`device-toggle-btn ${activeDevice === 'bottle' ? 'active' : ''}`}
            >
              🍶 Flask Bottle
            </button>
            <button
              onClick={() => setActiveDevice('trolley')}
              className={`device-toggle-btn ${activeDevice === 'trolley' ? 'active' : ''}`}
            >
              🧳 Rimowa Trolley
            </button>
            <button
              onClick={() => setActiveDevice('skateboard')}
              className={`device-toggle-btn ${activeDevice === 'skateboard' ? 'active' : ''}`}
            >
              🛹 Skateboard
            </button>
            <button
              onClick={() => setActiveDevice('notebook')}
              className={`device-toggle-btn ${activeDevice === 'notebook' ? 'active' : ''}`}
            >
              📓 Journal Book
            </button>
          </div>

          {/* Color & Material Finish Bar */}
          <div className="finish-toggles-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Surface Finish:
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(finishOptions[activeDevice] || finishOptions.laptop).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDeviceFinish(opt.id)}
                  className={`finish-option-pill ${deviceFinish === opt.id ? 'active' : ''}`}
                  title={opt.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    background: deviceFinish === opt.id ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.4)',
                    border: deviceFinish === opt.id ? '1px solid var(--neon-yellow)' : '1px solid rgba(255,255,255,0.1)',
                    color: deviceFinish === opt.id ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: opt.color,
                      border: '1px solid rgba(255,255,255,0.4)',
                      display: 'inline-block'
                    }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Canvas Panel */}
      <div className="playground-grid">
        
        {/* Left canvas display */}
        <div className="canvas-wrapper">
          {/* Studio Table Contact Shadow */}
          <div className="studio-table-shadow"></div>
          
          {/* Main Drag Canvas Area */}
          <div
            ref={canvasRef}
            onMouseMove={handleDrag}
            onMouseUp={handleEndDrag}
            onMouseLeave={handleEndDrag}
            onTouchMove={handleDrag}
            onTouchEnd={handleEndDrag}
            onMouseDown={handleCanvasStart}
            onTouchStart={handleCanvasStart}
            className={`device-canvas-${activeDevice} finish-${deviceFinish}`}
            style={{
              transform: `rotate(${deviceRotation}deg)`,
              transition: dragInfoRef.current.isDragging || rotateRef.current.isRotating ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* 1. PHOTOREALISTIC LAPTOP (MacBook Pro Lid) */}
            {activeDevice === 'laptop' && (
              <>
                <div className="mock-laptop-cnc-chamfer"></div>
                <div className="mock-laptop-apple-emblem">
                  <div className="emblem-shine"></div>
                </div>
                <div className="mock-laptop-scallop-notch">
                  <div className="notch-specular-edge"></div>
                </div>
                <div className="mock-laptop-pro-hinge">
                  <div className="hinge-seam left"></div>
                  <div className="hinge-seam right"></div>
                </div>
                <div className="mock-laptop-anisotropic-lighting"></div>
              </>
            )}

            {/* 2. PHOTOREALISTIC IPHONE (iPhone 16 Pro Max) */}
            {activeDevice === 'phone' && (
              <>
                <div className="mock-phone-titanium-bezel"></div>
                {/* Physical Titanium Antenna Separator Inserts */}
                <div className="mock-phone-antenna top-left"></div>
                <div className="mock-phone-antenna top-right"></div>
                <div className="mock-phone-antenna bottom-left"></div>
                <div className="mock-phone-antenna bottom-right"></div>
                {/* Tactile Side Buttons */}
                <div className="mock-phone-btn-action"></div>
                <div className="mock-phone-btn-volume-up"></div>
                <div className="mock-phone-btn-volume-down"></div>
                <div className="mock-phone-btn-power"></div>
                <div className="mock-phone-btn-camera-control"></div>
                {/* Centered Liquid Chrome Apple Logo */}
                <div className="mock-phone-apple-logo"></div>
                {/* Sculpted 3D Camera Island */}
                <div className="mock-phone-camera-plateau">
                  <div className="camera-lens-cluster lens-top">
                    <div className="titanium-outer-ring"></div>
                    <div className="sapphire-glass-layer"></div>
                    <div className="lens-ar-coating-cyan"></div>
                    <div className="aperture-core"></div>
                  </div>
                  <div className="camera-lens-cluster lens-bottom">
                    <div className="titanium-outer-ring"></div>
                    <div className="sapphire-glass-layer"></div>
                    <div className="lens-ar-coating-magenta"></div>
                    <div className="aperture-core"></div>
                  </div>
                  <div className="camera-lens-cluster lens-right">
                    <div className="titanium-outer-ring"></div>
                    <div className="sapphire-glass-layer"></div>
                    <div className="lens-ar-coating-cyan"></div>
                    <div className="aperture-core"></div>
                  </div>
                  {/* Quad-LED True Tone Dual Flash */}
                  <div className="mock-phone-flash-ring">
                    <div className="flash-phosphor"></div>
                  </div>
                  {/* Dark Ceramic LiDAR Scanner */}
                  <div className="mock-phone-lidar-disc"></div>
                  {/* Mic Pinhole */}
                  <div className="mock-phone-mic-dot"></div>
                </div>
                <div className="mock-phone-frosted-sheen"></div>
              </>
            )}

            {/* 3. PHOTOREALISTIC BOTTLE (Hydro Flask / Chilly's) */}
            {activeDevice === 'bottle' && (
              <>
                <div className="mock-bottle-carry-loop"></div>
                <div className="mock-bottle-insulated-cap">
                  <div className="cap-knurled-grip"></div>
                </div>
                <div className="mock-bottle-steel-collar"></div>
                <div className="mock-bottle-cylindrical-specular"></div>
                <div className="mock-bottle-silicone-boot">
                  <div className="boot-reinforce-ribs"></div>
                </div>
              </>
            )}

            {/* 4. PHOTOREALISTIC TROLLEY (Rimowa Luxury Luggage) */}
            {activeDevice === 'trolley' && (
              <>
                {/* Telescoping Twin Aluminum Tubes & Release Grip */}
                <div className="mock-trolley-tele-tubes">
                  <div className="tube-pole left"></div>
                  <div className="tube-pole right"></div>
                </div>
                <div className="mock-trolley-top-handle">
                  <div className="handle-thumb-btn"></div>
                </div>
                {/* 4 Riveted Stamped Corner Armor Plates */}
                <div className="mock-trolley-armor top-left">
                  <span className="armor-rivet r1"></span>
                  <span className="armor-rivet r2"></span>
                  <span className="armor-rivet r3"></span>
                </div>
                <div className="mock-trolley-armor top-right">
                  <span className="armor-rivet r1"></span>
                  <span className="armor-rivet r2"></span>
                  <span className="armor-rivet r3"></span>
                </div>
                <div className="mock-trolley-armor bottom-left">
                  <span className="armor-rivet r1"></span>
                  <span className="armor-rivet r2"></span>
                  <span className="armor-rivet r3"></span>
                </div>
                <div className="mock-trolley-armor bottom-right">
                  <span className="armor-rivet r1"></span>
                  <span className="armor-rivet r2"></span>
                  <span className="armor-rivet r3"></span>
                </div>
                {/* 3D Extruded Deep Vertical Grooves */}
                <div className="mock-trolley-deep-grooves">
                  <div className="luggage-groove-rib"></div>
                  <div className="luggage-groove-rib"></div>
                  <div className="luggage-groove-rib"></div>
                  <div className="luggage-groove-rib"></div>
                  <div className="luggage-groove-rib"></div>
                </div>
                {/* Center Seal Seam & TSA Locks */}
                <div className="mock-trolley-center-seal"></div>
                <div className="mock-trolley-tsa-latch top">
                  <div className="tsa-keyway"></div>
                </div>
                <div className="mock-trolley-tsa-latch bottom">
                  <div className="tsa-keyway"></div>
                </div>
                {/* Side Cushioned Rubber Luggage Handle */}
                <div className="mock-trolley-side-handle"></div>
                {/* Heavy Duty 360° Ball Bearing Wheels */}
                <div className="mock-trolley-pro-wheel left">
                  <div className="wheel-rubber-tire"></div>
                  <div className="wheel-ball-bearing"></div>
                </div>
                <div className="mock-trolley-pro-wheel right">
                  <div className="wheel-rubber-tire"></div>
                  <div className="wheel-ball-bearing"></div>
                </div>
              </>
            )}

            {/* 5. PHOTOREALISTIC SKATEBOARD (Pro 7-Ply Maple) */}
            {activeDevice === 'skateboard' && (
              <>
                <div className="mock-skate-maple-laminate-ply"></div>
                <div className="mock-skate-diecut-center-line"></div>
                <div className="mock-skate-hardware-mount top">
                  <span className="allen-bolt"></span><span className="allen-bolt"></span>
                  <span className="allen-bolt"></span><span className="allen-bolt"></span>
                </div>
                <div className="mock-skate-hardware-mount bottom">
                  <span className="allen-bolt"></span><span className="allen-bolt"></span>
                  <span className="allen-bolt"></span><span className="allen-bolt"></span>
                </div>
                <div className="mock-skate-kick-lighting top"></div>
                <div className="mock-skate-kick-lighting bottom"></div>
              </>
            )}

            {/* 6. PHOTOREALISTIC NOTEBOOK (Moleskine Journal) */}
            {activeDevice === 'notebook' && (
              <>
                <div className="mock-notebook-debossed-border"></div>
                <div className="mock-notebook-stitched-spine">
                  <span className="spine-rib r1"></span>
                  <span className="spine-rib r2"></span>
                  <span className="spine-rib r3"></span>
                  <span className="spine-rib r4"></span>
                </div>
                <div className="mock-notebook-paper-strata"></div>
                <div className="mock-notebook-woven-elastic">
                  <div className="elastic-texture-weave"></div>
                </div>
                <div className="mock-notebook-satin-ribbon"></div>
              </>
            )}

            {/* Placed Stickers Layer */}
            {playgroundStickers.map((sticker) => (
              <div
                key={sticker.id}
                onMouseDown={(e) => handleStartDrag(e, sticker.id)}
                onTouchStart={(e) => handleStartDrag(e, sticker.id)}
                style={{
                  position: 'absolute',
                  left: `${sticker.x}%`,
                  top: `${sticker.y}%`,
                  transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                  cursor: 'move',
                  zIndex: selectedId === sticker.id ? 40 : 10,
                  transition: dragInfoRef.current.isDragging && selectedId === sticker.id ? 'none' : 'transform 0.15s ease-out'
                }}
                className={`placed-sticker-wrapper ${selectedId === sticker.id ? 'selected-ring' : ''}`}
              >
                <img
                  src={transparentCache[sticker.image] || sticker.image}
                  alt={sticker.name}
                  draggable="false"
                  className="placed-sticker-img"
                />
              </div>
            ))}

            {/* Studio Lighting & Specular Reflection Overlay (Breathes physical light across stickers & surface) */}
            <div className="studio-specular-overlay"></div>
          </div>

          {/* Floating Non-Intrusive Prompt (Keeps Device Clean & Gorgeous) */}
          {playgroundStickers.length === 0 && (
            <div className="floating-canvas-hint">
              <span className="hint-pill">
                💡 Click <strong>"⚡ Try on Mockup"</strong> on any sticker below to place it here. Drag gear to rotate!
              </span>
            </div>
          )}
        </div>

        {/* Right controls side panel */}
        <div className="playground-controls">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="control-card-title">Playground Control Center</h3>

            {/* Mockup 360° Rotation Control */}
            <div className="control-card" style={{ borderColor: 'var(--neon-yellow)' }}>
              <div className="control-group" style={{ marginBottom: 0 }}>
                <span className="control-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  🔄 Gear Rotation <span>{Math.round(deviceRotation)}°</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={Math.round(deviceRotation)}
                  onChange={(e) => setDeviceRotation(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--neon-yellow)',
                    background: 'var(--bg-dark)',
                    height: '6px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    marginTop: '8px',
                    marginBottom: '8px'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  <span>0°</span>
                  <span style={{ cursor: 'pointer', color: 'var(--neon-yellow)', fontWeight: 'bold' }} onClick={() => setDeviceRotation(0)}>Reset</span>
                  <span>360°</span>
                </div>
              </div>
            </div>

            {selectedSticker ? (
              <div className="control-card" style={{ borderColor: 'var(--neon-purple)' }}>
                <p className="selected-sticker-details">
                  Selected: <span>{selectedSticker.name}</span>
                </p>

                {/* Rotate button controls */}
                <div className="control-group">
                  <span className="control-label">Rotate Sticker</span>
                  <div className="control-row">
                    <button
                      onClick={() => updateSelectedRotation(-15)}
                      className="playground-control control-btn"
                    >
                      -15°
                    </button>
                    <button
                      onClick={() => updateSelectedRotation(15)}
                      className="playground-control control-btn"
                    >
                      +15°
                    </button>
                  </div>
                </div>

                {/* Scale buttons */}
                <div className="control-group">
                  <span className="control-label">Resize Sticker</span>
                  <div className="control-row">
                    <button
                      onClick={() => updateSelectedScale(0.9)}
                      className="playground-control control-btn"
                    >
                      Shrink
                    </button>
                    <button
                      onClick={() => updateSelectedScale(1.1)}
                      className="playground-control control-btn"
                    >
                      Grow
                    </button>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={deleteSelected}
                  className="playground-control control-btn-danger"
                >
                  <Trash2 size={14} /> Remove Sticker
                </button>
              </div>
            ) : (
              <div className="control-card" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Click a sticker on the mockup canvas to edit its rotation, scale, or remove it.
              </div>
            )}
          </div>

          <div className="playground-actions-group">
            {playgroundStickers.length > 0 && (
              <>
                <button
                  onClick={onAddAllToCart}
                  className="btn-neon-yellow"
                  style={{ width: '100%', padding: '14px' }}
                >
                  <ShoppingCart size={16} /> Add All to Bag
                </button>
                <button
                  onClick={onClearPlayground}
                  className="btn-clear-canvas"
                  style={{ width: '100%' }}
                >
                  <RefreshCw size={14} /> Clear Canvas
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
