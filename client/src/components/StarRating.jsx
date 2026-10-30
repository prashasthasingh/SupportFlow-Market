import { useState } from 'react';

export default function StarRating({ value = 0, onChange, readonly = false, size = 24 }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = readonly ? star <= value : star <= (hovered || value);
        return (
          <span
            key={star}
            style={{
              fontSize: size,
              cursor: readonly ? 'default' : 'pointer',
              color: filled ? '#fbbf24' : 'var(--border)',
              transition: 'color 0.1s, transform 0.1s',
              transform: !readonly && hovered === star ? 'scale(1.2)' : 'scale(1)',
              display: 'inline-block',
              lineHeight: 1,
            }}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}
