import React, { useState } from 'react';
import { Flame, Crown, Star, ArrowRight, Plus, Check, Zap, Sparkles } from 'lucide-react';

export default function DualBentoShowcase({ hotProducts = [], topSellers = [], onAddToCart, onExploreShop }) {
  const [addedId, setAddedId] = useState(null);

  const handleAdd = (product, e) => {
    e.stopPropagation();
    onAddToCart(product);
    setAddedId(product.id);
    setTimeout(() => {
      setAddedId((current) => (current === product.id ? null : current));
    }, 1200);
  };

  // Primary featured items
  const featuredHot = hotProducts[0];
  const miniHotItems = hotProducts.slice(1, 4);

  const featuredBestSeller = topSellers[0];
  const miniBestSellers = topSellers.slice(1, 4);

  return (
    <section id="bento-showcase-section" className="bento-showcase-section" style={{ scrollMarginTop: '80px' }}>
      <div className="container">
        
        {/* Master Showcase Section Header */}
        <div className="section-header-row" style={{ marginBottom: '28px' }}>
          <div className="section-title-wrapper">
            <span className="section-badge-bento">
              <Sparkles size={14} /> CURATED SHOWCASE
            </span>
            <h2>The Vault: Heat vs. Heritage</h2>
            <p>Compare this week's fastest-selling viral drops against our all-time battle-tested heavyweight decals.</p>
          </div>
          <button 
            onClick={() => onExploreShop('all')}
            className="section-view-all-btn"
          >
            Explore Complete Lab <ArrowRight size={14} />
          </button>
        </div>

        {/* 2-Column Responsive Bento Grid */}
        <div className="bento-grid-container">
          
          {/* ========================================================
              BENTO CARD 1: THE HEATWAVE (Trending & Viral Drops)
              ======================================================== */}
          <div className="bento-card bento-card-heatwave">
            {/* Ambient Background Aura */}
            <div className="bento-aura bento-aura-fire" />

            {/* Header Badge & Title */}
            <div className="bento-card-header">
              <div className="bento-live-badge bento-live-fire">
                <span className="live-pulse-dot fire-dot" />
                <Flame size={13} />
                <span>LIVE DROPS • HIGH DEMAND</span>
              </div>
              <h3 className="bento-title">The Heatwave</h3>
              <p className="bento-subtitle">
                Fresh drops and high-voltage holographic vinyl blowing up right now.
              </p>
            </div>

            {/* Featured Hero Item */}
            {featuredHot && (
              <div className="bento-hero-product">
                <div className="bento-hero-visual">
                  <div className="bento-img-glow fire-glow" />
                  <img 
                    src={featuredHot.image} 
                    alt={featuredHot.name}
                    className="bento-hero-img"
                    loading="lazy"
                  />
                  <span className="bento-floating-tag tag-fire">
                    <Zap size={11} /> {featuredHot.badge || 'HOT DROP'}
                  </span>
                </div>

                <div className="bento-hero-info">
                  <div className="bento-hero-meta">
                    <span className="bento-hero-category">{featuredHot.category?.toUpperCase() || 'VINYL'}</span>
                    <h4 className="bento-hero-name">{featuredHot.name}</h4>
                    <div className="bento-price-row">
                      <span className="bento-current-price">₹{featuredHot.price}</span>
                      {featuredHot.compareAtPrice && (
                        <span className="bento-old-price">₹{featuredHot.compareAtPrice}</span>
                      )}
                      <span className="bento-discount-badge">SAVE {Math.round(((featuredHot.compareAtPrice - featuredHot.price) / featuredHot.compareAtPrice) * 100)}%</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleAdd(featuredHot, e)}
                    className={`bento-hero-cta btn-fire ${addedId === featuredHot.id ? 'added' : ''}`}
                  >
                    {addedId === featuredHot.id ? (
                      <>
                        <Check size={16} /> Added to Bag
                      </>
                    ) : (
                      <>
                        <Plus size={16} /> Quick Add (₹{featuredHot.price})
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Mini Runner-ups list */}
            <div className="bento-mini-list">
              <span className="bento-mini-label">Trending Runner-Ups</span>
              <div className="bento-mini-items-grid">
                {miniHotItems.map((item) => (
                  <div key={item.id} className="bento-mini-card">
                    <div className="bento-mini-thumb-wrap">
                      <img src={item.image} alt={item.name} className="bento-mini-thumb" loading="lazy" />
                    </div>
                    <div className="bento-mini-details">
                      <span className="bento-mini-name" title={item.name}>{item.name}</span>
                      <div className="bento-mini-price-row">
                        <span className="bento-mini-price">₹{item.price}</span>
                        {item.badge && <span className="bento-mini-tag">{item.badge}</span>}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleAdd(item, e)}
                      className={`bento-mini-add-btn ${addedId === item.id ? 'added' : ''}`}
                      title={`Add ${item.name}`}
                      aria-label={`Add ${item.name}`}
                    >
                      {addedId === item.id ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Footer */}
            <div className="bento-footer">
              <button 
                onClick={() => onExploreShop('all')} 
                className="bento-footer-link link-fire"
              >
                <span>View all trending designs ({hotProducts.length})</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* ========================================================
              BENTO CARD 2: THE HALL OF FAME (All-Time Best Sellers)
              ======================================================== */}
          <div className="bento-card bento-card-heritage">
            {/* Ambient Background Aura */}
            <div className="bento-aura bento-aura-gold" />

            {/* Header Badge & Title */}
            <div className="bento-card-header">
              <div className="bento-live-badge bento-live-gold">
                <Crown size={13} />
                <span>4.9★ RATED • 1,200+ REVIEWS</span>
              </div>
              <h3 className="bento-title">The Hall of Fame</h3>
              <p className="bento-subtitle">
                All-time customer favorites battle-tested on laptops, flasks & helmets.
              </p>
            </div>

            {/* Featured Hero Item */}
            {featuredBestSeller && (
              <div className="bento-hero-product">
                <div className="bento-hero-visual">
                  <div className="bento-img-glow gold-glow" />
                  <img 
                    src={featuredBestSeller.image} 
                    alt={featuredBestSeller.name}
                    className="bento-hero-img"
                    loading="lazy"
                  />
                  <span className="bento-floating-tag tag-gold">
                    <Star size={11} fill="#facc15" color="#facc15" /> #1 BESTSELLER
                  </span>
                </div>

                <div className="bento-hero-info">
                  <div className="bento-hero-meta">
                    <div className="bento-rating-line">
                      <div className="bento-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill="#facc15" color="#facc15" />
                        ))}
                      </div>
                      <span className="bento-review-count">({featuredBestSeller.reviewCount || 312} verified reviews)</span>
                    </div>
                    <h4 className="bento-hero-name">{featuredBestSeller.name}</h4>
                    <div className="bento-price-row">
                      <span className="bento-current-price">₹{featuredBestSeller.price}</span>
                      {featuredBestSeller.compareAtPrice && (
                        <span className="bento-old-price">₹{featuredBestSeller.compareAtPrice}</span>
                      )}
                      <span className="bento-verified-quote">"Zero peeling after 6 months"</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleAdd(featuredBestSeller, e)}
                    className={`bento-hero-cta btn-gold ${addedId === featuredBestSeller.id ? 'added' : ''}`}
                  >
                    {addedId === featuredBestSeller.id ? (
                      <>
                        <Check size={16} /> Added to Bag
                      </>
                    ) : (
                      <>
                        <Plus size={16} /> Quick Add (₹{featuredBestSeller.price})
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Mini Runner-ups list */}
            <div className="bento-mini-list">
              <span className="bento-mini-label">All-Time Top Performers</span>
              <div className="bento-mini-items-grid">
                {miniBestSellers.map((item) => (
                  <div key={item.id} className="bento-mini-card">
                    <div className="bento-mini-thumb-wrap">
                      <img src={item.image} alt={item.name} className="bento-mini-thumb" loading="lazy" />
                    </div>
                    <div className="bento-mini-details">
                      <span className="bento-mini-name" title={item.name}>{item.name}</span>
                      <div className="bento-mini-price-row">
                        <span className="bento-mini-price">₹{item.price}</span>
                        <span className="bento-mini-star-rating">
                          <Star size={10} fill="#facc15" color="#facc15" /> {item.rating || 4.9}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleAdd(item, e)}
                      className={`bento-mini-add-btn ${addedId === item.id ? 'added' : ''}`}
                      title={`Add ${item.name}`}
                      aria-label={`Add ${item.name}`}
                    >
                      {addedId === item.id ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Footer */}
            <div className="bento-footer">
              <button 
                onClick={() => onExploreShop('all')} 
                className="bento-footer-link link-gold"
              >
                <span>Browse Hall of Fame collection ({topSellers.length})</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
