import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyShops } from '../../api/follows';
import { searchProducts } from '../../api/products';
import { Store, Package, MapPin, ScanLine, Link2, X, ArrowRight, Search } from 'lucide-react';
import QRScannerModal from '../../components/QRScannerModal';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Extract qrToken from a full URL or bare token string
function extractToken(input) {
  const str = input.trim();
  // If it looks like a URL, grab the last path segment
  try {
    const url = new URL(str);
    const parts = url.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('follow');
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    // last segment fallback
    return parts[parts.length - 1] || str;
  } catch {
    // Not a URL — return as-is (bare token)
    return str;
  }
}

export default function BuyerFeedPage() {
  const navigate = useNavigate();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    getMyShops()
      .then(({ data }) => setFeed(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(() => {
      searchProducts(searchQuery.trim())
        .then(({ data }) => setSearchResults(data))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  // Called when QR scanner decodes a value
  const handleQRScan = (decoded) => {
    setShowScanner(false);
    const token = extractToken(decoded);
    if (!token) {
      toast.error('Could not read QR code');
      return;
    }
    toast.success('QR scanned!');
    navigate(`/follow/${token}`);
  };

  // Called when user submits pasted link/token
  const handleLinkSubmit = (e) => {
    e.preventDefault();
    const token = extractToken(linkInput);
    if (!token) {
      toast.error('Please enter a valid follow link or token');
      return;
    }
    setLinkInput('');
    setShowLinkInput(false);
    navigate(`/follow/${token}`);
  };

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <>
      {showScanner && (
        <QRScannerModal
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="page">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h1 className="page-title">My Shops</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {feed.length} shop{feed.length !== 1 ? 's' : ''} followed
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            className="form-input"
            placeholder="Search products in your followed shops…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem', paddingRight: searchQuery ? '2.5rem' : '0.875rem' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search results */}
        {searchQuery.trim().length >= 2 && (
          <div style={{ marginBottom: '1.25rem' }}>
            {searchLoading ? (
              <div style={{ textAlign: 'center', padding: '1.5rem' }}><div className="spinner" /></div>
            ) : searchResults.length === 0 ? (
              <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No products found for "{searchQuery}"
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {searchResults.map((p) => (
                    <div
                      key={p._id}
                      className="card card-hover"
                      onClick={() => navigate(`/buyer/product/${p._id}`, { state: { product: { ...p, shopId: p.shopId._id }, shopName: p.shopId.name } })}
                      style={{ padding: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}
                    >
                      <div style={{ width: 52, height: 52, borderRadius: '10px', background: 'rgba(255,255,255,0.04)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.photoUrl ? (
                          <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${p.photoUrl}`} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Package size={20} color="var(--text-muted)" />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🏪 {p.shopId.name}</div>
                      </div>
                      <div style={{ fontWeight: 800, color: 'var(--brand-400)', fontSize: '1rem', flexShrink: 0 }}>₹{p.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Follow a new shop — action bar */}
        <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>
            Follow a new shop
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
            {/* Scan QR */}
            <button
              onClick={() => setShowScanner(true)}
              style={{
                padding: '0.875rem 0.75rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(20,184,138,0.3)',
                background: 'rgba(20,184,138,0.07)',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(20,184,138,0.13)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(20,184,138,0.07)'}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '10px',
                background: 'rgba(20,184,138,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ScanLine size={20} color="var(--brand-400)" />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Scan QR</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>Use your camera</div>
            </button>

            {/* Paste link */}
            <button
              onClick={() => setShowLinkInput((p) => !p)}
              style={{
                padding: '0.875rem 0.75rem',
                borderRadius: '0.75rem',
                border: `1px solid ${showLinkInput ? 'rgba(96,165,250,0.4)' : 'rgba(96,165,250,0.2)'}`,
                background: showLinkInput ? 'rgba(96,165,250,0.1)' : 'rgba(96,165,250,0.05)',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '10px',
                background: 'rgba(96,165,250,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Link2 size={20} color="#60a5fa" />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Paste Link</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>Enter follow URL</div>
            </button>
          </div>

          {/* Link input — slides in */}
          {showLinkInput && (
            <form onSubmit={handleLinkSubmit} style={{ marginTop: '0.875rem', display: 'flex', gap: '0.5rem' }}>
              <input
                className="form-input"
                placeholder="Paste follow link or token here…"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                autoFocus
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--brand-500)', border: 'none', borderRadius: '0.5rem',
                  padding: '0 1rem', cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <ArrowRight size={18} color="white" />
              </button>
              <button
                type="button"
                onClick={() => { setShowLinkInput(false); setLinkInput(''); }}
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                  borderRadius: '0.5rem', padding: '0 0.75rem', cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <X size={16} color="var(--text-muted)" />
              </button>
            </form>
          )}
        </div>

        {/* Followed shops list */}
        {feed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Store size={28} /></div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No shops yet</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', maxWidth: '220px' }}>
              Scan a shop's QR code or paste a follow link above to get started
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {feed.map(({ shop, products }) => (
              <div
                key={shop._id}
                className="card card-hover"
                onClick={() => navigate(`/buyer/shop/${shop._id}`)}
              >
                {/* Shop header */}
                <div style={{ padding: '1rem 1rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(20,184,138,0.3), rgba(96,165,250,0.3))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.25rem', flexShrink: 0,
                  }}>
                    🏪
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {shop.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <MapPin size={11} /> {shop.marketName}
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255,255,255,0.04)', padding: '0.25rem 0.625rem', borderRadius: '999px', border: '1px solid var(--border)', flexShrink: 0 }}>
                    {products.length} items
                  </div>
                </div>

                {/* Product thumbnails */}
                {products.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', borderTop: '1px solid var(--border)' }}>
                    {products.slice(0, 4).map((p) => (
                      <div key={p._id} style={{ aspectRatio: '1', overflow: 'hidden', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.photoUrl ? (
                          <img src={`${API_URL}${p.photoUrl}`} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Package size={16} color="var(--text-muted)" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No products yet
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
