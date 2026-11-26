import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import StickerPlayground from './components/StickerPlayground';
import CheckoutModal from './components/CheckoutModal';
import Logo from './components/Logo';
import AdminPortal from './components/AdminPortal';
import { db, isFirebaseConfigured } from './firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { PRODUCTS } from './data/products';
import { Mail, Instagram, Twitter, Phone, Flame, Sparkles, ArrowRight, ChevronRight, Crown, Zap } from 'lucide-react';

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
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [lastFooterClick, setLastFooterClick] = useState(0);
  const [clickCount, setClickCount] = useState(0);

  const handleFooterClick = () => {
    const now = Date.now();
    if (now - lastFooterClick < 800) {
      const nextCount = clickCount + 1;
      setClickCount(nextCount);
      if (nextCount >= 4) { // 5 quick taps
        setIsAdminOpen(true);
        setClickCount(0);
      }
    } else {
      setClickCount(1);
    }
    setLastFooterClick(now);
  };

  // Dynamic Site Settings State
  const [siteSettings, setSiteSettings] = useState({
    heroTitle: "STICK. WEAR. \nEXPRESS YOURSELF",
    heroSubtitle: "Customize your laptop, water bottle, helmet, or smartphone with waterproof, scratch-resistant vinyl decals. Starting at just ₹29! Over 10 Lakh happy customers.",
    marqueeText: ["⚡ WATERPROOF VINYL STICKERS", "🔥 5000+ PREMIUM DESIGNS", "🚛 FREE SHIPPING OVER ₹199", "💥 BUY 4 GET 1 FREE"],
    contactEmail: "wecare@kenyak.xyz",
    contactPhone: "+91 75062 32907",
    contactAddress: "R.T. Road, Behind Rajshree Cinema, Dahisar East, Mumbai, MH - 400068.",
    freeShippingThreshold: 199,
    mysteryStickerPrice: 19,
    mysteryDecalPrice: 25
  });

  // Dynamic Products List State
  const [products, setProducts] = useState(PRODUCTS);

  // Sync cart with localStorage
  useEffect(() => {
    localStorage.setItem('kenyak_cart', JSON.stringify(cart));
  }, [cart]);

  // Keyboard shortcut listener (Ctrl+Shift+A) to open Admin Portal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAdminOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync Products & Settings from Firestore or LocalStorage fallback
  useEffect(() => {
    if (isFirebaseConfigured) {
      // 1. Live Sync Products collection
      const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
          items.push({ ...doc.data() });
        });
        if (items.length > 0) {
          items.sort((a, b) => a.id - b.id);
          setProducts(items);
        } else {
          setProducts(PRODUCTS);
        }
      }, (error) => {
        console.error("Firestore products connection error:", error);
      });

      // 2. Live Sync Settings config
      const docRef = doc(db, 'settings', 'config');
      const unsubscribeSettings = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          setSiteSettings(snapshot.data());
        }
      });

      return () => {
        unsubscribeProducts();
        unsubscribeSettings();
      };
    } else {
      // LocalStorage Fallback sync
      const savedProducts = localStorage.getItem('kenyak_products');
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      } else {
        setProducts(PRODUCTS);
      }

      const savedSettings = localStorage.getItem('kenyak_settings');
      if (savedSettings) {
        setSiteSettings(JSON.parse(savedSettings));
      }
    }
  }, []);

  // Save changes locally when firebase is not configured
  useEffect(() => {
    if (!isFirebaseConfigured) {
      localStorage.setItem('kenyak_products', JSON.stringify(products));
    }
  }, [products]);

  // Categories list
  const categories = [
    { id: 'all', label: 'All Designs' },
    { id: 'tech', label: 'Tech & Dev' },
    { id: 'anime', label: 'Anime & Waifu' },
    { id: 'meme', label: 'Pop Memes' },
    { id: 'skins', label: 'Laptop Skins' },
    { id: 'bumper', label: 'Reflective Bumper' }
  ];

  // Curated category Story Orbs (Clean & Professional Aesthetic)
  const categoryCards = [
    {
      id: 'all',
      title: 'All Designs',
      accentColor: 'var(--neon-yellow)',
      previewImage: '/stickers/WhatsApp Image 2026-07-13 at 3.25.11 PM (1).jpeg'
    },
    {
      id: 'tech',
      title: 'Tech & Dev',
      accentColor: '#38bdf8',
      previewImage: products.find(p => p.category === 'tech')?.image || '/stickers/WhatsApp Image 2026-07-13 at 3.27.41 PM.jpeg'
    },
    {
      id: 'anime',
      title: 'Anime & Waifu',
      accentColor: '#c084fc',
      previewImage: products.find(p => p.category === 'anime')?.image || '/stickers/WhatsApp Image 2026-07-13 at 3.25.11 PM.jpeg'
    },
    {
      id: 'meme',
      title: 'Pop Memes',
      accentColor: '#facc15',
      previewImage: products.find(p => p.category === 'meme')?.image || '/stickers/WhatsApp Image 2026-07-13 at 3.28.24 PM.jpeg'
    },
    {
      id: 'skins',
      title: 'Laptop Skins',
      accentColor: '#34d399',
      previewImage: products.find(p => p.category === 'skins')?.image || '/stickers/WhatsApp Image 2026-07-13 at 3.28.32 PM.jpeg'
    },
    {
      id: 'bumper',
      title: 'Reflective Decals',
      accentColor: '#fb7185',
      previewImage: products.find(p => p.category === 'bumper')?.image || '/stickers/WhatsApp Image 2026-07-13 at 3.28.44 PM.jpeg'
    }
  ];

  // 1. Hot Items selection (high-hype badges: HOT ITEM, TRENDING, NEW DROP, HOLOGRAPHIC, LIMITED, or top discounts)
  const hotBadges = ['HOT ITEM', 'TRENDING', 'NEW DROP', 'HOLOGRAPHIC', 'LIMITED', 'LIMITED DROP'];
  const hotProducts = products
    .filter(p => hotBadges.includes(p.badge) || (p.badge && p.badge.toLowerCase().includes('hot')) || (p.badge && p.badge.toLowerCase().includes('trend')))
    .slice(0, 8);

  if (hotProducts.length < 4) {
    const additional = [...products]
      .filter(p => !hotProducts.some(hp => hp.id === p.id))
      .sort((a, b) => ((b.compareAtPrice - b.price) / (b.compareAtPrice || 1)) - ((a.compareAtPrice - a.price) / (a.compareAtPrice || 1)))
      .slice(0, 8 - hotProducts.length);
    hotProducts.push(...additional);
  }

  // 2. Best Sellers selection (isBestSeller items, ensuring distinct picks from hotProducts for maximum variety)
  const hotIds = new Set(hotProducts.map(p => p.id));
  const distinctBestSellers = products.filter(p => p.isBestSeller && !hotIds.has(p.id));
  const topSellers = distinctBestSellers.length >= 4
    ? distinctBestSellers.slice(0, 8)
    : products.filter(p => p.isBestSeller).slice(0, 8);

  const handleCategoryCardClick = (catId) => {
    setSelectedCategory(catId);
    scrollToSection('shop-section');
  };

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
      const baseProduct = products.find((p) => p.id === sticker.productId);
      if (baseProduct) {
        handleAddToCart(baseProduct);
      }
    });
    handleClearPlayground();
  };

  // Filtered product listing
  const filteredProducts = products.filter((product) => {
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
        title={siteSettings.heroTitle}
        subtitle={siteSettings.heroSubtitle}
        marqueeText={siteSettings.marqueeText}
        mysteryStickerPrice={siteSettings.mysteryStickerPrice}
      />

      {/* 1. HOT ITEMS / TRENDING DROPS */}
      <section id="hot-items-section" className="hot-items-section" style={{ scrollMarginTop: '80px' }}>
        <div className="container">
          <div className="section-header-row">
            <div className="section-title-wrapper">
              <span className="section-badge-hot">
                <Flame size={14} /> TRENDING RIGHT NOW
              </span>
              <h2>Hot Drops & Viral Picks</h2>
              <p>High-voltage drops, viral holographic designs & fastest-selling vinyl stickers generating heat.</p>
            </div>
            <button 
              onClick={() => { setSelectedCategory('all'); scrollToSection('shop-section'); }}
              className="section-view-all-btn section-view-all-btn-hot"
            >
              Browse All ({products.length}) <ArrowRight size={14} />
            </button>
          </div>

          <div className="products-grid hot-items-grid">
            {hotProducts.map((product) => (
              <ProductCard
                key={`hot-${product.id}`}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. EXPLORE CATEGORIES (ROUNDED STORY RING ORBS - AUTO SCROLLING) */}
      <section id="categories-section" className="categories-story-section" style={{ scrollMarginTop: '80px' }}>
        <div className="container">
          <div className="section-header-row" style={{ marginBottom: '20px' }}>
            <div className="section-title-wrapper">
              <span className="section-badge-purple">
                <Sparkles size={14} /> CURATED DROPS
              </span>
              <h2>Explore Collections</h2>
              <p>Tap a universe to explore handpicked decals engineered for your laptops, bottles & rigs.</p>
            </div>
          </div>
        </div>

        {/* Story Ring Marquee Auto-Scroller with Edge Gradients */}
        <div className="story-orbs-marquee-wrapper">
          <div className="story-orbs-marquee-track">
            {[...categoryCards, ...categoryCards, ...categoryCards].map((cat, idx) => {
              const count = cat.id === 'all' 
                ? products.length 
                : products.filter(p => p.category === cat.id).length;
              const isActive = selectedCategory === cat.id;

              return (
                <button
                  key={`${cat.id}-${idx}`}
                  onClick={() => handleCategoryCardClick(cat.id)}
                  className={`story-orb-card ${isActive ? 'active' : ''}`}
                  style={{ 
                    '--orb-accent': cat.accentColor 
                  }}
                  title={`View ${cat.title} collection`}
                >
                  {/* Outer Refined Ring Bezel */}
                  <div className="story-ring-outer">
                    <div className="story-ring-border">
                      <div className="story-orb-inner">
                        <img 
                          src={cat.previewImage} 
                          alt={cat.title} 
                          className="story-sticker-img" 
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category Details Underneath */}
                  <div className="story-orb-meta">
                    <span className="story-orb-title">{cat.title}</span>
                    <span className="story-orb-count-pill">{count} Decals</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. BEST SELLERS / THE HALL OF FAME */}
      <section id="top-sellers-section" className="bestsellers-section" style={{ scrollMarginTop: '80px' }}>
        <div className="container">
          <div className="section-header-row">
            <div className="section-title-wrapper">
              <span className="section-badge-gold">
                <Crown size={14} /> ALL-TIME CHAMPIONS
              </span>
              <h2>The Hall of Fame</h2>
              <p>Our top-rated, battle-tested waterproof vinyl stickers loved by 1,000+ creators.</p>
            </div>
            <button 
              onClick={() => { setSelectedCategory('all'); scrollToSection('shop-section'); }}
              className="section-view-all-btn"
            >
              Browse All ({products.length}) <ArrowRight size={14} />
            </button>
          </div>

          <div className="products-grid bestsellers-grid">
            {topSellers.map((product) => (
              <ProductCard
                key={`bestseller-${product.id}`}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
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
        freeShippingThreshold={siteSettings.freeShippingThreshold}
        mysteryStickerPrice={siteSettings.mysteryStickerPrice}
        mysteryDecalPrice={siteSettings.mysteryDecalPrice}
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
        contactEmail={siteSettings.contactEmail}
        contactPhone={siteSettings.contactPhone}
        contactAddress={siteSettings.contactAddress}
      />

      {/* Admin Portal Dashboard Panel */}
      <AdminPortal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        localProducts={products}
        setLocalProducts={setProducts}
        siteSettings={siteSettings}
        setSiteSettings={setSiteSettings}
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
              <li><button onClick={() => scrollToSection('hot-items-section')}>🔥 Hot Drops</button></li>
              <li><button onClick={() => scrollToSection('categories-section')}>Explore Collections</button></li>
              <li><button onClick={() => scrollToSection('top-sellers-section')}>The Hall of Fame</button></li>
              <li><button onClick={() => scrollToSection('shop-section')}>Shop All Stickers</button></li>
              <li><a href="#">Support & Returns</a></li>
              <li><a href="#">Order Tracking</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="footer-column">
            <h4 className="footer-col-title">Contact & Support</h4>
            <ul className="footer-links-list">
              <li className="footer-contact-item"><Mail size={14} style={{ color: 'var(--neon-yellow)' }} /> {siteSettings.contactEmail}</li>
              <li className="footer-contact-item"><Phone size={14} style={{ color: 'var(--neon-purple)' }} /> {siteSettings.contactPhone}</li>
              <li className="footer-contact-item">
                {siteSettings.contactAddress}
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
          <span 
            onClick={handleFooterClick} 
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            &copy; {new Date().getFullYear()} KENYAK. Designed & manufactured in Mumbai, India.
          </span>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
