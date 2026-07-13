import React, { useState, useRef, useEffect } from 'react';
import { Trash2, RefreshCw, ShoppingCart, HelpCircle } from 'lucide-react';
import Logo from './Logo';

export default function StickerPlayground({ playgroundStickers, onRemoveSticker, onUpdateSticker, onClearPlayground, onAddAllToCart }) {
  const [selectedId, setSelectedId] = useState(null);
  const [activeDevice, setActiveDevice] = useState('laptop'); // 'laptop' or 'phone'
  const canvasRef = useRef(null);
  const dragInfoRef = useRef({ isDragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });

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

  const handleStartDrag = (e, stickerId) => {
    e.stopPropagation(); // Prevent document click handler from immediately deselecting
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
    if (!dragInfoRef.current.isDragging || selectedId === null) return;

    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;

    if (clientX === undefined || clientY === undefined) return;

    const deltaX = clientX - dragInfoRef.current.startX;
    const deltaY = clientY - dragInfoRef.current.startY;

    const canvasWidth = canvasRef.current.clientWidth;
    const canvasHeight = canvasRef.current.clientHeight;

    // Convert pixel delta to percentage delta
    const pctX = (deltaX / canvasWidth) * 100;
    const pctY = (deltaY / canvasHeight) * 100;

    let newX = dragInfoRef.current.startLeft + pctX;
    let newY = dragInfoRef.current.startTop + pctY;

    // Bound limits to keep sticker visible inside mock screen
    newX = Math.max(5, Math.min(newX, 85));
    newY = Math.max(5, Math.min(newY, 85));

    onUpdateSticker(selectedId, { x: newX, y: newY });
  };

  const handleEndDrag = () => {
    dragInfoRef.current.isDragging = false;
  };

  const handleCanvasStart = (e) => {
    // If they click the background canvas itself, deselect
    if (e.target === e.currentTarget || e.target.classList.contains('device-brand-logo')) {
      setSelectedId(null);
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
          <p>Drag, rotate, scale stickers. Preview before adding them to your laptop shell!</p>
        </div>

        {/* Device select buttons */}
        <div className="device-toggles">
          <button
            onClick={() => setActiveDevice('laptop')}
            className={`device-toggle-btn ${activeDevice === 'laptop' ? 'active' : ''}`}
          >
            Laptop Mockup
          </button>
          <button
            onClick={() => setActiveDevice('phone')}
            className={`device-toggle-btn ${activeDevice === 'phone' ? 'active' : ''}`}
          >
            Phone Mockup
          </button>
        </div>
      </div>

      {/* Grid Canvas Panel */}
      <div className="playground-grid">
        
        {/* Left canvas display */}
        <div className="canvas-wrapper">
          
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
            className={activeDevice === 'laptop' ? 'device-canvas-laptop' : 'device-canvas-phone'}
          >
            {/* Device Detail Markings */}
            <div className="mock-sheen-line"></div>
            {activeDevice === 'laptop' ? (
              <>
                <div className="mock-laptop-notch"></div>
                <div className="mock-laptop-logo">
                  <Logo width="44px" />
                </div>
                <div className="mock-laptop-hinge"></div>
              </>
            ) : (
              <>
                <div className="mock-phone-btn-volume-up"></div>
                <div className="mock-phone-btn-volume-down"></div>
                <div className="mock-phone-btn-power"></div>
                <div className="mock-phone-camera">
                  <div className="camera-lens"></div>
                  <div className="camera-lens"></div>
                  <div className="camera-lens small"></div>
                  <div className="camera-flash"></div>
                </div>
                <div className="mock-phone-logo">
                  <Logo width="30px" />
                </div>
              </>
            )}

            {/* Placed Stickers Layer */}
            {playgroundStickers.length === 0 && (
              <div className="canvas-placeholder-message">
                <HelpCircle size={36} style={{ color: 'var(--text-muted)' }} />
                <p>Your canvas is empty</p>
                <span>Click "⚡ Try on Laptop" on any sticker in the catalog below to place it here.</span>
              </div>
            )}

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
                  src={sticker.image}
                  alt={sticker.name}
                  draggable="false"
                  className="placed-sticker-img"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right controls side panel */}
        <div className="playground-controls">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="control-card-title">Playground Control Center</h3>

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
