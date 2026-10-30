import { useState, useEffect, useCallback } from 'react';
import { getSellerOrders, updateOrderStatus } from '../../api/orders';
import { getMyShop } from '../../api/shops';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { ShoppingCart, Clock, ChevronDown, ChevronUp, RefreshCw, CreditCard } from 'lucide-react';

const STATUS_FLOW = ['placed', 'accepted', 'packed', 'dispatched', 'delivered'];

const STATUS_LABELS = {
  placed: 'Placed',
  accepted: 'Accepted',
  packed: 'Packed',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
};

const NEXT_STATUS = {
  placed: 'accepted',
  accepted: 'packed',
  packed: 'dispatched',
  dispatched: 'delivered',
};

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>;
}

function PaymentBadge({ paymentStatus }) {
  const map = {
    paid: { bg: 'rgba(20,184,138,0.15)', color: '#2dd4a7', border: '1px solid rgba(20,184,138,0.3)', label: '✓ Paid' },
    pending: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', label: '⏳ Pending' },
    failed: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', label: '✗ Failed' },
  };
  const s = map[paymentStatus] || map.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.625rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: s.bg, color: s.color, border: s.border }}>
      <CreditCard size={10} /> {s.label}
    </span>
  );
}

function OrderCard({ order, onStatusUpdate }) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const nextStatus = NEXT_STATUS[order.status];

  const handleUpdate = async () => {
    if (!nextStatus) return;
    setUpdating(true);
    try {
      await updateOrderStatus(order._id, nextStatus);
      onStatusUpdate(order._id, nextStatus);
      toast.success(`Order marked as ${nextStatus}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{ padding: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}
        onClick={() => setOpen((p) => !p)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
            <StatusBadge status={order.status} />
            <PaymentBadge paymentStatus={order.paymentStatus || 'pending'} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              #{order._id.slice(-6).toUpperCase()}
            </span>
          </div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
            {order.buyerId?.name || 'Buyer'}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {order.items.length} item{order.items.length !== 1 ? 's' : ''} · ₹{order.totalAmount.toFixed(2)}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
            <Clock size={11} /> {new Date(order.createdAt).toLocaleString()}
          </div>
        </div>
        <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '1rem' }}>
          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1rem' }}>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {item.title}
                    {item.size && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> · {item.size}</span>}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Qty: {item.quantity}</div>
                </div>
                <div style={{ color: 'var(--brand-400)', fontWeight: 700, fontSize: '0.875rem' }}>
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Total</span>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>₹{order.totalAmount.toFixed(2)}</span>
          </div>

          {order.note && (
            <div style={{ padding: '0.625rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#fbbf24' }}>
              Note: {order.note}
            </div>
          )}

          {/* Pay at delivery badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
              💳 Pay at Delivery
            </span>
          </div>

          {/* Action button */}
          {nextStatus && (
            <button className="btn-primary" onClick={handleUpdate} disabled={updating}>
              {updating ? 'Updating…' : `Mark as ${STATUS_LABELS[nextStatus]}`}
            </button>
          )}
          {order.status === 'delivered' && (
            <div style={{ textAlign: 'center', color: 'var(--brand-400)', fontWeight: 700, padding: '0.5rem' }}>
              ✓ Order Delivered
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SellerOrdersPage() {
  const socket = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState(null);
  const [filter, setFilter] = useState('all');

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await getSellerOrders();
      setOrders(data);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initShop = async () => {
      try {
        const { data } = await getMyShop();
        setShop(data);
      } catch {}
    };
    initShop();
    loadOrders();
  }, [loadOrders]);

  // Join seller room and listen for new orders
  useEffect(() => {
    if (!socket || !shop) return;
    socket.emit('join_seller_room', { shopId: shop._id });

    const handleNewOrder = (order) => {
      setOrders((prev) => [order, ...prev]);
      toast.success('🛒 New order received!', { duration: 4000 });
    };

    socket.on('new_order', handleNewOrder);
    return () => socket.off('new_order', handleNewOrder);
  }, [socket, shop?._id]);

  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: newStatus } : o));
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title">Orders</h1>
          <div className="live-indicator">
            <div className="live-dot" /> Live
          </div>
        </div>
        <button className="btn-ghost" onClick={loadOrders} style={{ padding: '0.5rem' }}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
        {['all', 'placed', 'accepted', 'packed', 'dispatched', 'delivered'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: '999px',
              border: `1px solid ${filter === f ? 'var(--brand-500)' : 'var(--border)'}`,
              background: filter === f ? 'rgba(20,184,138,0.1)' : 'transparent',
              color: filter === f ? 'var(--brand-400)' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {f === 'all' ? 'All' : STATUS_LABELS[f]}
            {f === 'all' && orders.length > 0 && (
              <span style={{ marginLeft: '0.375rem', background: 'var(--brand-500)', color: 'white', borderRadius: '999px', padding: '0 0.4rem', fontSize: '0.7rem' }}>
                {orders.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ShoppingCart size={28} /></div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No orders yet</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Share your QR code to start getting orders</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {filtered.map((order) => (
            <OrderCard key={order._id} order={order} onStatusUpdate={handleStatusUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
