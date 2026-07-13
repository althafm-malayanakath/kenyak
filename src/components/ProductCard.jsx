import React from 'react';
import { Star, Plus } from 'lucide-react';

export default function ProductCard({ product, onAddToCart, onPlaygroundAdd }) {
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    // Cap rotation to 12 degrees
    const rotX = -(y / box.height) * 24;
    const rotY = (x / box.width) * 24;
    card.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  const discountPercent = Math.round(
    ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
  );

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="product-card"
    >
      {/* Product Image Panel */}
      <div className="card-image-wrapper">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="card-image"
        />

        {/* Badges */}
        <div className="card-badges-container">
          {product.badge && (
            <span className={`badge badge-${product.badgeColor || 'yellow'}`}>
              {product.badge}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="badge" style={{ backgroundColor: '#dc2626', color: 'white' }}>
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Playground Quick Add Link */}
        <button
          onClick={() => onPlaygroundAdd(product)}
          className="try-on-btn"
        >
          ⚡ Try on Laptop
        </button>
      </div>

      {/* Product Details Panel */}
      <div className="card-details-panel">
        <div>
          {/* Rating */}
          <div className="card-rating-row">
            <div className="stars-list">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={i < Math.floor(product.rating) ? 'star-filled' : 'star-empty'}
                />
              ))}
            </div>
            <span className="rating-score">
              {product.rating} ({product.reviewCount})
            </span>
          </div>

          <h3 className="card-title">
            {product.name}
          </h3>
        </div>

        <div>
          {/* Price & Cart CTA */}
          <div className="card-price-row">
            <div className="price-cols">
              <span className="price-original">
                ₹{product.compareAtPrice}
              </span>
              <span className="price-current">
                ₹{product.price}
              </span>
            </div>

            <button
              onClick={() => onAddToCart(product)}
              className="card-add-btn"
              title="Add to Cart"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
