import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyShop } from '../../api/shops';
import { getShopProducts, toggleInStock, deleteProduct } from '../../api/products';
import toast from 'react-hot-toast';
import { Plus, Package, Trash2, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SellerCatalogPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: shopData } = await getMyShop();
        setShop(shopData);
        const { data } = await getShopProducts(shopData._id);
        setProducts(data);
      } catch (err) {
        if (err.response?.status === 404) navigate('/seller/shop');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleToggle = async (product) => {
    const newVal = !product.inStock;
    setProducts((p) => p.map((x) => x._id === product._id ? { ...x, inStock: newVal } : x));
    try {
      await toggleInStock(product._id, newVal);
    } catch {
      setProducts((p) => p.map((x) => x._id === product._id ? { ...x, inStock: product.inStock } : x));
      toast.error('Failed to update stock status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      setProducts((p) => p.filter((x) => x._id !== id));
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">My Catalog</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{products.length} products</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1rem' }} onClick={() => navigate('/seller/add-product')}>
          <Plus size={18} /> Add
        </button>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Package size={28} /></div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>No products yet</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Add your first product to start selling</div>
          <button className="btn-primary" onClick={() => navigate('/seller/add-product')} style={{ marginTop: '0.5rem' }}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {products.map((product) => (
            <div key={product._id} className="card" style={{ display: 'flex', gap: '0.875rem', padding: '0.875rem', alignItems: 'center' }}>
              {/* Product image */}
              <div style={{
                width: 72, height: 72, borderRadius: '0.625rem', overflow: 'hidden', flexShrink: 0,
                background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {product.photoUrl ? (
                  <img src={`${API_URL}${product.photoUrl}`} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Package size={24} color="var(--text-muted)" />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {product.title}
                </div>
                <div style={{ color: 'var(--brand-400)', fontWeight: 700, fontSize: '0.875rem', marginTop: '0.125rem' }}>
                  ₹{product.price}
                </div>
                {product.sizes.length > 0 && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.125rem' }}>
                    {product.sizes.join(', ')}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.625rem' }}>
                <label className="toggle" title={product.inStock ? 'In stock' : 'Out of stock'}>
                  <input
                    type="checkbox"
                    checked={product.inStock}
                    onChange={() => handleToggle(product)}
                  />
                  <div className="toggle-track" />
                  <div className="toggle-thumb" />
                </label>
                <span className={`badge ${product.inStock ? 'badge-in-stock' : 'badge-out-stock'}`} style={{ fontSize: '0.65rem' }}>
                  {product.inStock ? 'In Stock' : 'Out'}
                </span>
                <button className="btn-ghost" style={{ padding: '0.25rem', color: 'var(--text-muted)' }} onClick={() => handleDelete(product._id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
