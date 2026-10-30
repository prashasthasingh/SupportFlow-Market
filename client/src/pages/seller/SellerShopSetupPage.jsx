import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyShop, createShop } from '../../api/shops';
import toast from 'react-hot-toast';
import { Store, MapPin, ArrowRight, CheckCircle } from 'lucide-react';

export default function SellerShopSetupPage() {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', marketName: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyShop()
      .then(({ data }) => setShop(data))
      .catch(() => setShop(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await createShop(form);
      setShop(data);
      toast.success('Shop created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create shop');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  if (shop) return (
    <div className="page">
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(20,184,138,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <CheckCircle size={36} color="var(--brand-400)" />
        </div>
        <h1 className="page-title">{shop.name}</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{shop.marketName}</p>
        {shop.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>{shop.description}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button className="btn-primary" onClick={() => navigate('/seller/catalog')}>
            View Catalog <ArrowRight size={16} />
          </button>
          <button className="btn-secondary" onClick={() => navigate('/seller/add-product')}>
            Add Product
          </button>
          <button className="btn-secondary" onClick={() => navigate('/seller/qr')}>
            View QR Code
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '14px',
          background: 'linear-gradient(135deg, #14b88a, #0a7a57)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1rem',
        }}>
          <Store size={28} color="white" />
        </div>
        <h1 className="page-title">Set up your shop</h1>
        <p className="page-subtitle">Get your local store online in minutes</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label className="form-label">Shop Name *</label>
          <input
            className="form-input"
            placeholder="e.g. Ravi's Clothing"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Market / Location *</label>
          <div style={{ position: 'relative' }}>
            <MapPin size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="e.g. Crawford Market, Mumbai"
              value={form.marketName}
              onChange={(e) => setForm((p) => ({ ...p, marketName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description (optional)</label>
          <textarea
            className="form-input"
            style={{ resize: 'none', minHeight: '80px' }}
            placeholder="Tell buyers what you sell..."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? 'Creating shop…' : 'Create Shop'} {!saving && <ArrowRight size={16} />}
        </button>
      </form>
    </div>
  );
}
