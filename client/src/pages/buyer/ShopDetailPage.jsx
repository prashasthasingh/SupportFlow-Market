import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getShopProducts } from '../../api/products';
import { getShopReviews } from '../../api/reviews';
import api from '../../api/axios';
import StarRating from '../../components/StarRating';
import { ArrowLeft, MapPin, Package } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ShopDetailPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviewData, setReviewData] = useState({ avgRating: 0, count: 0, reviews: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const [shopRes, prodsRes, reviewRes] = await Promise.all([
          api.get(`/api/shops/by-id/${shopId}`),
          getShopProducts(shopId),
          getShopReviews(shopId),
        ]);
        setShop(shopRes.data);
        setProducts(prodsRes.data);
        setReviewData(reviewRes.data);
      } catch (err) {
        try {
          const [prodsRes, reviewRes] = await Promise.all([getShopProducts(shopId), getShopReviews(shopId)]);
          setProducts(prodsRes.data);
          setReviewData(reviewRes.data);
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [shopId]);

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  const inStock = products.filter((p) => p.inStock);
  const outOfStock = products.filter((p) => !p.inStock);

  return (
    <div className="page">
      <button className="btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '1rem', width: 'auto', paddingLeft: 0 }}>
        <ArrowLeft size={18} /> Back
      </button>

      {/* Shop header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(20,184,138,0.3), rgba(96,165,250,0.3))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.75rem', flexShrink: 0,
        }}>
          🏪
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {shop?.name || 'Shop'}
          </h1>
          {shop?.marketName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <MapPin size={12} /> {shop.marketName}
            </div>
          )}
          {reviewData.count > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.375rem' }}>
              <StarRating value={Math.round(reviewData.avgRating)} readonly size={14} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {reviewData.avgRating} ({reviewData.count} review{reviewData.count !== 1 ? 's' : ''})
              </span>
            </div>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Package size={28} /></div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No products yet</div>
        </div>
      ) : (
        <>
          {inStock.length > 0 && (
            <>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                Available ({inStock.length})
              </div>
              <div className="product-grid" style={{ marginBottom: '1.5rem' }}>
                {inStock.map((p) => (
                  <div
                    key={p._id}
                    className="product-card"
                    onClick={() => navigate(`/buyer/product/${p._id}`, { state: { product: p, shopName: shop?.name } })}
                  >
                    <div style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {p.photoUrl ? (
                        <img src={`${API_URL}${p.photoUrl}`} alt={p.title} />
                      ) : (
                        <Package size={28} color="var(--text-muted)" />
                      )}
                    </div>
                    <div className="product-card-body">
                      <div className="product-card-title">{p.title}</div>
                      <div className="product-card-price">₹{p.price}</div>
                      {p.sizes.length > 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.125rem' }}>
                          {p.sizes.join(' · ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {outOfStock.length > 0 && (
            <>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                Out of Stock ({outOfStock.length})
              </div>
              <div className="product-grid">
                {outOfStock.map((p) => (
                  <div key={p._id} className="product-card" style={{ opacity: 0.5, cursor: 'default' }}>
                    <div style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', filter: 'grayscale(1)' }}>
                      {p.photoUrl ? (
                        <img src={`${API_URL}${p.photoUrl}`} alt={p.title} />
                      ) : (
                        <Package size={28} color="var(--text-muted)" />
                      )}
                    </div>
                    <div className="product-card-body">
                      <div className="product-card-title">{p.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>Out of Stock</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
