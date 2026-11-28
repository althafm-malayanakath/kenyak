import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Lock, Unlock, LogOut, Plus, Edit2, Trash2, Copy, Save, 
  Upload, Search, Filter, Database, CloudLightning, Package, 
  ShoppingCart, Layers, Settings, Check, AlertCircle, Eye, 
  Download, RefreshCw, Star, Flame, Crown, ChevronDown, Sparkles,
  Phone, Mail, MapPin, Truck, ExternalLink
} from 'lucide-react';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { PRODUCTS } from '../data/products';

export default function AdminPortal({ isOpen, onClose, localProducts, setLocalProducts, siteSettings, setSiteSettings }) {
  // Session Authentication
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return sessionStorage.getItem('kenyak_admin_auth') === 'true';
  });
  const [errorMsg, setErrorMsg] = useState('');
  
  // Navigation Tabs: 'products' | 'orders' | 'sections' | 'copy' | 'cloud'
  const [activeTab, setActiveTab] = useState('products');
  
  // Toast notifications
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Product Catalog Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'bestseller', 'hot'
  
  // Product Add / Edit States
  const [editingProduct, setEditingProduct] = useState(null); // null = list view, object = editing
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    price: 39,
    compareAtPrice: 79,
    category: 'tech',
    isBestSeller: false,
    rating: 4.9,
    reviewCount: 45,
    badge: '',
    badgeColor: 'yellow',
    image: '',
    description: '',
    featuresText: '100% Waterproof Vinyl\nScratch & UV Resistant\nResidue-free removal'
  });

  // Orders State
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('kenyak_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Copy & Storefront Settings Form
  const [settingsForm, setSettingsForm] = useState({
    heroTitle: '',
    heroSubtitle: '',
    marqueeTextCsv: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    freeShippingThreshold: 199,
    mysteryStickerPrice: 19,
    mysteryDecalPrice: 25,
    hotSectionTitle: '',
    hotSectionSubtitle: '',
    bestsellerSectionTitle: '',
    bestsellerSectionSubtitle: '',
    categoriesSectionTitle: '',
    categoriesSectionSubtitle: ''
  });

  // Sync Logs
  const [syncLogs, setSyncLogs] = useState([]);
  const fileInputRef = useRef(null);
  const jsonImportRef = useRef(null);

  // Available stock sticker images
  const stickerImages = Array.from(new Set(PRODUCTS.map(p => p.image.replace('/stickers/', ''))));

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setSettingsForm({
        heroTitle: siteSettings.heroTitle || '',
        heroSubtitle: siteSettings.heroSubtitle || '',
        marqueeTextCsv: (siteSettings.marqueeText || []).join(', '),
        contactEmail: siteSettings.contactEmail || '',
        contactPhone: siteSettings.contactPhone || '',
        contactAddress: siteSettings.contactAddress || '',
        freeShippingThreshold: siteSettings.freeShippingThreshold || 199,
        mysteryStickerPrice: siteSettings.mysteryStickerPrice || 19,
        mysteryDecalPrice: siteSettings.mysteryDecalPrice || 25,
        hotSectionTitle: siteSettings.hotSectionTitle || 'Hot Drops & Viral Picks',
        hotSectionSubtitle: siteSettings.hotSectionSubtitle || 'High-voltage drops, viral holographic designs & fastest-selling vinyl stickers generating heat.',
        bestsellerSectionTitle: siteSettings.bestsellerSectionTitle || 'The Hall of Fame',
        bestsellerSectionSubtitle: siteSettings.bestsellerSectionSubtitle || 'Our top-rated, battle-tested waterproof vinyl stickers loved by 1,000+ creators.',
        categoriesSectionTitle: siteSettings.categoriesSectionTitle || 'Explore Collections',
        categoriesSectionSubtitle: siteSettings.categoriesSectionSubtitle || 'Tap a universe to explore handpicked decals engineered for your laptops, bottles & rigs.'
      });
      loadOrders();
    }
  }, [isOpen, siteSettings]);

  // Listen for real-time order events
  useEffect(() => {
    const handleNewOrder = () => loadOrders();
    window.addEventListener('kenyak_order_placed', handleNewOrder);
    return () => window.removeEventListener('kenyak_order_placed', handleNewOrder);
  }, []);

  const loadOrders = async () => {
    try {
      const local = JSON.parse(localStorage.getItem('kenyak_orders') || '[]');
      if (isFirebaseConfigured && db) {
        try {
          const snap = await getDocs(collection(db, 'orders'));
          const cloudOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          if (cloudOrders.length > 0) {
            // Merge unique orders
            const map = new Map();
            [...cloudOrders, ...local].forEach(o => map.set(o.id, o));
            const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            setOrders(merged);
            localStorage.setItem('kenyak_orders', JSON.stringify(merged));
            return;
          }
        } catch (fbErr) {
          console.warn("Firestore orders read warning:", fbErr);
        }
      }
      setOrders(local);
    } catch (e) {
      console.error("Error reading orders:", e);
    }
  };

  if (!isOpen) return null;

  // Authentication Handlers
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthorized(true);
      sessionStorage.setItem('kenyak_admin_auth', 'true');
      setErrorMsg('');
      showToast("Dashboard Unlocked! Welcome Admin 🚀");
    } else {
      setErrorMsg('Invalid admin password. Default is: admin123');
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    sessionStorage.removeItem('kenyak_admin_auth');
    setPassword('');
    showToast("Logged out of Admin Portal", "info");
  };

  // Image Upload & Canvas Compressor
  const handleImageFile = (file) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(25);

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadProgress(60);
      const img = new Image();
      img.onload = () => {
        // Compress using canvas to max 800px width/height for fast loading & Firestore friendliness
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const isPng = file.type === 'image/png';
        const dataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.85);

        setProductForm(prev => ({ ...prev, image: dataUrl }));
        setUploading(false);
        setUploadProgress(100);
        showToast("Image loaded and optimized!");
      };
      img.onerror = () => {
        setProductForm(prev => ({ ...prev, image: reader.result }));
        setUploading(false);
        setUploadProgress(100);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Product CRUD
  const handleEditClick = (product) => {
    setEditingProduct(product);
    setProductForm({
      id: product.id,
      name: product.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice || product.price * 2,
      category: product.category,
      isBestSeller: !!product.isBestSeller,
      rating: product.rating || 4.9,
      reviewCount: product.reviewCount || 25,
      badge: product.badge || '',
      badgeColor: product.badgeColor || 'yellow',
      image: product.image,
      description: product.description || '',
      featuresText: (product.features || []).join('\n')
    });
  };

  const handleAddClick = () => {
    setEditingProduct({ id: '' });
    setProductForm({
      id: '',
      name: '',
      price: 39,
      compareAtPrice: 79,
      category: 'tech',
      isBestSeller: false,
      rating: 4.9,
      reviewCount: 30,
      badge: 'NEW',
      badgeColor: 'yellow',
      image: '/stickers/' + (stickerImages[0] || 'WhatsApp Image 2026-07-13 at 3.25.11 PM (1).jpeg'),
      description: 'Ultra-durable die-cut vinyl waterproof sticker.',
      featuresText: "100% Waterproof Vinyl\nScratch & UV Resistant\nResidue-free removal"
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      alert("Please provide a name and price.");
      return;
    }

    const features = productForm.featuresText
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const formattedProduct = {
      name: productForm.name.trim(),
      price: Number(productForm.price),
      compareAtPrice: Number(productForm.compareAtPrice) || Number(productForm.price) * 2,
      category: productForm.category,
      isBestSeller: !!productForm.isBestSeller,
      rating: Number(productForm.rating) || 4.9,
      reviewCount: Number(productForm.reviewCount) || 15,
      badge: productForm.badge.trim(),
      badgeColor: productForm.badgeColor || 'yellow',
      image: productForm.image.trim(),
      description: productForm.description.trim(),
      features
    };

    if (isFirebaseConfigured && db) {
      try {
        if (editingProduct && editingProduct.id) {
          const docRef = doc(db, 'products', String(editingProduct.id));
          await setDoc(docRef, { ...formattedProduct, id: editingProduct.id });
        } else {
          const newId = Date.now();
          const docRef = doc(db, 'products', String(newId));
          await setDoc(docRef, { ...formattedProduct, id: newId });
        }
      } catch (err) {
        alert("Firestore error: " + err.message);
        return;
      }
    }

    // Local state update
    if (editingProduct && editingProduct.id) {
      setLocalProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...formattedProduct } : p));
      showToast("Sticker updated successfully!");
    } else {
      const newProduct = { ...formattedProduct, id: Date.now() };
      setLocalProducts(prev => [newProduct, ...prev]);
      showToast("New sticker created!");
    }

    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'products', String(id)));
      } catch (err) {
        alert("Firestore error: " + err.message);
        return;
      }
    }

    setLocalProducts(prev => prev.filter(p => p.id !== id));
    showToast(`Deleted "${name}"`, "info");
  };

  // Quick 1-Click Toggles
  const handleQuickToggleBestseller = async (productId, currentStatus) => {
    const newStatus = !currentStatus;
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'products', String(productId)), { isBestSeller: newStatus });
      } catch (e) {
        console.warn("Firestore update error:", e);
      }
    }
    setLocalProducts(prev => prev.map(p => p.id === productId ? { ...p, isBestSeller: newStatus } : p));
    showToast(newStatus ? "⭐ Added to Best Sellers" : "Removed from Best Sellers");
  };

  const handleQuickToggleHot = async (productId, currentBadge) => {
    const isCurrentlyHot = ['HOT ITEM', 'TRENDING', 'NEW DROP', 'HOLOGRAPHIC', 'LIMITED'].includes(currentBadge);
    const newBadge = isCurrentlyHot ? '' : 'HOT ITEM';
    const newColor = isCurrentlyHot ? '' : 'yellow';
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'products', String(productId)), { badge: newBadge, badgeColor: newColor });
      } catch (e) {
        console.warn("Firestore update error:", e);
      }
    }
    setLocalProducts(prev => prev.map(p => p.id === productId ? { ...p, badge: newBadge, badgeColor: newColor } : p));
    showToast(!isCurrentlyHot ? "🔥 Featured in Hot Drops" : "Removed from Hot Drops");
  };

  const handleDuplicateProduct = async (product) => {
    const newId = Date.now();
    const cloned = {
      ...product,
      id: newId,
      name: `${product.name} (Copy)`
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'products', String(newId)), cloned);
      } catch (e) {
        console.warn("Firestore clone error:", e);
      }
    }

    setLocalProducts(prev => [cloned, ...prev]);
    showToast("Sticker duplicated!");
  };

  // Order Management Handlers
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setOrders(updated);
    localStorage.setItem('kenyak_orders', JSON.stringify(updated));

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      } catch (e) {
        console.warn("Firestore order update error:", e);
      }
    }
    showToast(`Order #${orderId} marked as ${newStatus}`);
  };

  const handleDeleteOrder = async (orderId) => {
    if (!confirm(`Delete order #${orderId}?`)) return;
    const updated = orders.filter(o => o.id !== orderId);
    setOrders(updated);
    localStorage.setItem('kenyak_orders', JSON.stringify(updated));

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
      } catch (e) {
        console.warn("Firestore order delete error:", e);
      }
    }
    showToast("Order deleted", "info");
  };

  const handleCreateDemoOrder = () => {
    const demoId = `KN-${Math.floor(100000 + Math.random() * 900000)}`;
    const randomProduct = localProducts[Math.floor(Math.random() * localProducts.length)] || PRODUCTS[0];
    const demoOrder = {
      id: demoId,
      createdAt: new Date().toISOString(),
      shipping: {
        name: 'Aarav Sharma',
        phone: '9876543210',
        address: 'Flat 402, Sunshine Heights, Powai',
        city: 'Mumbai',
        pincode: '400076',
        state: 'Maharashtra'
      },
      paymentMethod: 'UPI',
      items: [
        {
          id: randomProduct.id,
          name: randomProduct.name,
          price: randomProduct.price,
          quantity: 2,
          image: randomProduct.image,
          category: randomProduct.category
        }
      ],
      subtotal: randomProduct.price * 2,
      shippingFee: 0,
      total: randomProduct.price * 2,
      status: 'Pending'
    };

    const updated = [demoOrder, ...orders];
    setOrders(updated);
    localStorage.setItem('kenyak_orders', JSON.stringify(updated));
    showToast("Demo Order Created!");
  };

  // Settings Save Handler
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const marqueeArray = settingsForm.marqueeTextCsv
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    const updatedSettings = {
      heroTitle: settingsForm.heroTitle,
      heroSubtitle: settingsForm.heroSubtitle,
      marqueeText: marqueeArray,
      contactEmail: settingsForm.contactEmail,
      contactPhone: settingsForm.contactPhone,
      contactAddress: settingsForm.contactAddress,
      freeShippingThreshold: Number(settingsForm.freeShippingThreshold) || 199,
      mysteryStickerPrice: Number(settingsForm.mysteryStickerPrice) || 19,
      mysteryDecalPrice: Number(settingsForm.mysteryDecalPrice) || 25,
      hotSectionTitle: settingsForm.hotSectionTitle,
      hotSectionSubtitle: settingsForm.hotSectionSubtitle,
      bestsellerSectionTitle: settingsForm.bestsellerSectionTitle,
      bestsellerSectionSubtitle: settingsForm.bestsellerSectionSubtitle,
      categoriesSectionTitle: settingsForm.categoriesSectionTitle,
      categoriesSectionSubtitle: settingsForm.categoriesSectionSubtitle
    };

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'settings', 'config');
        await setDoc(docRef, updatedSettings);
      } catch (err) {
        alert("Firestore error: " + err.message);
        return;
      }
    }

    setSiteSettings(updatedSettings);
    localStorage.setItem('kenyak_settings', JSON.stringify(updatedSettings));
    showToast("Storefront Settings Saved!");
  };

  // JSON Export / Backup
  const handleExportJSON = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      store: 'Kenyak Stickers',
      productsCount: localProducts.length,
      settings: siteSettings,
      products: localProducts,
      orders: orders
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kenyak-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Catalog backup downloaded! 📥");
  };

  // JSON Import / Restore
  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (Array.isArray(data.products) && data.products.length > 0) {
          if (!confirm(`Restore ${data.products.length} products from backup file?`)) return;

          setLocalProducts(data.products);
          localStorage.setItem('kenyak_products', JSON.stringify(data.products));

          if (data.settings) {
            setSiteSettings(data.settings);
            localStorage.setItem('kenyak_settings', JSON.stringify(data.settings));
          }

          if (isFirebaseConfigured && db) {
            const batch = writeBatch(db);
            data.products.forEach(p => {
              const docRef = doc(collection(db, 'products'), String(p.id));
              batch.set(docRef, p);
            });
            if (data.settings) {
              batch.set(doc(db, 'settings', 'config'), data.settings);
            }
            await batch.commit();
          }

          showToast("Data restored successfully!");
        } else {
          alert("Invalid backup file format: missing products array.");
        }
      } catch (err) {
        alert("JSON Parse error: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Reset to Factory Default 54 Stickers
  const handleResetToDefault = async () => {
    if (!confirm("Reset catalog back to the original 54 stock stickers? Any custom added stickers will be cleared.")) return;

    setLocalProducts(PRODUCTS);
    localStorage.setItem('kenyak_products', JSON.stringify(PRODUCTS));

    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        PRODUCTS.forEach(p => {
          const docRef = doc(collection(db, 'products'), String(p.id));
          batch.set(docRef, p);
        });
        await batch.commit();
      } catch (e) {
        console.warn("Firestore reset warning:", e);
      }
    }

    showToast("Catalog restored to factory defaults (54 stickers)!");
  };

  // Bootstrap Cloud Firestore
  const handleBootstrapFirestore = async () => {
    if (!isFirebaseConfigured || !db) {
      alert("Firebase is not connected in src/firebase.js.");
      return;
    }
    if (!confirm("Upload current catalog of products and settings to Firestore?")) return;

    setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Uploading ${localProducts.length} items to Firestore...`]);

    try {
      const batch = writeBatch(db);
      localProducts.forEach(p => {
        const docRef = doc(collection(db, 'products'), String(p.id));
        batch.set(docRef, p);
      });
      batch.set(doc(db, 'settings', 'config'), siteSettings);
      await batch.commit();
      setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ Firestore write successful!`]);
      showToast("Firestore synced!");
    } catch (err) {
      setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ❌ Error: ${err.message}`]);
    }
  };

  // Filter products for the list
  const filteredProducts = localProducts.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.badge || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

    let matchesStatus = true;
    if (statusFilter === 'bestseller') matchesStatus = !!product.isBestSeller;
    if (statusFilter === 'hot') {
      matchesStatus = ['HOT ITEM', 'TRENDING', 'NEW DROP', 'HOLOGRAPHIC', 'LIMITED'].includes(product.badge) || (product.badge && product.badge.toLowerCase().includes('hot'));
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const bestSellerCount = localProducts.filter(p => p.isBestSeller).length;
  const hotItemsCount = localProducts.filter(p => ['HOT ITEM', 'TRENDING', 'NEW DROP', 'HOLOGRAPHIC', 'LIMITED'].includes(p.badge)).length;

  return (
    <div className="admin-portal-backdrop" role="dialog" aria-modal="true">
      <div className="admin-portal-modal">
        
        {/* Toast Alert Banner */}
        {toast && (
          <div className={`admin-toast ${toast.type}`}>
            {toast.type === 'info' ? <AlertCircle size={16} /> : <Check size={16} />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="admin-header">
          <div className="admin-header-brand">
            <div className="admin-badge-icon">
              <Database size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="admin-title">Kenyak Admin Center</h2>
                {isFirebaseConfigured ? (
                  <span className="admin-status-badge cloud">CLOUD SYNCED</span>
                ) : (
                  <span className="admin-status-badge local">LOCAL STORAGE</span>
                )}
              </div>
              <p className="admin-subtitle">Store management, catalog pricing, and incoming customer orders</p>
            </div>
          </div>

          <div className="admin-header-actions">
            {isAuthorized && (
              <button onClick={handleLogout} className="admin-btn-ghost" title="Lock Console">
                <LogOut size={16} /> Logout
              </button>
            )}
            <button onClick={onClose} className="admin-close-btn" aria-label="Close Admin Center">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Lock Screen if unauthorized */}
        {!isAuthorized ? (
          <div className="admin-lock-screen">
            <div className="admin-lock-card">
              <div className="admin-lock-icon-wrap">
                <Lock size={32} />
              </div>
              <h3>Administrator Sign In</h3>
              <p>Enter the store password to unlock full management controls.</p>

              <form onSubmit={handleLogin}>
                <input
                  type="password"
                  placeholder="Enter admin password (admin123)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="admin-input-login"
                  autoFocus
                />
                {errorMsg && <div className="admin-login-error">{errorMsg}</div>}
                <button type="submit" className="admin-btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                  <Unlock size={16} /> Unlock Dashboard
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Main Dashboard Layout */
          <div className="admin-dashboard-container">
            
            {/* Top Navigation Bar */}
            <div className="admin-tab-nav">
              <button 
                onClick={() => { setActiveTab('products'); setEditingProduct(null); }}
                className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
              >
                <Package size={16} />
                <span>Stickers ({localProducts.length})</span>
              </button>

              <button 
                onClick={() => { setActiveTab('orders'); setEditingProduct(null); }}
                className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              >
                <ShoppingCart size={16} />
                <span>Orders ({orders.length})</span>
                {orders.filter(o => o.status === 'Pending').length > 0 && (
                  <span className="admin-tab-pill">{orders.filter(o => o.status === 'Pending').length} new</span>
                )}
              </button>

              <button 
                onClick={() => { setActiveTab('sections'); setEditingProduct(null); }}
                className={`admin-tab-btn ${activeTab === 'sections' ? 'active' : ''}`}
              >
                <Layers size={16} />
                <span>Sections & Copy</span>
              </button>

              <button 
                onClick={() => { setActiveTab('pricing'); setEditingProduct(null); }}
                className={`admin-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
              >
                <Settings size={16} />
                <span>Pricing & Contact</span>
              </button>

              <button 
                onClick={() => { setActiveTab('cloud'); setEditingProduct(null); }}
                className={`admin-tab-btn ${activeTab === 'cloud' ? 'active' : ''}`}
              >
                <CloudLightning size={16} />
                <span>Backup & Cloud</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="admin-content-scroll">
              
              {/* ============================================================== */}
              {/* TAB 1: STICKER PRODUCTS CATALOG                                */}
              {/* ============================================================== */}
              {activeTab === 'products' && (
                <>
                  {editingProduct === null ? (
                    <div className="admin-products-view">
                      
                      {/* Search & Action Bar */}
                      <div className="admin-toolbar">
                        <div className="admin-search-wrap">
                          <Search size={16} className="admin-search-icon" />
                          <input
                            type="text"
                            placeholder="Search stickers by name, badge, or keyword..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="admin-search-input"
                          />
                          {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="admin-search-clear">
                              <X size={14} />
                            </button>
                          )}
                        </div>

                        <div className="admin-toolbar-actions">
                          <button onClick={handleAddClick} className="admin-btn-primary">
                            <Plus size={16} /> Add New Sticker
                          </button>
                        </div>
                      </div>

                      {/* Filter Pills */}
                      <div className="admin-filters-bar">
                        <div className="admin-category-pills">
                          {[
                            { id: 'all', label: 'All Categories' },
                            { id: 'tech', label: 'Tech & Dev' },
                            { id: 'anime', label: 'Anime & Waifu' },
                            { id: 'meme', label: 'Pop Memes' },
                            { id: 'skins', label: 'Laptop Skins' },
                            { id: 'bumper', label: 'Reflective' }
                          ].map(c => (
                            <button
                              key={c.id}
                              onClick={() => setSelectedCategory(c.id)}
                              className={`admin-filter-pill ${selectedCategory === c.id ? 'active' : ''}`}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>

                        <div className="admin-flag-pills">
                          <button
                            onClick={() => setStatusFilter('all')}
                            className={`admin-status-pill ${statusFilter === 'all' ? 'active' : ''}`}
                          >
                            All ({localProducts.length})
                          </button>
                          <button
                            onClick={() => setStatusFilter('bestseller')}
                            className={`admin-status-pill ${statusFilter === 'bestseller' ? 'active' : ''}`}
                          >
                            ⭐ Bestsellers ({bestSellerCount})
                          </button>
                          <button
                            onClick={() => setStatusFilter('hot')}
                            className={`admin-status-pill ${statusFilter === 'hot' ? 'active' : ''}`}
                          >
                            🔥 Hot Drops ({hotItemsCount})
                          </button>
                        </div>
                      </div>

                      {/* Products List */}
                      {filteredProducts.length === 0 ? (
                        <div className="admin-empty-state">
                          <Package size={40} />
                          <h4>No stickers found</h4>
                          <p>Try resetting filters or search query.</p>
                          <button onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setStatusFilter('all'); }} className="admin-btn-secondary">
                            Reset Filters
                          </button>
                        </div>
                      ) : (
                        <div className="admin-products-table">
                          <div className="admin-table-head">
                            <span style={{ width: '60px' }}>Image</span>
                            <span style={{ flex: 2 }}>Sticker Details</span>
                            <span style={{ width: '100px' }}>Price</span>
                            <span style={{ width: '130px' }}>Showcase Flags</span>
                            <span style={{ width: '120px', textAlign: 'right' }}>Actions</span>
                          </div>

                          {filteredProducts.map(p => {
                            const isHot = ['HOT ITEM', 'TRENDING', 'NEW DROP', 'HOLOGRAPHIC', 'LIMITED'].includes(p.badge);
                            return (
                              <div key={p.id} className="admin-table-row">
                                <div className="admin-row-img-wrap">
                                  <img src={p.image} alt="" className="admin-row-thumb" loading="lazy" />
                                </div>

                                <div className="admin-row-details">
                                  <div className="admin-row-title-wrap">
                                    <h4 className="admin-row-name">{p.name}</h4>
                                    {p.badge && (
                                      <span className={`admin-badge-tag ${p.badgeColor || 'yellow'}`}>
                                        {p.badge}
                                      </span>
                                    )}
                                  </div>
                                  <div className="admin-row-meta">
                                    <span className="admin-category-badge">{p.category.toUpperCase()}</span>
                                    <span>★ {p.rating || 4.9} ({p.reviewCount || 10} reviews)</span>
                                  </div>
                                </div>

                                <div className="admin-row-price">
                                  <span className="admin-price-current">₹{p.price}</span>
                                  {p.compareAtPrice && p.compareAtPrice > p.price && (
                                    <span className="admin-price-original">₹{p.compareAtPrice}</span>
                                  )}
                                </div>

                                <div className="admin-row-flags">
                                  <button
                                    onClick={() => handleQuickToggleBestseller(p.id, p.isBestSeller)}
                                    className={`admin-toggle-btn ${p.isBestSeller ? 'active-gold' : ''}`}
                                    title={p.isBestSeller ? "Remove from Hall of Fame" : "Feature in Hall of Fame (Bestsellers)"}
                                  >
                                    <Crown size={13} /> {p.isBestSeller ? 'Bestseller' : '+ Bestseller'}
                                  </button>
                                  
                                  <button
                                    onClick={() => handleQuickToggleHot(p.id, p.badge)}
                                    className={`admin-toggle-btn ${isHot ? 'active-flame' : ''}`}
                                    title={isHot ? "Remove from Hot Drops" : "Feature in Hot Drops"}
                                  >
                                    <Flame size={13} /> {isHot ? 'Hot Item' : '+ Hot Item'}
                                  </button>
                                </div>

                                <div className="admin-row-actions">
                                  <button 
                                    onClick={() => handleEditClick(p)} 
                                    className="admin-action-btn edit" 
                                    title="Edit Sticker"
                                  >
                                    <Edit2 size={15} />
                                  </button>
                                  <button 
                                    onClick={() => handleDuplicateProduct(p)} 
                                    className="admin-action-btn copy" 
                                    title="Duplicate Sticker"
                                  >
                                    <Copy size={15} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteProduct(p.id, p.name)} 
                                    className="admin-action-btn delete" 
                                    title="Delete Sticker"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Add / Edit Form */
                    <div className="admin-form-container">
                      <div className="admin-form-header">
                        <h3>{productForm.id ? "Edit Sticker Details" : "Add New Sticker Drop"}</h3>
                        <button onClick={() => setEditingProduct(null)} className="admin-btn-ghost">
                          <X size={16} /> Back to Catalog
                        </button>
                      </div>

                      <div className="admin-form-split">
                        
                        {/* Left: Input Form */}
                        <form onSubmit={handleSaveProduct} className="admin-form-fields">
                          
                          <div className="admin-field-group">
                            <label className="admin-label">Sticker Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Cyber Shogun Warrior Decal"
                              value={productForm.name}
                              onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                              className="admin-text-input"
                            />
                          </div>

                          <div className="admin-form-row two-col">
                            <div className="admin-field-group">
                              <label className="admin-label">Category *</label>
                              <select
                                value={productForm.category}
                                onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                                className="admin-select-input"
                              >
                                <option value="tech">Tech & Dev</option>
                                <option value="anime">Anime & Waifu</option>
                                <option value="meme">Pop Memes</option>
                                <option value="skins">Laptop Skins</option>
                                <option value="bumper">Reflective Bumper</option>
                              </select>
                            </div>

                            <div className="admin-field-group">
                              <label className="admin-label">Badge Label (Optional)</label>
                              <input
                                type="text"
                                placeholder="e.g. HOT, NEW, HOLOGRAPHIC"
                                value={productForm.badge}
                                onChange={(e) => setProductForm(prev => ({ ...prev, badge: e.target.value }))}
                                className="admin-text-input"
                              />
                            </div>
                          </div>

                          <div className="admin-form-row two-col">
                            <div className="admin-field-group">
                              <label className="admin-label">Selling Price (₹) *</label>
                              <input
                                type="number"
                                required
                                min="1"
                                value={productForm.price}
                                onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                                className="admin-text-input"
                              />
                            </div>

                            <div className="admin-field-group">
                              <label className="admin-label">Original Price (₹)</label>
                              <input
                                type="number"
                                min="1"
                                placeholder="e.g. 79"
                                value={productForm.compareAtPrice}
                                onChange={(e) => setProductForm(prev => ({ ...prev, compareAtPrice: e.target.value }))}
                                className="admin-text-input"
                              />
                            </div>
                          </div>

                          {/* Image Selector & Uploader */}
                          <div className="admin-field-group admin-upload-box">
                            <label className="admin-label">Sticker Artwork (Image/Video)</label>
                            
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                              <select
                                value={productForm.image.startsWith('/stickers/') ? productForm.image.replace('/stickers/', '') : ''}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    setProductForm(prev => ({ ...prev, image: `/stickers/${e.target.value}` }));
                                  }
                                }}
                                className="admin-select-input"
                                style={{ flex: 1 }}
                              >
                                <option value="">-- Pick from 54 Stock Sticker Assets --</option>
                                {stickerImages.map(img => (
                                  <option key={img} value={img}>{img}</option>
                                ))}
                              </select>
                              
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="admin-btn-secondary"
                              >
                                <Upload size={14} /> Upload Custom
                              </button>
                              <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => handleImageFile(e.target.files[0])}
                                accept="image/*,video/*"
                                style={{ display: 'none' }}
                              />
                            </div>

                            <input
                              type="text"
                              placeholder="Or paste direct image URL or Base64 data:image URL..."
                              value={productForm.image}
                              onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                              className="admin-text-input"
                            />

                            {uploading && (
                              <div className="admin-progress-bar">
                                <div className="admin-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                              </div>
                            )}
                          </div>

                          {/* Merchandising Toggles */}
                          <div className="admin-form-row two-col" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <label className="admin-checkbox-label">
                              <input
                                type="checkbox"
                                checked={productForm.isBestSeller}
                                onChange={(e) => setProductForm(prev => ({ ...prev, isBestSeller: e.target.checked }))}
                              />
                              <span>⭐ Feature in <strong>Hall of Fame (Bestsellers)</strong></span>
                            </label>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <label className="admin-label" style={{ margin: 0 }}>Badge Style:</label>
                              <select
                                value={productForm.badgeColor}
                                onChange={(e) => setProductForm(prev => ({ ...prev, badgeColor: e.target.value }))}
                                className="admin-select-input"
                                style={{ width: '130px', padding: '6px' }}
                              >
                                <option value="yellow">Amber / Orange</option>
                                <option value="purple">Neon Purple</option>
                                <option value="cyan">Neon Cyan</option>
                              </select>
                            </div>
                          </div>

                          <div className="admin-field-group">
                            <label className="admin-label">Product Description</label>
                            <textarea
                              rows={2}
                              value={productForm.description}
                              onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                              className="admin-text-input"
                              placeholder="Describe material, vibe, and application..."
                            />
                          </div>

                          <div className="admin-field-group">
                            <label className="admin-label">Bullet Features / Specs (1 per line)</label>
                            <textarea
                              rows={3}
                              value={productForm.featuresText}
                              onChange={(e) => setProductForm(prev => ({ ...prev, featuresText: e.target.value }))}
                              className="admin-text-input"
                            />
                          </div>

                          <div className="admin-form-actions">
                            <button type="submit" className="admin-btn-primary">
                              <Save size={16} /> Save Sticker to Catalog
                            </button>
                            <button type="button" onClick={() => setEditingProduct(null)} className="admin-btn-secondary">
                              Cancel
                            </button>
                          </div>
                        </form>

                        {/* Right: Live Preview Box */}
                        <div className="admin-preview-col">
                          <span className="admin-preview-label">Live Storefront Card Preview</span>
                          <div className="admin-mock-card">
                            <div className="admin-mock-img-box">
                              {productForm.image ? (
                                <img src={productForm.image} alt={productForm.name} className="admin-mock-sticker" />
                              ) : (
                                <div className="admin-mock-placeholder">No Image Selected</div>
                              )}
                              {productForm.badge && (
                                <span className={`badge badge-${productForm.badgeColor || 'yellow'}`} style={{ position: 'absolute', top: '10px', left: '10px' }}>
                                  {productForm.badge}
                                </span>
                              )}
                            </div>

                            <div className="admin-mock-body">
                              <span className="admin-category-badge">{productForm.category.toUpperCase()}</span>
                              <h4 style={{ margin: '6px 0 4px 0', fontSize: '1rem', color: '#fff' }}>
                                {productForm.name || 'Untitled Sticker'}
                              </h4>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 10px 0' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--neon-yellow)' }}>₹{productForm.price}</span>
                                {productForm.compareAtPrice && Number(productForm.compareAtPrice) > Number(productForm.price) && (
                                  <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    ₹{productForm.compareAtPrice}
                                  </span>
                                )}
                              </div>

                              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                {productForm.description || 'Sticker description will appear here on your customer store.'}
                              </p>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ============================================================== */}
              {/* TAB 2: INCOMING ORDERS                                         */}
              {/* ============================================================== */}
              {activeTab === 'orders' && (
                <div className="admin-orders-view">
                  
                  {/* Orders Toolbar */}
                  <div className="admin-toolbar">
                    <div className="admin-status-filters">
                      {['all', 'Pending', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
                        <button
                          key={s}
                          onClick={() => setOrderStatusFilter(s)}
                          className={`admin-filter-pill ${orderStatusFilter === s ? 'active' : ''}`}
                        >
                          {s === 'all' ? `All Orders (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
                        </button>
                      ))}
                    </div>

                    <button onClick={handleCreateDemoOrder} className="admin-btn-secondary" style={{ fontSize: '0.75rem' }}>
                      <Plus size={14} /> Generate Test Order
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="admin-empty-state">
                      <ShoppingCart size={40} />
                      <h4>No orders placed yet</h4>
                      <p>When customers complete checkout via COD or UPI, orders appear here automatically.</p>
                      <button onClick={handleCreateDemoOrder} className="admin-btn-primary" style={{ marginTop: '12px' }}>
                        Generate Sample Customer Order
                      </button>
                    </div>
                  ) : (
                    <div className="admin-orders-list">
                      {orders
                        .filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter)
                        .map(order => (
                          <div key={order.id} className="admin-order-card">
                            
                            <div className="admin-order-header">
                              <div>
                                <span className="admin-order-id">#{order.id}</span>
                                <span className="admin-order-date">
                                  {order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent'}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <select
                                  value={order.status || 'Pending'}
                                  onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                  className={`admin-status-dropdown ${order.status?.toLowerCase() || 'pending'}`}
                                >
                                  <option value="Pending">Pending (Processing)</option>
                                  <option value="Shipped">Shipped (In Transit)</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                                <button onClick={() => handleDeleteOrder(order.id)} className="admin-action-btn delete" title="Delete Order">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            <div className="admin-order-grid">
                              {/* Customer Details */}
                              <div className="admin-order-col">
                                <span className="admin-order-col-title">Customer & Delivery Details</span>
                                <div className="admin-order-info-line">
                                  <strong>{order.shipping?.name || 'Customer'}</strong>
                                </div>
                                <div className="admin-order-info-line">
                                  <Phone size={13} style={{ color: 'var(--neon-cyan)' }} />
                                  <a href={`tel:${order.shipping?.phone}`} style={{ color: '#fff', textDecoration: 'none' }}>
                                    {order.shipping?.phone}
                                  </a>
                                  {order.shipping?.phone && (
                                    <a 
                                      href={`https://wa.me/91${order.shipping.phone.replace(/\D/g,'')}?text=Hi%20${encodeURIComponent(order.shipping.name || '')},%20regarding%20your%20Kenyak%20Stickers%20Order%20%23${order.id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="admin-whatsapp-btn"
                                      title="Open WhatsApp Chat"
                                    >
                                      Chat on WhatsApp
                                    </a>
                                  )}
                                </div>
                                <div className="admin-order-info-line">
                                  <MapPin size={13} style={{ color: 'var(--neon-purple)', flexShrink: 0 }} />
                                  <span>
                                    {order.shipping?.address}, {order.shipping?.city} - {order.shipping?.pincode} ({order.shipping?.state})
                                  </span>
                                </div>
                                <div className="admin-order-info-line" style={{ marginTop: '4px' }}>
                                  <Truck size={13} style={{ color: 'var(--neon-yellow)' }} />
                                  <span>Payment: <strong>{order.paymentMethod || 'UPI'}</strong></span>
                                </div>
                              </div>

                              {/* Purchased Items */}
                              <div className="admin-order-col">
                                <span className="admin-order-col-title">Ordered Stickers ({(order.items || []).length})</span>
                                <div className="admin-order-items-list">
                                  {(order.items || []).map((item, idx) => (
                                    <div key={idx} className="admin-order-item-row">
                                      <img src={item.image} alt="" className="admin-order-item-thumb" />
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Qty: {item.quantity} × ₹{item.price}</div>
                                      </div>
                                      <div style={{ fontWeight: '800', color: 'var(--neon-yellow)' }}>
                                        ₹{(item.price || 0) * (item.quantity || 1)}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="admin-order-total-bar">
                                  <span>Grand Total:</span>
                                  <span style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--neon-yellow)' }}>
                                    ₹{order.total}
                                  </span>
                                </div>
                              </div>
                            </div>

                          </div>
                        ))}
                    </div>
                  )}

                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 3: STOREFRONT SECTIONS & COPY                              */}
              {/* ============================================================== */}
              {activeTab === 'sections' && (
                <form onSubmit={handleSaveSettings} className="admin-settings-form">
                  <div className="admin-section-block">
                    <h4>🔥 "Hot Items" Section Controls</h4>
                    <p>Customize the headline and description above your Hot Drops grid.</p>
                    
                    <div className="admin-field-group">
                      <label className="admin-label">Section Title</label>
                      <input
                        type="text"
                        value={settingsForm.hotSectionTitle}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, hotSectionTitle: e.target.value }))}
                        className="admin-text-input"
                      />
                    </div>
                    <div className="admin-field-group">
                      <label className="admin-label">Section Subtitle</label>
                      <textarea
                        rows={2}
                        value={settingsForm.hotSectionSubtitle}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, hotSectionSubtitle: e.target.value }))}
                        className="admin-text-input"
                      />
                    </div>
                  </div>

                  <div className="admin-section-block">
                    <h4>👑 "Best Sellers / Hall of Fame" Section Controls</h4>
                    <p>Customize the headline and description above your all-time customer favorites.</p>
                    
                    <div className="admin-field-group">
                      <label className="admin-label">Section Title</label>
                      <input
                        type="text"
                        value={settingsForm.bestsellerSectionTitle}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, bestsellerSectionTitle: e.target.value }))}
                        className="admin-text-input"
                      />
                    </div>
                    <div className="admin-field-group">
                      <label className="admin-label">Section Subtitle</label>
                      <textarea
                        rows={2}
                        value={settingsForm.bestsellerSectionSubtitle}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, bestsellerSectionSubtitle: e.target.value }))}
                        className="admin-text-input"
                      />
                    </div>
                  </div>

                  <div className="admin-section-block">
                    <h4>🌀 "Category Story Orbs" Section Controls</h4>
                    <p>Customize the headline and description above the auto-scrolling category bubbles.</p>
                    
                    <div className="admin-field-group">
                      <label className="admin-label">Section Title</label>
                      <input
                        type="text"
                        value={settingsForm.categoriesSectionTitle}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, categoriesSectionTitle: e.target.value }))}
                        className="admin-text-input"
                      />
                    </div>
                    <div className="admin-field-group">
                      <label className="admin-label">Section Subtitle</label>
                      <textarea
                        rows={2}
                        value={settingsForm.categoriesSectionSubtitle}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, categoriesSectionSubtitle: e.target.value }))}
                        className="admin-text-input"
                      />
                    </div>
                  </div>

                  <div className="admin-section-block">
                    <h4>⚡ Hero Banner & Sliding Marquee</h4>
                    
                    <div className="admin-field-group">
                      <label className="admin-label">Hero Title (Use newline for second line)</label>
                      <textarea
                        rows={2}
                        value={settingsForm.heroTitle}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, heroTitle: e.target.value }))}
                        className="admin-text-input"
                      />
                    </div>
                    <div className="admin-field-group">
                      <label className="admin-label">Hero Subtitle</label>
                      <textarea
                        rows={2}
                        value={settingsForm.heroSubtitle}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                        className="admin-text-input"
                      />
                    </div>
                    <div className="admin-field-group">
                      <label className="admin-label">Sliding Marquee Promo Items (Separated by comma)</label>
                      <input
                        type="text"
                        value={settingsForm.marqueeTextCsv}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, marqueeTextCsv: e.target.value }))}
                        className="admin-text-input"
                      />
                    </div>
                  </div>

                  <button type="submit" className="admin-btn-primary" style={{ padding: '12px 24px' }}>
                    <Save size={16} /> Save All Storefront Copy
                  </button>
                </form>
              )}

              {/* ============================================================== */}
              {/* TAB 4: PRICING, SHIPPING & CONTACT                             */}
              {/* ============================================================== */}
              {activeTab === 'pricing' && (
                <form onSubmit={handleSaveSettings} className="admin-settings-form">
                  <div className="admin-section-block">
                    <h4>🏷️ Pricing Thresholds & Mystery Upgrades</h4>
                    <p>Adjust the free shipping threshold and the cart drawer mystery upsell prices.</p>

                    <div className="admin-form-row three-col">
                      <div className="admin-field-group">
                        <label className="admin-label">Free Shipping Minimum (₹)</label>
                        <input
                          type="number"
                          value={settingsForm.freeShippingThreshold}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, freeShippingThreshold: e.target.value }))}
                          className="admin-text-input"
                        />
                      </div>
                      <div className="admin-field-group">
                        <label className="admin-label">Mystery Sticker Price (₹)</label>
                        <input
                          type="number"
                          value={settingsForm.mysteryStickerPrice}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, mysteryStickerPrice: e.target.value }))}
                          className="admin-text-input"
                        />
                      </div>
                      <div className="admin-field-group">
                        <label className="admin-label">Mystery Decal Price (₹)</label>
                        <input
                          type="number"
                          value={settingsForm.mysteryDecalPrice}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, mysteryDecalPrice: e.target.value }))}
                          className="admin-text-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="admin-section-block">
                    <h4>📞 Brand Contact & Footer Info</h4>
                    <p>Customer support contact details shown in the footer and checkout modal.</p>

                    <div className="admin-form-row two-col">
                      <div className="admin-field-group">
                        <label className="admin-label">Support Email</label>
                        <input
                          type="email"
                          value={settingsForm.contactEmail}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                          className="admin-text-input"
                        />
                      </div>
                      <div className="admin-field-group">
                        <label className="admin-label">Support Phone / WhatsApp</label>
                        <input
                          type="text"
                          value={settingsForm.contactPhone}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                          className="admin-text-input"
                        />
                      </div>
                    </div>

                    <div className="admin-field-group">
                      <label className="admin-label">Physical Office / Dispatch Address</label>
                      <input
                        type="text"
                        value={settingsForm.contactAddress}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, contactAddress: e.target.value }))}
                        className="admin-text-input"
                      />
                    </div>
                  </div>

                  <button type="submit" className="admin-btn-primary" style={{ padding: '12px 24px' }}>
                    <Save size={16} /> Save Pricing & Contact Settings
                  </button>
                </form>
              )}

              {/* ============================================================== */}
              {/* TAB 5: BACKUP, RESTORE & CLOUD                                 */}
              {/* ============================================================== */}
              {activeTab === 'cloud' && (
                <div className="admin-settings-form">
                  
                  {/* Database Status */}
                  <div className="admin-section-block">
                    <h4>☁️ Cloud Connection & Status</h4>
                    {isFirebaseConfigured ? (
                      <div className="admin-alert-box success">
                        <Check size={18} />
                        <div>
                          <strong>Firebase Cloud Firestore is Active!</strong>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem' }}>Every product, price change, and order placed writes live to your Firestore cloud instance.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="admin-alert-box warning">
                        <AlertCircle size={18} />
                        <div>
                          <strong>Operating in High-Reliability Local Storage Mode.</strong>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem' }}>Changes persist in this browser. You can export a JSON backup at any time or connect Firebase keys in `src/firebase.js`.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 1-Click Backup & Restore */}
                  <div className="admin-section-block">
                    <h4>📥 Full Catalog Backup & Migration</h4>
                    <p>Export your full database to a JSON file or restore from a previously exported backup.</p>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                      <button onClick={handleExportJSON} className="admin-btn-primary">
                        <Download size={16} /> Download Catalog Backup (.json)
                      </button>

                      <button onClick={() => jsonImportRef.current?.click()} className="admin-btn-secondary">
                        <Upload size={16} /> Restore from Backup (.json)
                      </button>
                      <input
                        type="file"
                        ref={jsonImportRef}
                        onChange={handleImportJSON}
                        accept=".json,application/json"
                        style={{ display: 'none' }}
                      />

                      <button onClick={handleResetToDefault} className="admin-btn-ghost" style={{ color: '#f87171' }}>
                        <RefreshCw size={14} /> Reset to Factory 54 Stickers
                      </button>
                    </div>
                  </div>

                  {/* Firestore Cloud Bootstrap */}
                  <div className="admin-section-block">
                    <h4>⚡ Cloud Database Initialization</h4>
                    <p>Upload current products and site configuration to your Firebase Firestore cloud database in one click.</p>
                    
                    <button 
                      onClick={handleBootstrapFirestore} 
                      disabled={!isFirebaseConfigured}
                      className="admin-btn-secondary"
                      style={{ opacity: isFirebaseConfigured ? 1 : 0.5, marginTop: '8px' }}
                    >
                      <CloudLightning size={16} /> Sync Current Products to Firestore
                    </button>

                    {syncLogs.length > 0 && (
                      <div className="admin-sync-console">
                        {syncLogs.map((log, idx) => (
                          <div key={idx}>{log}</div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
