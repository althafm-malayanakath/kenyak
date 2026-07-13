import React from 'react';
import { Search, ShoppingBag } from 'lucide-react';
import Logo from './Logo';

export default function Navbar({ searchTerm, setSearchTerm, onCartClick, cartCount, onLogoClick }) {
  return (
    <nav className="navbar glass">
      <div className="container navbar-container">
        {/* Brand Logo */}
        <div className="navbar-logo" onClick={onLogoClick}>
          <Logo width="38px" style={{ marginRight: '6px' }} />
          <span className="logo-text">
            KENYAK<span style={{ color: 'var(--neon-yellow)' }}>.</span>
          </span>
        </div>

        {/* Search Bar (Desktop) */}
        <div className="navbar-search-wrapper">
          <input
            type="text"
            placeholder="Search anime, tech, meme stickers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="navbar-search-input"
          />
          <Search className="search-icon" size={16} />
        </div>

        {/* Right Controls */}
        <div className="navbar-actions">
          {/* Mobile Search Bar */}
          <div className="mobile-search-bar">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Cart Trigger */}
          <button 
            onClick={onCartClick}
            className="cart-toggle-btn"
            aria-label="Open Cart"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="cart-badge">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
