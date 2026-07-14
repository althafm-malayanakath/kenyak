import React from 'react';
import { X, Trash2, Plus, Minus, Lock, ShoppingBag, Sparkles } from 'lucide-react';
import { MYSTERY_PRODUCTS } from '../data/products';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cart, 
  onUpdateQuantity, 
  onRemoveFromCart, 
  onAddToCart, 
  onCheckout,
  freeShippingThreshold = 199,
  mysteryStickerPrice = 19,
  mysteryDecalPrice = 25
}) {
  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const FREE_SHIPPING_THRESHOLD = freeShippingThreshold;
  const progressPercent = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remainingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  return (
    <div className="drawer-backdrop">
      <div className="drawer-panel">
        
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <ShoppingBag size={20} style={{ color: 'var(--neon-yellow)' }} />
            <h2>Your Bag</h2>
            <span className="drawer-item-count-badge">
              {cart.reduce((sum, i) => sum + i.quantity, 0)} Items
            </span>
          </div>
          <button 
            onClick={onClose}
            className="drawer-close-btn"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="drawer-body">
          {/* Free Shipping Progress Card */}
          <div className="shipping-progress-card">
            {remainingForFreeShipping > 0 ? (
              <div>
                <p className="progress-headline">
                  <span>🔒 Almost there!</span>
                  <span style={{ color: 'var(--neon-yellow)' }}>₹{remainingForFreeShipping} more</span>
                </p>
                <p className="progress-subtext">
                  Add just <strong>₹{remainingForFreeShipping}</strong> more to unlock FREE shipping & checkout!
                </p>
              </div>
            ) : (
              <div>
                <p className="progress-headline" style={{ color: 'var(--neon-yellow)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} />
                  <span>🎉 Free Shipping Unlocked!</span>
                </p>
                <p className="progress-subtext">
                  Awesome! Your order qualifies for free delivery across India.
                </p>
              </div>
            )}
            
            {/* Progress Track */}
            <div className="progress-track">
              <div 
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="empty-bag-view">
              <ShoppingBag size={48} className="empty-bag-icon" />
              <p>Your cart is empty.</p>
              <button 
                onClick={onClose}
                className="btn-neon-yellow"
                style={{ fontSize: '0.75rem', padding: '8px 16px' }}
              >
                Go Shop Stickers
              </button>
            </div>
          ) : (
            <div className="cart-items-scroller">
              {cart.map((item) => (
                <div key={item.id} className="cart-item-card">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="cart-item-img" 
                  />
                  <div className="cart-item-info">
                    <div>
                      <h4 className="cart-item-title">
                        {item.name}
                      </h4>
                      <p className="cart-item-price">
                        ₹{item.price} <span>₹{item.compareAtPrice || item.price * 2}</span>
                      </p>
                    </div>

                    <div className="cart-item-controls">
                      {/* Quantity Modifier */}
                      <div className="quantity-badge-modifier">
                        <button 
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="qty-btn"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="qty-number">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="qty-btn"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button 
                        onClick={() => onRemoveFromCart(item.id)}
                        className="item-delete-btn"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Cross-Sells (Upsells) */}
          {cart.length > 0 && (
            <div className="upsell-section">
              <h3>⚡ Quick Add Mystery Upgrades</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {MYSTERY_PRODUCTS.map((mystery) => {
                  const dynamicPrice = mystery.id === 101 ? mysteryStickerPrice : mysteryDecalPrice;
                  const dynamicMystery = { ...mystery, price: dynamicPrice, compareAtPrice: dynamicPrice * 2 };
                  return (
                    <div key={mystery.id} className="upsell-card">
                      <div className="upsell-left">
                        <div className="upsell-placeholder">?</div>
                        <div className="upsell-info">
                          <h4>{mystery.name}</h4>
                          <p className="upsell-price">
                            ₹{dynamicPrice} <span>₹{dynamicPrice * 2}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onAddToCart(dynamicMystery)}
                        className="upsell-add-btn"
                      >
                        + ADD
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Checkout Controls */}
        <div className="drawer-footer">
          <div className="footer-summary-row">
            <span className="summary-label">Bag Total:</span>
            <div className="summary-value">
              <h3>₹{subtotal}</h3>
              <p>Inclusive of all taxes</p>
            </div>
          </div>

          {remainingForFreeShipping > 0 ? (
            <button 
              disabled 
              className="checkout-btn checkout-btn-locked"
            >
              <Lock size={16} /> Locked (Add ₹{remainingForFreeShipping} more)
            </button>
          ) : (
            <button 
              onClick={onCheckout}
              className="checkout-btn checkout-btn-unlocked"
            >
              Checkout Now
            </button>
          )}

          <p className="drawer-disclaimer">
            By checking out, you agree to our Terms of Service & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
