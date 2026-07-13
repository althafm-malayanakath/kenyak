import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import StickerPlayground from './components/StickerPlayground';
import CheckoutModal from './components/CheckoutModal';
import Logo from './components/Logo';
import { PRODUCTS } from './data/products';
import { Mail, Instagram, Twitter, Phone } from 'lucide-react';

export default function App() {
  // Cart state persisted in localStorage
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('kenyak_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Playground state
  const [playgroundStickers, setPlaygroundStickers] = useState([]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal/Drawer controls
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Sync cart with localStorage
  useEffect(() => {
    localStorage.setItem('kenyak_cart', JSON.stringify(cart));
  }, [cart]);

  // Categories list
  const categories = [
    { id: 'all', label: 'All Designs' },
    { id: 'tech', label: 'Tech & Dev' },
    { id: 'anime', label: 'Anime & Waifu' },
    { id: 'meme', label: 'Pop Memes' },
    { id: 'skins', label: 'Laptop Skins' },
    { id: 'bumper', label: 'Reflective Bumper' }
  ];

  // Cart operations
  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    // Open cart drawer on successful add for immediate feedback
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveFromCart = (itemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Playground operations
  const handlePlaygroundAdd = (product) => {
    const newSticker = {
      id: Date.now() + Math.random(), // Unique instance id
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      x: 40 + Math.random() * 20, // Spawn near center
      y: 40 + Math.random() * 20,
      rotation: Math.floor(Math.random() * 40 - 20), // Slight angle
      scale: 1.0
    };
    setPlaygroundStickers((prev) => [...prev, newSticker]);
    
    // Smooth scroll to playground
    document.getElementById('playground-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRemoveSticker = (stickerId) => {
    setPlaygroundStickers((prev) => prev.filter((s) => s.id !== stickerId));
  };

  const handleUpdateSticker = (stickerId, updates) => {
    setPlaygroundStickers((prev) =>
      prev.map((s) => (s.id === stickerId ? { ...s, ...updates } : s))
    );
  };

  const handleClearPlayground = () => {
    setPlaygroundStickers([]);
  };

  const handleAddAllPlaygroundToCart = () => {
    playgroundStickers.forEach((sticker) => {
      // Find matching base product
      const baseProduct = PRODUCTS.find((p) => p.id === sticker.productId);
      if (baseProduct) {
        handleAddToCart(baseProduct);
      }
    });
    handleClearPlayground();
  };

  // Filtered product listing
  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Navigation scroll assists
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {/* Header */}
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onCartClick={() => setIsCartOpen(true)}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onLogoClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {/* Hero Display */}
      <Hero
        onShopNow={() => scrollToSection('shop-section')}
        onPlaygroundClick={() => scrollToSection('playground-section')}
      />

      {/* Interactive Playground Section */}
      <section id="playground-section" className="playground-section" style={{ scrollMarginTop: '80px' }}>
        <div className="container">
          <StickerPlayground
            playgroundStickers={playgroundStickers}
            onRemoveSticker={handleRemoveSticker}
            onUpdateSticker={handleUpdateSticker}
            onClearPlayground={handleClearPlayground}
            onAddAllToCart={handleAddAllPlaygroundToCart}
          />
        </div>
      </section>

      {/* Catalog Filters & Product Grid */}
      <section id="shop-section" className="catalog-section" style={{ scrollMarginTop: '80px', flex: '1' }}>
        <div className="container">
          
          <div className="catalog-header-row">
            <div className="catalog-title-wrapper">
              <span>🔥 THE STICKER LAB</span>
              <h2>Browse our catalog</h2>
            </div>

            {/* Category pills filter */}
            <div className="category-tabs">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid display */}
          {filteredProducts.length === 0 ? (
            <div className="empty-catalog-state">
              <p>No stickers matched your search</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                className="btn-neon-yellow"
                style={{ fontSize: '0.75rem', padding: '8px 16px', marginTop: '16px' }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onPlaygroundAdd={handlePlaygroundAdd}
                />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* Cart Drawer Overlay */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onAddToCart={handleAddToCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Multi-step Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onClearCart={handleClearCart}
      />

      {/* Streetwear Footer */}
      <footer className="footer">
        <div className="container footer-grid">
          
          {/* Logo & Description */}
          <div className="footer-column">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Logo width="34px" />
              <span className="footer-logo" style={{ marginBottom: 0 }}>
                KENYAK<span>.</span>
              </span>
            </div>
            <p className="footer-description">
              India's underground hub for premium self-expression. Compiling die-cut vinyl waterproof stickers for coders, gamers, anime stans, and pop culture rebels. 
            </p>
            <div className="social-links">
              <a href="#" className="social-link"><Instagram size={18} /></a>
              <a href="#" className="social-link"><Twitter size={18} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-column">
            <h4 className="footer-col-title">Quick Navigation</h4>
            <ul className="footer-links-list">
              <li><button onClick={() => scrollToSection('shop-section')}>Shop All Stickers</button></li>
              <li><button onClick={() => scrollToSection('playground-section')}>Interactive Playground</button></li>
              <li><a href="#">Support & Returns</a></li>
              <li><a href="#">Order Tracking</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="footer-column">
            <h4 className="footer-col-title">Contact & Support</h4>
            <ul className="footer-links-list">
              <li className="footer-contact-item"><Mail size={14} style={{ color: 'var(--neon-yellow)' }} /> wecare@kenyak.xyz</li>
              <li className="footer-contact-item"><Phone size={14} style={{ color: 'var(--neon-purple)' }} /> +91 75062 32907</li>
              <li className="footer-contact-item">
                R.T. Road, Behind Rajshree Cinema,<br />
                Dahisar East, Mumbai, MH - 400068.
              </li>
            </ul>
          </div>

          {/* Newsletter signup */}
          <div className="footer-column">
            <h4 className="footer-col-title">Join the Sticker Cult</h4>
            <p className="footer-newsletter-sub">
              Subscribe to get alerts on new drops, holographic editions, and exclusive coupon codes.
            </p>
            <div className="newsletter-form">
              <input
                type="email"
                placeholder="git-hacker@email.com"
              />
              <button className="newsletter-submit-btn">
                JOIN
              </button>
            </div>
          </div>

        </div>

        <div className="container footer-bottom">
          <span>&copy; {new Date().getFullYear()} KENYAK. Designed & manufactured in Mumbai, India.</span>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
