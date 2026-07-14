import React, { useState, useEffect } from 'react';
import { X, Lock, Plus, Edit2, Trash2, Save, CloudLightning, Database, Upload } from 'lucide-react';
import { db, storage, isFirebaseConfigured } from '../firebase';
import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { PRODUCTS } from '../data/products';

export default function AdminPortal({ isOpen, onClose, localProducts, setLocalProducts, siteSettings, setSiteSettings }) {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'content', 'firebase'
  const [errorMsg, setErrorMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form states
  const [editingProduct, setEditingProduct] = useState(null); // null means adding or viewing list
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    price: 39,
    compareAtPrice: 79,
    category: 'tech',
    isBestSeller: false,
    rating: 4.8,
    reviewCount: 50,
    badge: '',
    badgeColor: '',
    image: '',
    description: '',
    featuresText: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    heroTitle: '',
    heroSubtitle: '',
    marqueeTextCsv: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    freeShippingThreshold: 199,
    mysteryStickerPrice: 19,
    mysteryDecalPrice: 25
  });

  const [syncLogs, setSyncLogs] = useState([]);

  // Initial list of available images (known 54 files)
  const stickerImages = Array.from(new Set(PRODUCTS.map(p => p.image.replace('/stickers/', ''))));

  useEffect(() => {
    if (isOpen) {
      // Load current settings into form
      setSettingsForm({
        heroTitle: siteSettings.heroTitle || '',
        heroSubtitle: siteSettings.heroSubtitle || '',
        marqueeTextCsv: (siteSettings.marqueeText || []).join(', '),
        contactEmail: siteSettings.contactEmail || '',
        contactPhone: siteSettings.contactPhone || '',
        contactAddress: siteSettings.contactAddress || '',
        freeShippingThreshold: siteSettings.freeShippingThreshold || 199,
        mysteryStickerPrice: siteSettings.mysteryStickerPrice || 19,
        mysteryDecalPrice: siteSettings.mysteryDecalPrice || 25
      });
      setErrorMsg('');
    }
  }, [isOpen, siteSettings]);

  if (!isOpen) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthorized(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Invalid admin password.');
    }
  };

  // Upload file (Image or Video) to Firebase Storage or local base64 fallback
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isFirebaseConfigured) {
      // Offline fallback: load as base64 data URL
      const reader = new FileReader();
      reader.onloadstart = () => {
        setUploading(true);
        setUploadProgress(10);
      };
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };
      reader.onloadend = () => {
        setProductForm(prev => ({ ...prev, image: reader.result }));
        setUploading(false);
        setUploadProgress(0);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Cloud upload to Firebase Storage
    setUploading(true);
    setUploadProgress(0);

    const storageRef = ref(storage, `stickers/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(progress);
      }, 
      (error) => {
        console.warn("Firebase Storage is locked or requires Blaze plan. Falling back to inline Base64 database storage:", error);
        const reader = new FileReader();
        reader.onloadstart = () => {
          setUploadProgress(50);
        };
        reader.onloadend = () => {
          setProductForm(prev => ({ ...prev, image: reader.result }));
          setUploading(false);
          setUploadProgress(0);
        };
        reader.readAsDataURL(file);
      }, 
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setProductForm(prev => ({ ...prev, image: downloadURL }));
          setUploading(false);
          setUploadProgress(0);
        }).catch((err) => {
          console.warn("Could not get download URL, using Base64:", err);
          const reader = new FileReader();
          reader.onloadend = () => {
            setProductForm(prev => ({ ...prev, image: reader.result }));
            setUploading(false);
            setUploadProgress(0);
          };
          reader.readAsDataURL(file);
        });
      }
    );
  };

  // Create or Update Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const features = productForm.featuresText
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const targetProduct = {
      name: productForm.name,
      price: Number(productForm.price),
      compareAtPrice: Number(productForm.compareAtPrice),
      category: productForm.category,
      isBestSeller: productForm.isBestSeller,
      rating: Number(productForm.rating),
      reviewCount: Number(productForm.reviewCount),
      badge: productForm.badge,
      badgeColor: productForm.badgeColor,
      image: (productForm.image.startsWith('http') || productForm.image.startsWith('data:') || productForm.image.startsWith('/stickers/'))
        ? productForm.image 
        : `/stickers/${productForm.image}`,
      description: productForm.description,
      features: features
    };

    if (isFirebaseConfigured) {
      try {
        if (editingProduct && editingProduct.id) {
          // Update in Firebase
          const docRef = doc(db, 'products', String(editingProduct.id));
          await setDoc(docRef, { ...targetProduct, id: editingProduct.id });
        } else {
          // Add to Firebase
          const newId = Date.now();
          const docRef = doc(db, 'products', String(newId));
          await setDoc(docRef, { ...targetProduct, id: newId });
        }
      } catch (err) {
        console.error("Error writing product to Firestore:", err);
        alert("Firestore error: " + err.message);
        return;
      }
    } else {
      // Localstorage update
      if (editingProduct && editingProduct.id) {
        setLocalProducts(prev =>
          prev.map(p => p.id === editingProduct.id ? { ...p, ...targetProduct } : p)
        );
      } else {
        const newProduct = { ...targetProduct, id: Date.now() };
        setLocalProducts(prev => [...prev, newProduct]);
      }
    }

    setEditingProduct(null);
    resetProductForm();
  };

  // Delete Product
  const handleDeleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this sticker?")) return;

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, 'products', String(id));
        await deleteDoc(docRef);
      } catch (err) {
        alert("Firestore error: " + err.message);
        return;
      }
    } else {
      setLocalProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  // Save Site settings
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
      freeShippingThreshold: Number(settingsForm.freeShippingThreshold),
      mysteryStickerPrice: Number(settingsForm.mysteryStickerPrice),
      mysteryDecalPrice: Number(settingsForm.mysteryDecalPrice)
    };

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, 'settings', 'config');
        await setDoc(docRef, updatedSettings);
        setSiteSettings(updatedSettings);
        alert("Site configuration saved to the cloud successfully!");
      } catch (err) {
        alert("Firestore error: " + err.message);
      }
    } else {
      setSiteSettings(updatedSettings);
      localStorage.setItem('kenyak_settings', JSON.stringify(updatedSettings));
      alert("Site settings saved locally!");
    }
  };

  // Bootstrap Firestore with local catalog database
  const handleBootstrapFirestore = async () => {
    if (!isFirebaseConfigured) return;
    if (!confirm("This will overwrite your cloud Firestore with the initial 54 catalog items. Continue?")) return;

    setSyncLogs(prev => [...prev, "Starting Firestore initialization..."]);

    try {
      const batch = writeBatch(db);

      // Upload Products
      PRODUCTS.forEach(p => {
        const docRef = doc(collection(db, 'products'), String(p.id));
        batch.set(docRef, p);
      });

      // Upload Default Settings
      const settingsRef = doc(db, 'settings', 'config');
      const defaultSettings = {
        heroTitle: "STICK. WEAR. \nEXPRESS YOURSELF",
        heroSubtitle: "Customize your laptop, water bottle, helmet, or smartphone with waterproof, scratch-resistant vinyl decals. Starting at just ₹29! Over 10 Lakh happy customers.",
        marqueeText: ["⚡ WATERPROOF VINYL STICKERS", "🔥 5000+ PREMIUM DESIGNS", "🚛 FREE SHIPPING OVER ₹199", "💥 BUY 4 GET 1 FREE"],
        contactEmail: "wecare@kenyak.xyz",
        contactPhone: "+91 75062 32907",
        contactAddress: "R.T. Road, Behind Rajshree Cinema, Dahisar East, Mumbai, MH - 400068.",
        freeShippingThreshold: 199,
        mysteryStickerPrice: 19,
        mysteryDecalPrice: 25
      };
      batch.set(settingsRef, defaultSettings);

      await batch.commit();
      setSyncLogs(prev => [...prev, "✅ Successfully uploaded all 54 products to Firestore!"]);
      setSyncLogs(prev => [...prev, "✅ Successfully initialized site settings config!"]);
      alert("Firestore initialized successfully!");
    } catch (err) {
      setSyncLogs(prev => [...prev, `❌ Error: ${err.message}`]);
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setProductForm({
      id: product.id,
      name: product.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice || product.price * 2,
      category: product.category,
      isBestSeller: product.isBestSeller || false,
      rating: product.rating || 4.8,
      reviewCount: product.reviewCount || 10,
      badge: product.badge || '',
      badgeColor: product.badgeColor || '',
      image: product.image.replace('/stickers/', ''),
      description: product.description || '',
      featuresText: (product.features || []).join('\n')
    });
  };

  const handleAddClick = () => {
    setEditingProduct({ id: '' }); // empty id denotes adding
    resetProductForm();
  };

  const resetProductForm = () => {
    setProductForm({
      id: '',
      name: '',
      price: 39,
      compareAtPrice: 79,
      category: 'tech',
      isBestSeller: false,
      rating: 4.8,
      reviewCount: 15,
      badge: '',
      badgeColor: '',
      image: stickerImages[0] || '',
      description: '',
      featuresText: "100% Waterproof Vinyl\nScratch & UV Resistant\nResidue-free removal"
    });
  };

  return (
    <div className="drawer-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div className="modal-content" style={{ width: '90%', maxWidth: '800px', height: '85vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} style={{ color: 'var(--neon-purple)' }} />
            <h2 className="modal-title">Kenyak Admin Console</h2>
            {isFirebaseConfigured ? (
              <span className="badge badge-cyan" style={{ fontSize: '0.6rem' }}>CLOUD ONLINE</span>
            ) : (
              <span className="badge badge-yellow" style={{ fontSize: '0.6rem' }}>LOCAL FALLBACK</span>
            )}
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close Admin Portal">
            <X size={18} />
          </button>
        </div>

        {/* Lock Screen if not authorized */}
        {!isAuthorized ? (
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <form onSubmit={handleLogin} style={{ maxWidth: '320px', width: '100%', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-panel-secondary)', padding: '16px', borderRadius: '50%', width: '64px', height: '64px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '2px solid #000' }}>
                <Lock size={32} />
              </div>
              <h3 style={{ marginBottom: '8px' }}>Enter Admin Password</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Password is protected for brand administrators.</p>
              
              <input
                type="password"
                placeholder="password123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'var(--bg-panel-secondary)', border: '2px solid #000', borderRadius: '6px', color: 'var(--text-primary)', marginBottom: '16px', textAlign: 'center' }}
                autoFocus
              />
              
              {errorMsg && <p style={{ color: 'var(--neon-purple)', fontSize: '0.75rem', marginBottom: '12px', fontWeight: 'bold' }}>{errorMsg}</p>}
              
              <button className="btn-neon-yellow" type="submit" style={{ width: '100%' }}>
                Unlock Dashboard
              </button>
            </form>
          </div>
        ) : (
          /* Dashboard Layout */
          <>
            {/* Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid #000', background: 'var(--bg-panel-secondary)' }}>
              <button 
                onClick={() => { setActiveTab('products'); setEditingProduct(null); }}
                style={{ flex: 1, padding: '14px', background: activeTab === 'products' ? '#fff' : 'transparent', border: 'none', borderRight: '2px solid #000', fontWeight: '900', cursor: 'pointer', outline: 'none', textTransform: 'uppercase', fontSize: '0.8rem' }}
              >
                📦 Stickers Catalog ({localProducts.length})
              </button>
              <button 
                onClick={() => { setActiveTab('content'); setEditingProduct(null); }}
                style={{ flex: 1, padding: '14px', background: activeTab === 'content' ? '#fff' : 'transparent', border: 'none', borderRight: '2px solid #000', fontWeight: '900', cursor: 'pointer', outline: 'none', textTransform: 'uppercase', fontSize: '0.8rem' }}
              >
                📝 Homepage Copy
              </button>
              <button 
                onClick={() => { setActiveTab('firebase'); setEditingProduct(null); }}
                style={{ flex: 1, padding: '14px', background: activeTab === 'firebase' ? '#fff' : 'transparent', border: 'none', fontWeight: '900', cursor: 'pointer', outline: 'none', textTransform: 'uppercase', fontSize: '0.8rem' }}
              >
                ⚡ Cloud Settings
              </button>
            </div>

            {/* Content Container */}
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              
              {/* TAB 1: PRODUCT MANAGER */}
              {activeTab === 'products' && (
                <>
                  {editingProduct === null ? (
                    /* Product list grid */
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ textTransform: 'uppercase' }}>Manage Stickers</h3>
                        <button onClick={handleAddClick} className="btn-neon-yellow" style={{ fontSize: '0.75rem', padding: '8px 16px' }}>
                          <Plus size={14} /> Add New Sticker
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {localProducts.map(p => (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--bg-panel-secondary)', border: '2px solid #000', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img src={p.image} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '4px', background: '#fff' }} />
                              <div>
                                <h4 style={{ fontSize: '0.85rem', margin: 0 }}>{p.name}</h4>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>₹{p.price} • {p.category.toUpperCase()}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleEditClick(p)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Edit"><Edit2 size={16} /></button>
                              <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--neon-purple)' }} title="Delete"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Edit/Add Form */
                    <form onSubmit={handleSaveProduct}>
                      <h3 style={{ marginBottom: '20px', textTransform: 'uppercase' }}>
                        {productForm.id ? "Edit Sticker Details" : "Add New Sticker"}
                      </h3>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label className="control-label">Sticker Name</label>
                          <input 
                            type="text" 
                            required 
                            className="navbar-search-input" 
                            style={{ paddingLeft: '12px' }} 
                            value={productForm.name} 
                            onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))} 
                          />
                        </div>
                        <div>
                          <label className="control-label">Sticker Category</label>
                          <select 
                            className="navbar-search-input" 
                            style={{ paddingLeft: '12px' }} 
                            value={productForm.category}
                            onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                          >
                            <option value="tech">Tech & Dev</option>
                            <option value="anime">Anime & Waifu</option>
                            <option value="meme">Pop Memes</option>
                            <option value="skins">Laptop Skins</option>
                            <option value="bumper">Reflective Bumper</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label className="control-label">Selling Price (₹)</label>
                          <input 
                            type="number" 
                            required 
                            className="navbar-search-input" 
                            style={{ paddingLeft: '12px' }} 
                            value={productForm.price} 
                            onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))} 
                          />
                        </div>
                        <div>
                          <label className="control-label">Original Price (₹)</label>
                          <input 
                            type="number" 
                            className="navbar-search-input" 
                            style={{ paddingLeft: '12px' }} 
                            value={productForm.compareAtPrice} 
                            onChange={(e) => setProductForm(prev => ({ ...prev, compareAtPrice: e.target.value }))} 
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px', background: 'rgba(0,0,0,0.02)', padding: '12px', border: '1px dashed #000', borderRadius: '8px' }}>
                        <label className="control-label">Image or Video Asset Source</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                          <select
                            className="navbar-search-input"
                            style={{ paddingLeft: '12px', flex: 1, minWidth: '150px' }}
                            value={productForm.image.startsWith('/stickers/') ? productForm.image.replace('/stickers/', '') : ''}
                            onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                          >
                            <option value="">-- Choose Existing Sticker --</option>
                            {stickerImages.map(img => (
                              <option key={img} value={img}>{img}</option>
                            ))}
                          </select>

                          <input
                            type="text"
                            placeholder="Or enter custom file URL path"
                            className="navbar-search-input"
                            style={{ paddingLeft: '12px', flex: 2 }}
                            value={productForm.image}
                            onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                          />
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <label className="btn-neon-purple" style={{ fontSize: '0.7rem', padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            <Upload size={12} />
                            Upload Image/Video File
                            <input 
                              type="file" 
                              onChange={handleImageUpload} 
                              accept="image/*,video/*" 
                              style={{ display: 'none' }} 
                            />
                          </label>
                          {uploading && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--neon-purple)' }}>
                              Uploading... {uploadProgress}%
                            </span>
                          )}
                          {!uploading && productForm.image && (
                            <span style={{ fontSize: '0.7rem', color: '#16a34a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                              Linked Path: {productForm.image.startsWith('data:') ? 'Local Base64 Data URL' : productForm.image}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label className="control-label">Badge Label (e.g. NEW)</label>
                          <input 
                            type="text" 
                            placeholder="Optional"
                            className="navbar-search-input" 
                            style={{ paddingLeft: '12px' }} 
                            value={productForm.badge} 
                            onChange={(e) => setProductForm(prev => ({ ...prev, badge: e.target.value }))} 
                          />
                        </div>
                        <div>
                          <label className="control-label">Badge Color</label>
                          <select 
                            className="navbar-search-input" 
                            style={{ paddingLeft: '12px' }} 
                            value={productForm.badgeColor}
                            onChange={(e) => setProductForm(prev => ({ ...prev, badgeColor: e.target.value }))}
                          >
                            <option value="">No Badge</option>
                            <option value="yellow">Orange (Yellow)</option>
                            <option value="purple">Red (Purple)</option>
                            <option value="cyan">Black (Cyan)</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={productForm.isBestSeller} 
                              onChange={(e) => setProductForm(prev => ({ ...prev, isBestSeller: e.target.checked }))} 
                            />
                            Mark as Bestseller
                          </label>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label className="control-label">Product Description</label>
                        <textarea 
                          rows={2}
                          className="navbar-search-input" 
                          style={{ paddingLeft: '12px', height: 'auto', resize: 'vertical' }} 
                          value={productForm.description} 
                          onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))} 
                        />
                      </div>

                      <div style={{ marginBottom: '24px' }}>
                        <label className="control-label">Features / Specs (One per line)</label>
                        <textarea 
                          rows={3}
                          className="navbar-search-input" 
                          style={{ paddingLeft: '12px', height: 'auto', resize: 'vertical' }} 
                          value={productForm.featuresText} 
                          onChange={(e) => setProductForm(prev => ({ ...prev, featuresText: e.target.value }))} 
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-neon-yellow" type="submit">
                          <Save size={16} /> Save Product
                        </button>
                        <button className="btn-neon-purple" type="button" onClick={() => setEditingProduct(null)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* TAB 2: COPY EDITOR */}
              {activeTab === 'content' && (
                <form onSubmit={handleSaveSettings}>
                  <h3 style={{ marginBottom: '20px', textTransform: 'uppercase' }}>Homepage & Contact details</h3>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label className="control-label">Hero Banner Title</label>
                    <textarea 
                      rows={2}
                      required
                      className="navbar-search-input" 
                      style={{ paddingLeft: '12px', height: 'auto', fontFamily: 'var(--font-heading)', fontWeight: 'bold' }} 
                      value={settingsForm.heroTitle} 
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, heroTitle: e.target.value }))} 
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label className="control-label">Hero Subtitle Copy</label>
                    <textarea 
                      rows={3}
                      required
                      className="navbar-search-input" 
                      style={{ paddingLeft: '12px', height: 'auto', resize: 'vertical' }} 
                      value={settingsForm.heroSubtitle} 
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, heroSubtitle: e.target.value }))} 
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label className="control-label">Sliding Marquee Promo Texts (Comma-separated)</label>
                    <input 
                      type="text" 
                      required
                      className="navbar-search-input" 
                      style={{ paddingLeft: '12px' }} 
                      value={settingsForm.marqueeTextCsv} 
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, marqueeTextCsv: e.target.value }))} 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label className="control-label">Support Email Address</label>
                      <input 
                        type="email" 
                        required
                        className="navbar-search-input" 
                        style={{ paddingLeft: '12px' }} 
                        value={settingsForm.contactEmail} 
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, contactEmail: e.target.value }))} 
                      />
                    </div>
                    <div>
                      <label className="control-label">Support Telephone No.</label>
                      <input 
                        type="text" 
                        required
                        className="navbar-search-input" 
                        style={{ paddingLeft: '12px' }} 
                        value={settingsForm.contactPhone} 
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, contactPhone: e.target.value }))} 
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label className="control-label">Office Address Detail</label>
                    <input 
                      type="text" 
                      required
                      className="navbar-search-input" 
                      style={{ paddingLeft: '12px' }} 
                      value={settingsForm.contactAddress} 
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, contactAddress: e.target.value }))} 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <label className="control-label">Free Shipping Limit (₹)</label>
                      <input 
                        type="number" 
                        required
                        className="navbar-search-input" 
                        style={{ paddingLeft: '12px' }} 
                        value={settingsForm.freeShippingThreshold} 
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, freeShippingThreshold: e.target.value }))} 
                      />
                    </div>
                    <div>
                      <label className="control-label">Mystery Sticker Price (₹)</label>
                      <input 
                        type="number" 
                        required
                        className="navbar-search-input" 
                        style={{ paddingLeft: '12px' }} 
                        value={settingsForm.mysteryStickerPrice} 
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, mysteryStickerPrice: e.target.value }))} 
                      />
                    </div>
                    <div>
                      <label className="control-label">Mystery Decal Price (₹)</label>
                      <input 
                        type="number" 
                        required
                        className="navbar-search-input" 
                        style={{ paddingLeft: '12px' }} 
                        value={settingsForm.mysteryDecalPrice} 
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, mysteryDecalPrice: e.target.value }))} 
                      />
                    </div>
                  </div>

                  <button className="btn-neon-yellow" type="submit">
                    <Save size={16} /> Save Configuration
                  </button>
                </form>
              )}

              {/* TAB 3: FIREBASE SYNC */}
              {activeTab === 'firebase' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ textTransform: 'uppercase' }}>Cloud Sync Integration</h3>
                  
                  {isFirebaseConfigured ? (
                    <div style={{ background: '#f0fdf4', border: '2px solid #16a34a', color: '#16a34a', padding: '16px', borderRadius: '8px', fontSize: '0.85rem' }}>
                      <strong>Firebase Live Connection is Active!</strong> All changes you save in this dashboard are writing instantly to your Firestore database and updating live.
                    </div>
                  ) : (
                    <div style={{ background: '#fffbeb', border: '2px solid #d97706', color: '#b45309', padding: '16px', borderRadius: '8px', fontSize: '0.85rem' }}>
                      <strong>Local Fallback Mode.</strong> Firebase credentials are not set inside `src/firebase.js`. The website is currently reading and writing only to your local browser storage.
                    </div>
                  )}

                  <div style={{ background: 'var(--bg-panel-secondary)', border: '2px solid #000', padding: '20px', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CloudLightning size={16} />
                      Bootstrap Cloud Database
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                      If this is a new Firebase installation, your Firestore collection will be empty. Click the button below to upload your full catalog of 54 stickers and default site configuration copy in a single click.
                    </p>

                    <button 
                      onClick={handleBootstrapFirestore} 
                      disabled={!isFirebaseConfigured}
                      className="btn-neon-yellow"
                      style={{ fontSize: '0.75rem', padding: '10px 20px' }}
                    >
                      Initialize Firestore Collections
                    </button>
                  </div>

                  {syncLogs.length > 0 && (
                    <div style={{ background: '#000', color: '#00ff00', padding: '12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.7rem', height: '140px', overflowY: 'auto' }}>
                      {syncLogs.map((log, index) => (
                        <div key={index}>{log}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}

      </div>
    </div>
  );
}
