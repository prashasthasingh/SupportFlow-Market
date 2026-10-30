import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getShopByToken } from '../../api/shops';
import { followShop, checkFollow } from '../../api/follows';
import { getShopProducts } from '../../api/products';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Store, MapPin, CheckCircle, ArrowRight, ShoppingBag, Package } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function FollowShopPage() {
  const { qrToken } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: shopData } = await getShopByToken(qrToken);
        setShop(shopData);
        const { data: prods } = await getShopProducts(shopData._id);
        setProducts(prods.slice(0, 6));
        if (user?.role === 'buyer') {
          const { data: followData } = await checkFollow(shopData._id);
          setFollowing(followData.following);
        }
      } catch {
        toast.error('Shop not found');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [qrToken, user]);

  const handleFollow = async () => {
    if (!user) {
      toast('Sign up to follow this shop!', { icon: '👋' });
      navigate('/signup');
      return;
    }
    if (user.role !== 'buyer') {
      toast.error('Only buyers can follow shops');
      return;
    }
    setFollowLoading(true);
    try {
      await followShop(shop._id);
      setFollowing(true);
      toast.success(`Following ${shop.name}!`);
    } catch (err) {
      if (err.response?.status === 409) {
        setFollowing(true);
        toast('Already following this shop', { icon: '✓' });
      } else {
        toast.error('Failed to follow shop');
      }
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div className="spinner" />
    </div>
  );

  if (!shop) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', background: 'var(--bg-base)', padding: '2rem', textAlign: 'center' }}>
      <Store size={48} color="var(--text-muted)" />
      <h2 style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Shop not found</h2>
      <p style={{ color: 'var(--text-muted)' }}>This QR link may be invalid or expired.</p>
    </div>
  );

  return (
    <div className="follow-hero">
      {/* Hero */}
      <div style={{ padding: '3rem 1.5rem 2rem', textAlign: 'center' }}>
        {/* Shop avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: '20px',
          background: 'linear-gradient(135deg, #14b88a, #60a5fa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem',
          boxShadow: '0 8px 32px rgba(20,184,138,0.3)',
          fontSize: '2rem',
        }}>
          🏪
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
          {shop.name}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          <MapPin size={14} />
          <span style={{ fontSize: '0.9rem' }}>{shop.marketName}</span>
        </div>
        {shop.description && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            {shop.description}
          </p>
        )}

        {/* Follow button */}
        {following ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '300px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--brand-400)', fontWeight: 700, fontSize: '1rem' }}>
              <CheckCircle size={20} /> Following!
            </div>
            <button
              className="btn-primary"
              onClick={() => navigate(`/buyer/shop/${shop._id}`)}
            >
              Browse Products <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div style={{ maxWidth: '300px', margin: '0 auto' }}>
            <button
              className="btn-primary"
              onClick={handleFollow}
              disabled={followLoading}
              style={{ fontSize: '1rem', padding: '0.875rem 1.5rem' }}
            >
              {followLoading ? 'Following…' : '+ Follow this shop'}
            </button>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
              Follow to browse catalog and place orders
            </p>
          </div>
        )}
      </div>

      {/* Product preview */}
      {products.length > 0 && (
        <div style={{ padding: '0 1rem 2rem' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
            Products Preview
          </div>
          <div className="product-grid">
            {products.map((p) => (
              <div key={p._id} className="product-card">
                <div style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {p.photoUrl ? (
                    <img src={`${API_URL}${p.photoUrl}`} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Package size={24} color="var(--text-muted)" />
                  )}
                </div>
                <div className="product-card-body">
                  <div className="product-card-title">{p.title}</div>
                  <div className="product-card-price">₹{p.price}</div>
                </div>
              </div>
            ))}
          </div>

          {following && (
            <button className="btn-primary" onClick={() => navigate(`/buyer/shop/${shop._id}`)} style={{ marginTop: '1.25rem' }}>
              View All Products <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}

      {/* Auth prompt for non-logged-in users */}
      {!user && (
        <div style={{ margin: '0 1rem 2rem', padding: '1rem', background: 'rgba(20,184,138,0.06)', border: '1px solid rgba(20,184,138,0.2)', borderRadius: '0.75rem', textAlign: 'center' }}>
          <ShoppingBag size={20} color="var(--brand-400)" style={{ marginBottom: '0.5rem' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
            Create a free account to follow shops and place orders
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-primary" onClick={() => navigate('/signup')} style={{ fontSize: '0.875rem' }}>Sign Up Free</button>
            <button className="btn-secondary" onClick={() => navigate('/login')} style={{ fontSize: '0.875rem' }}>Log In</button>
          </div>
        </div>
      )}
    </div>
  );
}
