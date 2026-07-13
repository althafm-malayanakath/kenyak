import React, { useState } from 'react';
import { X, CheckCircle, CreditCard, Truck, Receipt, RefreshCw } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, cart, onClearCart }) {
  if (!isOpen) return null;

  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Success
  const [shipping, setShipping] = useState({ name: '', phone: '', address: '', city: '', pincode: '', state: 'Maharashtra' });
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    if (!shipping.name || !shipping.phone || !shipping.address || !shipping.city || !shipping.pincode) {
      alert("Please fill in all shipping details.");
      return;
    }
    setStep(2);
  };

  const handlePlaceOrder = () => {
    setIsLoading(true);
    // Mock network latency
    setTimeout(() => {
      setIsLoading(false);
      const generatedId = `KN-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderId(generatedId);
      setStep(3);
    }, 1500);
  };

  const handleCloseSuccess = () => {
    onClearCart();
    onClose();
  };

  return (
    <div className="modal-backdrop">
      {/* Modal Box */}
      <div className="modal-content">
        
        {/* Header */}
        <div className="modal-header">
          <h2>
            {step === 1 && <><Truck size={18} style={{ color: 'var(--neon-yellow)' }} /> Shipping Info</>}
            {step === 2 && <><CreditCard size={18} style={{ color: 'var(--neon-purple)' }} /> Payment Selection</>}
            {step === 3 && <><Receipt size={18} style={{ color: 'var(--neon-cyan)' }} /> Order Confirmed</>}
          </h2>
          {step !== 3 && (
            <button 
              onClick={onClose}
              className="modal-close-btn"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        {step !== 3 && (
          <div className="modal-steps">
            <div className={`modal-step-tab ${step === 1 ? 'active-yellow' : ''}`}>
              1. Shipping
            </div>
            <div className={`modal-step-tab ${step === 2 ? 'active-purple' : ''}`}>
              2. Payment
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="modal-body">
          {/* STEP 1: Shipping Details Form */}
          {step === 1 && (
            <form onSubmit={handleShippingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  required
                  type="text"
                  value={shipping.name}
                  onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                  placeholder="Zainil Damani"
                  className="input-field"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>WhatsApp / Phone Number</label>
                  <input
                    required
                    type="tel"
                    value={shipping.phone}
                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                    placeholder="+91 7506232907"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label>Pincode (ZIP)</label>
                  <input
                    required
                    type="text"
                    pattern="[0-9]{6}"
                    maxLength="6"
                    value={shipping.pincode}
                    onChange={(e) => setShipping({ ...shipping, pincode: e.target.value })}
                    placeholder="400068"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Street Address</label>
                <textarea
                  required
                  rows="2"
                  value={shipping.address}
                  onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                  placeholder="R.T. Road, Dahisar East"
                  className="input-field"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    required
                    type="text"
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    placeholder="Mumbai"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <select
                    value={shipping.state}
                    onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                    className="input-field"
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Gujarat">Gujarat</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '8px' }}>
                <button
                  type="submit"
                  className="btn-neon-yellow"
                  style={{ width: '100%', padding: '14px' }}
                >
                  Continue to Payment
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Payment Method */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="shipping-summary-card">
                <div className="shipping-summary-left">
                  <label>Shipping To:</label>
                  <p>{shipping.name}</p>
                  <span>{shipping.address}, {shipping.city} - {shipping.pincode}</span>
                </div>
                <button 
                  onClick={() => setStep(1)}
                  className="shipping-edit-link"
                >
                  Edit
                </button>
              </div>

              <div className="payment-options-list">
                <label style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '6px' }}>Select Payment Mode</label>
                
                {/* UPI Option */}
                <label className={`payment-option-card ${paymentMethod === 'UPI' ? 'selected' : ''}`}>
                  <div className="payment-option-left">
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={paymentMethod === 'UPI'} 
                      onChange={() => setPaymentMethod('UPI')}
                      style={{ cursor: 'pointer' }}
                    />
                    <div>
                      <span className="payment-option-title">Instant UPI (GPay/PhonePe)</span>
                      <p className="payment-option-sub">Extra 5% Discount Applied Automatically</p>
                    </div>
                  </div>
                  <span className="payment-option-price">₹{(subtotal * 0.95).toFixed(0)}</span>
                </label>

                {/* Cards Option */}
                <label className={`payment-option-card ${paymentMethod === 'CARD' ? 'selected' : ''}`}>
                  <div className="payment-option-left">
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={paymentMethod === 'CARD'} 
                      onChange={() => setPaymentMethod('CARD')}
                      style={{ cursor: 'pointer' }}
                    />
                    <div>
                      <span className="payment-option-title">Credit / Debit Cards</span>
                      <p className="payment-option-sub">Secure payment via Razorpay</p>
                    </div>
                  </div>
                  <span className="payment-option-price normal">₹{subtotal}</span>
                </label>

                {/* COD Option */}
                <label className={`payment-option-card ${paymentMethod === 'COD' ? 'selected' : ''}`}>
                  <div className="payment-option-left">
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={paymentMethod === 'COD'} 
                      onChange={() => setPaymentMethod('COD')}
                      style={{ cursor: 'pointer' }}
                    />
                    <div>
                      <span className="payment-option-title">Cash On Delivery (COD)</span>
                      <p className="payment-option-sub">Pay in cash on delivery</p>
                    </div>
                  </div>
                  <span className="payment-option-price normal">₹{subtotal}</span>
                </label>
              </div>

              <div style={{ marginTop: '8px' }}>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isLoading}
                  className="btn-neon-purple"
                  style={{ width: '100%', padding: '14px' }}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> COMPILING ORDER...
                    </>
                  ) : (
                    `Place Order (₹${paymentMethod === 'UPI' ? (subtotal * 0.95).toFixed(0) : subtotal})`
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Order Invoice Success */}
          {step === 3 && (
            <div className="success-screen">
              <div className="success-icon-wrapper">
                <CheckCircle size={64} />
              </div>

              <div>
                <h3>ORDER COMPLETED!</h3>
                <p>We've received your request. Your custom pack compilation has started!</p>
              </div>

              {/* Receipt Bill panel */}
              <div className="receipt-box">
                <div className="receipt-row-split">
                  <div>
                    <label>Order ID</label>
                    <p className="cyan">{orderId}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <label>Payment</label>
                    <p>{paymentMethod}</p>
                  </div>
                </div>

                <div className="receipt-items-scroller">
                  {cart.map((item) => (
                    <div key={item.id} className="receipt-item-row">
                      <span>{item.name} <strong>x{item.quantity}</strong></span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="receipt-total-row">
                  <span>Total Amount Paid:</span>
                  <strong>
                    ₹{paymentMethod === 'UPI' ? (subtotal * 0.95).toFixed(0) : subtotal}
                  </strong>
                </div>

                <div className="receipt-address-box">
                  <strong>Shipping Address:</strong> {shipping.name}, {shipping.phone}, {shipping.address}, {shipping.city} - {shipping.pincode}, {shipping.state}.
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <button
                  onClick={handleCloseSuccess}
                  className="btn-neon-yellow"
                  style={{ width: '100%', padding: '14px' }}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
