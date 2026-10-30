import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, CameraOff } from 'lucide-react';

export default function QRScannerModal({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const scannerId = 'qr-scanner-region';
    let scanner = null;

    const startScanner = async () => {
      try {
        scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          setError('No camera found on this device.');
          return;
        }

        // Prefer back camera on mobile
        const cameraId =
          cameras.find((c) => c.label.toLowerCase().includes('back'))?.id ||
          cameras[cameras.length - 1].id;

        await scanner.start(
          cameraId,
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            // Stop and call back with decoded URL
            scanner.stop().catch(() => {});
            onScan(decodedText);
          },
          () => {} // suppress per-frame errors
        );
        setStarted(true);
      } catch (err) {
        setError(err?.message || 'Could not access camera. Please allow camera permission.');
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && started) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
    }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={20} color="var(--brand-400)" /> Scan QR Code
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Point at a shop's QR code
          </div>
        </div>
        <button
          onClick={handleClose}
          style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)',
            borderRadius: '50%', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-primary)',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Scanner box */}
      <div style={{
        width: '100%', maxWidth: 360,
        borderRadius: '1rem', overflow: 'hidden',
        border: '2px solid var(--brand-500)',
        boxShadow: '0 0 40px rgba(20,184,138,0.25)',
        position: 'relative', background: '#000',
      }}>
        <div id="qr-scanner-region" style={{ width: '100%' }} />

        {/* Corner frame overlay */}
        {!error && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {[
              { top: 12, left: 12, borderTop: '3px solid var(--brand-400)', borderLeft: '3px solid var(--brand-400)' },
              { top: 12, right: 12, borderTop: '3px solid var(--brand-400)', borderRight: '3px solid var(--brand-400)' },
              { bottom: 12, left: 12, borderBottom: '3px solid var(--brand-400)', borderLeft: '3px solid var(--brand-400)' },
              { bottom: 12, right: 12, borderBottom: '3px solid var(--brand-400)', borderRight: '3px solid var(--brand-400)' },
            ].map((style, i) => (
              <div key={i} style={{ position: 'absolute', width: 24, height: 24, ...style }} />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <CameraOff size={40} color="#f87171" style={{ marginBottom: '1rem' }} />
            <div style={{ color: '#f87171', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Camera Error
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6 }}>{error}</div>
          </div>
        )}
      </div>

      <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
        Allow camera access when prompted by your browser
      </p>
    </div>
  );
}
