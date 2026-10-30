import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { placeOrder } from '../../api/orders';
import { verifyPayment } from '../../api/payments';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Minus, Plus, ShoppingCart, Package, CreditCard, Truck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Load Razorpay checkout script dynamically
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const product = location.state?.product;
  const shopName = location.state?.shopName;

  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || '');
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [payMode, setPayMode] = useState('online'); // 'online' | 'cod'

  if (!product) {
    return (
      <div className="page">
        <button className="btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '1rem', width: 'auto', paddingLeft: 0 }}>
          <ArrowLeft size={18} /> Back
        </button>
        <div className="empty-state">
          <Package size={32} color="var(--text-muted)" />
          <p style={{ color: 'var(--text-muted)' }}>Product not found. Please go back.</p>
        </div>
      </div>
    );
  }

  const totalPrice = product.price * qty;

  const handleOrder = async () => {
    if (!user) {
      toast('Please log in to place an order', { icon: '🔐' });
      navigate('/login');
      return;
    }
    if (product.sizes.length > 0 && !selectedSize) {
      return toast.error('Please select a size');
    }
    setLoading(true);

    try {
      // Create order on backend (also creates Razorpay order)
      const { data } = await placeOrder({
        shopId: product.shopId,
        note,
        items: [{
          productId: product._id,
          title: product.title,
          price: product.price,
          size: selectedSize,
          quantity: qty,
          photoUrl: product.photoUrl,
        }],
      });

      const { order, razorpayOrderId, razorpayKeyId } = data;

      // Cash on Delivery — skip payment
      if (payMode === 'cod' || !razorpayOrderId || !razorpayKeyId || razorpayKeyId.includes('REPLACE_ME')) {
        toast.success('Order placed! 🎉 Pay at delivery.');
        navigate('/buyer/orders');
        return;
      }

      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Your order is saved — pay at delivery.');
        navigate('/buyer/orders');
        return;
      }

      // Open Razorpay checkout
      const options = {
        key: razorpayKeyId,
        amount: Math.round(totalPrice * 100),
        currency: 'INR',
        name: shopName || 'SupportFlow Market',
        description: product.title,
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order._id,
            });
            toast.success('Payment successful! 🎉');
          } catch {
            toast.error('Payment verification failed. Contact seller.');
          }
          navigate('/buyer/orders');
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: '#14b88a' },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled. Order saved — pay at delivery.', { icon: '⚠️' });
            navigate('/buyer/orders');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Product image */}
      <div style={{ position: 'relative' }}>
        <button
          className="btn-ghost"
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: '1rem', left: '1rem', zIndex: 10,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px',
            padding: '0.5rem',
          }}
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{ aspectRatio: '4/3', background: 'rgba(255,255,255,0.04)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {product.photoUrl ? (
            <img src={`${API_URL}${product.photoUrl}`} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Package size={64} color="var(--text-muted)" />
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1.5rem 1rem', maxWidth: 480, margin: '0 auto' }}>
        {shopName && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
            🏪 {shopName}
          </div>
        )}
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          {product.title}
        </h1>
        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--brand-400)', marginBottom: '1rem' }}>
          ₹{product.price}
        </div>

        {product.description && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            {product.description}
          </p>
        )}

        {/* Size selector */}
        {product.sizes.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>
              Size
            </div>
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  style={{
                    padding: '0.5rem 1.25rem', borderRadius: '0.5rem',
                    border: `2px solid ${selectedSize === s ? 'var(--brand-500)' : 'var(--border)'}`,
                    background: selectedSize === s ? 'rgba(20,184,138,0.1)' : 'transparent',
                    color: selectedSize === s ? 'var(--brand-400)' : 'var(--text-secondary)',
                    fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', fontSize: '0.9rem',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>
            Quantity
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}
            >
              <Minus size={18} />
            </button>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', minWidth: '2rem', textAlign: 'center' }}>
              {qty}
            </span>
            <button
              onClick={() => setQty((q) => q + 1)}
              style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Note */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label">Note for seller (optional)</label>
          <textarea
            className="form-input"
            style={{ resize: 'none', minHeight: '64px' }}
            placeholder="Any special instructions..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Payment method selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>
            Payment Method
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
            {[
              { value: 'online', icon: CreditCard, label: 'Pay Online', desc: 'Razorpay', color: '#14b88a' },
              { value: 'cod', icon: Truck, label: 'Cash on Delivery', desc: 'Pay at door', color: '#a78bfa' },
            ].map(({ value, icon: Icon, label, desc, color }) => (
              <button
                key={value}
                onClick={() => setPayMode(value)}
                style={{
                  padding: '0.875rem', borderRadius: '0.75rem',
                  border: `2px solid ${payMode === value ? color : 'var(--border)'}`,
                  background: payMode === value ? `${color}18` : 'transparent',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <Icon size={18} color={payMode === value ? color : 'var(--text-muted)'} />
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: payMode === value ? 'var(--text-primary)' : 'var(--text-secondary)', marginTop: '0.375rem' }}>{label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Total + Order button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>₹{totalPrice.toFixed(2)}</div>
          </div>
          <button
            className="btn-primary"
            onClick={handleOrder}
            disabled={loading || !product.inStock}
            style={{ width: 'auto', padding: '0.875rem 2rem', fontSize: '1rem' }}
          >
            {loading ? 'Processing…' : payMode === 'online' ? 'Pay Now' : 'Place Order'}
            {!loading && (payMode === 'online' ? <CreditCard size={18} /> : <ShoppingCart size={18} />)}
          </button>
        </div>
        {!product.inStock && (
          <p style={{ color: '#f87171', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem' }}>
            This product is currently out of stock
          </p>
        )}

        {/* Test card hint */}
        {payMode === 'online' && (
          <div style={{ padding: '0.875rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <strong style={{ color: '#60a5fa' }}>🧪 Test card:</strong> 4111 1111 1111 1111 · Any future date · Any CVV · OTP: 1234
          </div>
        )}
      </div>
    </div>
  );
}
