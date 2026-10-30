import { useState, useEffect } from 'react';
import { getBuyerOrders } from '../../api/orders';
import { submitReview, checkOrderReview } from '../../api/reviews';
import { useSocket } from '../../context/SocketContext';
import { ShoppingCart, Clock, CheckCircle, Package, Truck, MapPin, CreditCard, Star } from 'lucide-react';
import StarRating from '../../components/StarRating';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  placed: 'Order Placed',
  accepted: 'Accepted',
  packed: 'Packed',
  dispatched: 'Out for Delivery',
  delivered: 'Delivered',
};

const STATUS_ORDER = ['placed', 'accepted', 'packed', 'dispatched', 'delivered'];

function PaymentBadge({ paymentStatus }) {
  const styles = {
    paid: { bg: 'rgba(20,184,138,0.15)', color: '#2dd4a7', border: '1px solid rgba(20,184,138,0.3)', label: '✓ Paid' },
    pending: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', label: '⏳ Pending' },
    failed: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', label: '✗ Failed' },
  };
  const s = styles[paymentStatus] || styles.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.625rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: s.bg, color: s.color, border: s.border }}>
      <CreditCard size={10} /> {s.label}
    </span>
  );
}

function StatusTimeline({ currentStatus }) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '0 0.25rem', marginTop: '0.75rem' }}>
      {STATUS_ORDER.map((status, idx) => {
        const isDone = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={status} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 0 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: isDone ? 'var(--brand-500)' : 'var(--bg-card)',
                border: `2px solid ${isCurrent ? 'var(--brand-400)' : isDone ? 'var(--brand-500)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isCurrent ? '0 0 0 4px rgba(20,184,138,0.15)' : 'none',
                transition: 'all 0.3s', flexShrink: 0,
              }}>
                {isDone && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
              </div>
              <div style={{
                fontSize: '0.55rem', fontWeight: 600, marginTop: '0.25rem',
                color: isCurrent ? 'var(--brand-400)' : isDone ? 'var(--text-secondary)' : 'var(--text-muted)',
                textAlign: 'center', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em',
                maxWidth: '50px', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {STATUS_LABELS[status].split(' ')[0]}
              </div>
            </div>
            {idx < STATUS_ORDER.length - 1 && (
              <div style={{ height: 2, flex: 1, background: idx < currentIdx ? 'var(--brand-500)' : 'var(--border)', marginTop: 11, transition: 'background 0.3s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order, socket }) {
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus || 'pending');
  const [justUpdated, setJustUpdated] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    // Check if this order already has a review (only for delivered)
    if (order.status === 'delivered') {
      checkOrderReview(order._id)
        .then(({ data }) => setExistingReview(data.review))
        .catch(() => {});
    }
  }, [order._id, order.status]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_order_room', { orderId: order._id });

    const handleUpdate = ({ orderId, status: newStatus }) => {
      if (orderId === order._id) {
        setStatus(newStatus);
        setJustUpdated(true);
        toast.success(`Order ${newStatus}! 🎉`, { duration: 3000 });
        setTimeout(() => setJustUpdated(false), 3000);
      }
    };

    const handlePaid = ({ orderId }) => {
      if (orderId === order._id) {
        setPaymentStatus('paid');
        toast.success('Payment confirmed! 💳', { duration: 3000 });
      }
    };

    socket.on('order_status_updated', handleUpdate);
    socket.on('order_paid', handlePaid);
    return () => {
      socket.off('order_status_updated', handleUpdate);
      socket.off('order_paid', handlePaid);
    };
  }, [socket, order._id]);

  return (
    <div className="card" style={{
      overflow: 'hidden',
      border: justUpdated ? '1px solid var(--brand-500)' : '1px solid var(--border)',
      transition: 'border-color 0.5s',
      boxShadow: justUpdated ? '0 0 20px rgba(20,184,138,0.2)' : 'none',
    }}>
      <div style={{ padding: '1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              {order.shopId?.name || 'Shop'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <MapPin size={11} /> {order.shopId?.marketName}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem' }}>
            <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>
            <PaymentBadge paymentStatus={paymentStatus} />
          </div>
        </div>

        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Clock size={11} /> {new Date(order.createdAt).toLocaleString()} · #{order._id.slice(-6).toUpperCase()}
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.75rem' }}>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {item.title}
                {item.size && <span style={{ color: 'var(--text-muted)' }}> · {item.size}</span>}
                {' '}× {item.quantity}
              </span>
              <span style={{ color: 'var(--brand-400)', fontWeight: 700 }}>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.625rem', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total</span>
          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>₹{order.totalAmount.toFixed(2)}</span>
        </div>

        <StatusTimeline currentStatus={status} />

        {justUpdated && (
          <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(20,184,138,0.1)', border: '1px solid rgba(20,184,138,0.3)', borderRadius: '0.5rem', fontSize: '0.8rem', color: 'var(--brand-400)', fontWeight: 600, textAlign: 'center' }}>
            ✨ Status updated live!
          </div>
        )}

        {/* Review section — only for delivered orders */}
        {status === 'delivered' && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            {existingReview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <StarRating value={existingReview.rating} readonly size={18} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your review</span>
                {existingReview.comment && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>· "{existingReview.comment}"</span>}
              </div>
            ) : showReviewForm ? (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.625rem' }}>Rate this order</div>
                <StarRating value={reviewRating} onChange={setReviewRating} size={28} />
                <textarea
                  className="form-input"
                  placeholder="Leave a comment (optional)…"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  style={{ marginTop: '0.625rem', resize: 'none', minHeight: '60px', fontSize: '0.85rem' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, padding: '0.625rem' }}
                    disabled={reviewRating === 0 || reviewSubmitting}
                    onClick={async () => {
                      setReviewSubmitting(true);
                      try {
                        const { data } = await submitReview({ orderId: order._id, rating: reviewRating, comment: reviewComment });
                        setExistingReview(data);
                        setShowReviewForm(false);
                        toast.success('Review submitted! ⭐');
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Failed to submit review');
                      } finally {
                        setReviewSubmitting(false);
                      }
                    }}
                  >
                    {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
                  </button>
                  <button className="btn-ghost" style={{ padding: '0.625rem 1rem' }} onClick={() => setShowReviewForm(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowReviewForm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: '1px dashed var(--border)', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, width: '100%', justifyContent: 'center' }}
              >
                <Star size={14} /> Leave a review
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuyerOrdersPage() {
  const socket = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBuyerOrders()
      .then(({ data }) => setOrders(data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">My Orders</h1>
        <div className="live-indicator">
          <div className="live-dot" /> Live updates
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ShoppingCart size={28} /></div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No orders yet</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Browse a shop and place your first order</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} socket={socket} />
          ))}
        </div>
      )}
    </div>
  );
}
