import React from 'react';
import { ArrowRight, Laptop } from 'lucide-react';

export default function Hero({ onShopNow, onPlaygroundClick, title, subtitle, marqueeText, mysteryStickerPrice }) {
  const defaultMarquee = [
    "⚡ WATERPROOF VINYL STICKERS",
    "🔥 5000+ PREMIUM DESIGNS",
    "🚛 FREE SHIPPING OVER ₹199",
    "💥 BUY 4 GET 1 FREE"
  ];
  const marqueeItems = Array(6).fill(marqueeText || defaultMarquee).flat();

  return (
    <section className="hero-section">
      {/* Announcement Marquee */}
      <div className="marquee-container">
        <div className="marquee-content">
          {marqueeItems.map((text, idx) => (
            <span key={idx}>
              {text} <span style={{ opacity: 0.3 }}>•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero Body */}
      <div className="container hero-body">
        {/* Glow Effects */}
        <div className="glow-ambient-1"></div>
        <div className="glow-ambient-2"></div>

        <div className="hero-badge">
          🔥 INDIA'S ULTIMATE SELF-EXPRESSION DESTINATION
        </div>

        <h1 className="hero-title" style={{ whiteSpace: 'pre-line' }}>
          {title || <>STICK. WEAR. <br /><span>EXPRESS YOURSELF</span></>}
        </h1>

        <p className="hero-subtitle">
          {subtitle || `Customize your laptop, water bottle, helmet, or smartphone with waterproof, scratch-resistant vinyl decals. Starting at just ₹29! Over 10 Lakh happy customers.`}
        </p>

        <div className="hero-buttons">
          <button 
            onClick={onShopNow}
            className="btn-neon-yellow"
          >
            Shop Stickers <ArrowRight size={16} />
          </button>
          
          <button 
            onClick={onPlaygroundClick}
            className="btn-neon-purple"
          >
            Sticker Playground <Laptop size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
