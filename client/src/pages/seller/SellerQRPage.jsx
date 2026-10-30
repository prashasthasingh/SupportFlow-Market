import { useState, useEffect } from 'react';
import { getMyShop } from '../../api/shops';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SellerQRPage() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyShop()
      .then(({ data }) => setShop(data))
      .catch(() => setShop(null))
      .finally(() => setLoading(false));
  }, []);

  const followUrl = shop
    ? `${window.location.origin}/follow/${shop.qrToken}`
    : '';

  const copyUrl = () => {
    navigator.clipboard.writeText(followUrl);
    toast.success('Link copied!');
  };

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  if (!shop) return (
    <div className="page">
      <div className="empty-state">
        <QrCode size={40} color="var(--text-muted)" />
        <p style={{ color: 'var(--text-secondary)' }}>Create your shop first to get a QR code</p>
      </div>
    </div>
  );

  return (
    <div className="page">
      <h1 className="page-title">Shop QR Code</h1>
      <p className="page-subtitle">Share this QR so buyers can follow your shop</p>

      {/* QR code card */}
      <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{
          background: 'white',
          padding: '1.25rem',
          borderRadius: '1rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <QRCodeSVG
            value={followUrl}
            size={200}
            fgColor="#0a0f1c"
            bgColor="white"
            level="H"
            includeMargin={false}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {shop.name}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{shop.marketName}</div>
        </div>
      </div>

      {/* URL display */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Follow Link
        </div>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          color: 'var(--brand-400)',
          wordBreak: 'break-all',
          lineHeight: 1.5,
        }}>
          {followUrl}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn-primary" onClick={copyUrl}>
          <Copy size={16} /> Copy Link
        </button>
        <button className="btn-secondary" onClick={() => window.open(followUrl, '_blank')} style={{ width: 'auto', flexShrink: 0 }}>
          <ExternalLink size={16} />
        </button>
      </div>

      <div className="card" style={{ padding: '1rem', marginTop: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <QrCode size={20} color="var(--brand-400)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Print or display this QR at your shop. When buyers scan it, they'll be taken to your shop page and can follow you to place orders.
        </div>
      </div>
    </div>
  );
}
