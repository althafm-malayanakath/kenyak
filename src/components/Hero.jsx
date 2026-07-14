import React from 'react';
import { ArrowRight, Laptop } from 'lucide-react';

export default function Hero({ onShopNow, onPlaygroundClick, marqueeText }) {
  const defaultMarquee = [
    "⚡ WATERPROOF VINYL STICKERS",
    "🔥 5000+ PREMIUM DESIGNS",
    "🚛 FREE SHIPPING OVER ₹199",
    "💥 BUY 4 GET 1 FREE"
  ];
  const marqueeItems = Array(6).fill(marqueeText || defaultMarquee).flat();

  return (
    <section className="hero-section" style={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
      
      {/* Background Video */}
      <video 
        src="/vedios/WhatsApp Video 2026-07-13 at 9.11.02 PM.mp4" 
        autoPlay 
        loop 
        muted 
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 1
        }}
      />

      {/* Subtle Overlay to make sure buttons are clickable */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          zIndex: 2
        }}
      />

      {/* Announcement Marquee */}
      <div className="marquee-container" style={{ zIndex: 3, position: 'relative' }}>
        <div className="marquee-content">
          {marqueeItems.map((text, idx) => (
            <span key={idx}>
              {text} <span style={{ opacity: 0.3 }}>•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons Centered at Bottom */}
      <div className="container" style={{ zIndex: 3, position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: '40px' }}>
        <div className="hero-buttons">
          <button 
            onClick={onShopNow}
            className="btn-neon-yellow"
            style={{ minWidth: '180px' }}
          >
            Shop Stickers <ArrowRight size={16} />
          </button>
          
          <button 
            onClick={onPlaygroundClick}
            className="btn-neon-purple"
            style={{ minWidth: '220px' }}
          >
            Sticker Playground <Laptop size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
