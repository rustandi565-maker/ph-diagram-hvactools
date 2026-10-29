import React from 'react';
import { CompanyBranding } from '../types/branding';

interface RtuLogoProps {
  className?: string;
  size?: number;
  branding?: Partial<CompanyBranding>;
  variant?: 'icon' | 'horizontal' | 'stamp' | 'badge';
  idPrefix?: string;
  isLightMode?: boolean;
}

export const RtuLogo: React.FC<RtuLogoProps> = ({
  className = 'w-9 h-9',
  size = 36,
  branding,
  variant = 'icon',
  idPrefix = 'rtu',
  isLightMode = false,
}) => {
  const companyName = branding?.companyName || 'CV. Rustandi Teknik Utama';
  const shortName = (branding?.shortName || 'RTU').toUpperCase().slice(0, 4);
  const tagline = branding?.tagline || 'Solusi Rekayasa Tata Udara & Cold Storage';
  const colorScheme = branding?.colorScheme || 'arctic_cyan';

  // Palette configs based on colorScheme
  const palettes = {
    arctic_cyan: {
      primary: '#38bdf8',
      secondary: '#0284c7',
      dark: '#0369a1',
      accent: '#fbbf24', // Gold heat-balance accent
      accentGrad: '#f59e0b',
      glow: '#38bdf8',
      bgDark: '#081026',
      badgeBorder: '#0ea5e9',
    },
    deep_navy: {
      primary: '#60a5fa',
      secondary: '#2563eb',
      dark: '#1d4ed8',
      accent: '#38bdf8',
      accentGrad: '#0284c7',
      glow: '#60a5fa',
      bgDark: '#0b1329',
      badgeBorder: '#3b82f6',
    },
    emerald_eco: {
      primary: '#34d399',
      secondary: '#059669',
      dark: '#047857',
      accent: '#38bdf8',
      accentGrad: '#0ea5e9',
      glow: '#34d399',
      bgDark: '#062016',
      badgeBorder: '#10b981',
    },
    frost_gold: {
      primary: '#fbbf24',
      secondary: '#d97706',
      dark: '#b45309',
      accent: '#38bdf8',
      accentGrad: '#0284c7',
      glow: '#fbbf24',
      bgDark: '#1a1405',
      badgeBorder: '#f59e0b',
    },
  };

  const p = palettes[colorScheme] || palettes.arctic_cyan;
  const gradId = `${idPrefix}-grad`;
  const accentId = `${idPrefix}-accent`;
  const bgId = `${idPrefix}-bg`;

  // Variant: Circular Rubber Stamp (Cap Stempel Resmi CV)
  if (variant === 'stamp') {
    const stampColor = isLightMode ? '#1e40af' : '#60a5fa'; // Classic Indonesian engineering blue ink
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 240 240"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Circular Text Path for Upper and Lower Arc */}
          <path
            id={`${idPrefix}-upperArc`}
            d="M 30,120 A 90,90 0 1,1 210,120"
            fill="none"
          />
          <path
            id={`${idPrefix}-lowerArc`}
            d="M 210,120 A 90,90 0 0,1 30,120"
            fill="none"
          />
        </defs>

        {/* Outer Heavy Circular Ring */}
        <circle
          cx="120"
          cy="120"
          r="110"
          fill="none"
          stroke={stampColor}
          strokeWidth="4"
        />
        {/* Inner Fine Circular Ring */}
        <circle
          cx="120"
          cy="120"
          r="104"
          fill="none"
          stroke={stampColor}
          strokeWidth="1.5"
        />

        {/* Inner Core Ring */}
        <circle
          cx="120"
          cy="120"
          r="68"
          fill="none"
          stroke={stampColor}
          strokeWidth="2.5"
        />

        {/* Upper Arc Text: COMPANY NAME */}
        <text
          fill={stampColor}
          fontSize="11.5"
          fontWeight="800"
          letterSpacing="2.5"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          <textPath
            href={`#${idPrefix}-upperArc`}
            startOffset="50%"
            textAnchor="middle"
          >
            {companyName.toUpperCase()}
          </textPath>
        </text>

        {/* Lower Arc Text: HVAC & REFRIGERATION INDONESIA */}
        <text
          fill={stampColor}
          fontSize="10"
          fontWeight="700"
          letterSpacing="2"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          <textPath
            href={`#${idPrefix}-lowerArc`}
            startOffset="50%"
            textAnchor="middle"
          >
            ★ HVAC &amp; COLD STORAGE ★
          </textPath>
        </text>

        {/* Center Monogram & Snowflake Symbol */}
        <g transform="translate(120, 120)">
          {/* Snowflake / Frost Lines */}
          <line x1="-34" y1="0" x2="34" y2="0" stroke={stampColor} strokeWidth="1.5" strokeDasharray="2 2" />
          <line x1="0" y1="-34" x2="0" y2="34" stroke={stampColor} strokeWidth="1.5" strokeDasharray="2 2" />

          {/* Central Monogram */}
          <text
            x="0"
            y="9"
            textAnchor="middle"
            fill={stampColor}
            fontSize={shortName.length > 3 ? "24" : "28"}
            fontWeight="900"
            fontFamily="monospace"
            letterSpacing="1"
          >
            {shortName}
          </text>
        </g>
      </svg>
    );
  }

  // Variant: Embroidered Technician Badge Style
  if (variant === 'badge') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 240"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={p.primary} />
            <stop offset="100%" stopColor={p.secondary} />
          </linearGradient>
          <linearGradient id={bgId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
        </defs>

        {/* Shield contour */}
        <path
          d="M 100 12 L 180 44 C 180 148 100 216 100 228 C 100 216 20 148 20 44 Z"
          fill={`url(#${bgId})`}
          stroke={p.badgeBorder}
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Inner stitch line */}
        <path
          d="M 100 24 L 168 52 C 168 140 100 198 100 210 C 100 198 32 140 32 52 Z"
          fill="none"
          stroke={p.primary}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeOpacity="0.7"
        />

        {/* Top Banner Tag */}
        <path d="M 50 48 L 150 48" stroke={p.accent} strokeWidth="2" strokeLinecap="round" />

        {/* Monogram in Center */}
        <text
          x="100"
          y="115"
          textAnchor="middle"
          fill={`url(#${gradId})`}
          fontSize={shortName.length > 3 ? "36" : "42"}
          fontWeight="900"
          fontFamily="monospace"
          letterSpacing="2"
        >
          {shortName}
        </text>

        {/* Sub-label */}
        <text
          x="100"
          y="142"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="10"
          fontWeight="700"
          letterSpacing="1.5"
          fontFamily="system-ui, sans-serif"
        >
          HVAC-R ENGINEER
        </text>

        {/* Frost / Cold chevron */}
        <path
          d="M 80 162 L 100 176 L 120 162"
          fill="none"
          stroke={p.accent}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Variant: Horizontal Brandmark (Logo + Company Name + Tagline)
  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-3.5 ${className}`}>
        <RtuLogo
          size={size}
          className="shrink-0"
          branding={branding}
          variant="icon"
          idPrefix={`${idPrefix}-inner`}
          isLightMode={isLightMode}
        />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-bold tracking-tight text-base sm:text-lg leading-tight truncate ${
                isLightMode ? 'text-slate-900' : 'text-white'
              }`}
            >
              {companyName}
            </span>
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${p.primary}20`,
                color: p.primary,
                border: `1px solid ${p.primary}40`,
              }}
            >
              {shortName}
            </span>
          </div>
          <span
            className={`text-xs tracking-wide truncate ${
              isLightMode ? 'text-slate-600' : 'text-cyan-400/90'
            }`}
          >
            {tagline}
          </span>
        </div>
      </div>
    );
  }

  // Default Variant: 'icon' (Precision Hexagonal Engineering Shield Monogram)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={p.primary} />
          <stop offset="50%" stopColor={p.secondary} />
          <stop offset="100%" stopColor={p.dark} />
        </linearGradient>
        <linearGradient id={bgId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={p.bgDark} />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id={accentId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={p.accentGrad} />
          <stop offset="100%" stopColor={p.accent} />
        </linearGradient>
      </defs>

      {/* Hexagonal Engineering Shield Base */}
      <polygon
        points="50,4 92,26 92,74 50,96 8,74 8,26"
        fill={`url(#${bgId})`}
        stroke={`url(#${gradId})`}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Inner Precision Guideline Grid */}
      <polygon
        points="50,11 85,30 85,70 50,89 15,70 15,30"
        fill="none"
        stroke={p.secondary}
        strokeWidth="1"
        strokeOpacity="0.35"
      />

      {/* Custom Monogram or Default RTU Master Logo */}
      {shortName === 'RTU' ? (
        <>
          {/* Custom Crafted Interlocking Monogram: R + T + U */}
          {/* Top T bar */}
          <rect x="25" y="27" width="50" height="7.5" rx="2" fill={`url(#${gradId})`} />
          {/* Left vertical stem */}
          <rect x="32" y="27" width="8" height="46" rx="1.5" fill={`url(#${gradId})`} />
          {/* Upper loop of R */}
          <path
            d="M 40 27 L 57 27 C 67 27, 72 34, 72 41 C 72 48, 67 53, 57 53 L 40 53 Z"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="7"
            strokeLinejoin="round"
          />
          {/* Diagonal leg of R */}
          <path
            d="M 52 51 L 68 73"
            stroke={`url(#${gradId})`}
            strokeWidth="7.5"
            strokeLinecap="round"
          />
        </>
      ) : (
        /* Dynamic Monogram for custom shortName */
        <text
          x="50"
          y="57"
          textAnchor="middle"
          fill={`url(#${gradId})`}
          fontSize={shortName.length > 3 ? "24" : shortName.length === 3 ? "28" : "32"}
          fontWeight="900"
          fontFamily="monospace"
          letterSpacing="1"
        >
          {shortName}
        </text>
      )}

      {/* Thermal & Refrigeration Chevron Accent (Lower Heat Exchange Anchor) */}
      <path
        d="M 28 67 L 50 83 L 72 67"
        fill="none"
        stroke={`url(#${accentId})`}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Cryogenic Apex Frost Point */}
      <circle cx="50" cy="18" r="2.8" fill={p.primary} />
    </svg>
  );
};
