import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { addProduct } from '../../api/products';
import toast from 'react-hot-toast';
import { Camera, Plus, X, ArrowLeft } from 'lucide-react';

export default function SellerAddProductPage() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [sizes, setSizes] = useState([]);
  const [sizeInput, setSizeInput] = useState('');
  const [form, setForm] = useState({ title: '', price: '', description: '', inStock: true });
  const [loading, setLoading] = useState(false);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const addSize = () => {
    const s = sizeInput.trim().toUpperCase();
    if (s && !sizes.includes(s)) setSizes((p) => [...p, s]);
    setSizeInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) return toast.error('Title and price are required');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('price', form.price);
      fd.append('description', form.description);
      fd.append('inStock', form.inStock);
      sizes.forEach((s) => fd.append('sizes', s));
      if (photo) fd.append('photo', photo);

      await addProduct(fd);
      toast.success('Product added!');
      navigate('/seller/catalog');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <button className="btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '1rem', width: 'auto', paddingLeft: 0 }}>
        <ArrowLeft size={18} /> Back
      </button>

      <h1 className="page-title">Add Product</h1>
      <p className="page-subtitle">Add a new item to your catalog</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Photo upload */}
        <div>
          <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Product Photo</label>
          <div
            className="photo-upload"
            onClick={() => fileRef.current.click()}
            style={{ cursor: 'pointer' }}
          >
            {preview ? (
              <img src={preview} alt="preview" />
            ) : (
              <>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Camera size={22} color="var(--text-muted)" />
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Tap to upload photo</span>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
        </div>

        <div className="form-group">
          <label className="form-label">Product Title *</label>
          <input
            className="form-input"
            placeholder="e.g. Cotton Kurta"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Price (₹) *</label>
          <input
            className="form-input"
            type="number"
            placeholder="e.g. 499"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            style={{ resize: 'none', minHeight: '80px' }}
            placeholder="Product details..."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        {/* Sizes */}
        <div className="form-group">
          <label className="form-label">Sizes (optional)</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="form-input"
              placeholder="e.g. S, M, L, XL"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSize(); } }}
            />
            <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '0.75rem 1rem', flexShrink: 0 }} onClick={addSize}>
              <Plus size={18} />
            </button>
          </div>
          {sizes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {sizes.map((s) => (
                <span key={s} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  background: 'rgba(20,184,138,0.1)', color: 'var(--brand-400)',
                  border: '1px solid rgba(20,184,138,0.3)', borderRadius: '999px',
                  padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 600,
                }}>
                  {s}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSizes((p) => p.filter((x) => x !== s))} />
                </span>
              ))}
            </div>
          )}
        </div>

        {/* In stock toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>In Stock</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Is this product available?</div>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={form.inStock}
              onChange={(e) => setForm((p) => ({ ...p, inStock: e.target.checked }))}
            />
            <div className="toggle-track" />
            <div className="toggle-thumb" />
          </label>
        </div>

        <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? 'Adding product…' : 'Add Product'}
        </button>
      </form>
    </div>
  );
}
