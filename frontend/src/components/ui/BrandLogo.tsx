import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number; // pixel size (square)
  crisp?: boolean; // force crisp edges / higher quality
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className, size = 32, crisp = true }) => {
  const [src, setSrc] = useState('/logo.png');
  const dimension = `${size}px`;
  return (
    <img
      src={src}
      srcSet={`${src} 1x, ${src} 2x`}
      alt="CutTheSpend logo"
      width={size}
      height={size}
      decoding="async"
      loading="lazy"
      onError={() => {
        // Fallback: try SVG if available or keep current
        if (src !== '/logo.svg') setSrc('/logo.svg');
      }}
      className={className || 'block'}
      style={{
        width: dimension,
        height: dimension,
        objectFit: 'contain',
        imageRendering: crisp ? 'auto' : undefined,
        background: 'transparent',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    />
  );
};

export default BrandLogo;
