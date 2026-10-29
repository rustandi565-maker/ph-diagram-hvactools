import React from 'react';

interface LabtechLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  showTagline?: boolean;
  lightBackground?: boolean;
}

export const LabtechLogo: React.FC<LabtechLogoProps> = ({
  className = 'h-16 w-auto',
  width = 240,
  height = 70,
  showTagline = true,
  lightBackground = false,
}) => {
  return (
    <div className={`inline-flex flex-col items-end ${className}`}>
      <svg
        viewBox="0 0 320 90"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible select-none"
      >
        <defs>
          {/* Blue Orbit Gradient */}
          <linearGradient id="labtechBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="45%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#0c4a6e" />
          </linearGradient>

          {/* Golden Gear & TECH Gradient */}
          <linearGradient id="labtechGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Sphere 3D Radial Gradient */}
          <radialGradient id="sphereGold" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>

          <radialGradient id="sphereCyan" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#a5f3fc" />
            <stop offset="60%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0e7490" />
          </radialGradient>

          {/* Subtle Drop Shadow */}
          <filter id="logoShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodOpacity="0.25" />
          </filter>
        </defs>

        <g filter="url(#logoShadow)">
          {/* 1. ATOMIC ORBITAL LOOPS & GEAR TEETH */}
          {/* Gear teeth arc on top right of the orbit */}
          <path
            d="M 160 12 L 164 7 L 170 9 L 171 14 L 176 16 L 180 12 L 186 15 L 184 21 L 188 25 L 193 22 L 197 27 L 193 32 L 195 38 L 200 37 L 201 44 L 196 46"
            stroke="url(#labtechGoldGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Outer primary orbital blue ellipse 1 (tilted 35 deg) */}
          <ellipse
            cx="110"
            cy="46"
            rx="75"
            ry="36"
            transform="rotate(-30 110 46)"
            stroke="url(#labtechBlueGrad)"
            strokeWidth="5.5"
            fill="none"
          />

          {/* Inner crossing orbital blue curve 2 (tilted -60 deg) */}
          <path
            d="M 68 18 C 110 -2, 175 14, 182 50 C 188 78, 140 92, 102 78 C 65 65, 45 35, 68 18 Z"
            stroke="url(#labtechBlueGrad)"
            strokeWidth="4.5"
            fill="none"
          />

          {/* 2. ATOMIC PARTICLES / NODES */}
          {/* Golden electron sphere */}
          <circle cx="58" cy="38" r="10.5" fill="url(#sphereGold)" stroke="#d97706" strokeWidth="1" />
          {/* Cyan secondary node */}
          <circle cx="68" cy="46" r="5.5" fill="url(#sphereCyan)" stroke="#0e7490" strokeWidth="0.8" />

          {/* 3. "LAB" WORDMARK (Bold White with Deep Blue Outlines & 3D bevel) */}
          <g fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="48" letterSpacing="-1">
            {/* L */}
            <text x="14" y="66" fill="#003566" stroke="#003566" strokeWidth="6" strokeLinejoin="miter">L</text>
            <text x="14" y="66" fill="#ffffff">L</text>

            {/* A */}
            <text x="48" y="66" fill="#003566" stroke="#003566" strokeWidth="6" strokeLinejoin="miter">A</text>
            <text x="48" y="66" fill="#ffffff">A</text>

            {/* B */}
            <text x="86" y="66" fill="#003566" stroke="#003566" strokeWidth="6" strokeLinejoin="miter">B</text>
            <text x="86" y="66" fill="#ffffff">B</text>
          </g>

          {/* 4. "TECH" WORDMARK (Vibrant Solid Gold Block Letterforms) */}
          <g fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="50" letterSpacing="-0.5">
            <text x="180" y="66" fill="#78350f" stroke="#78350f" strokeWidth="2.5">TECH</text>
            <text x="180" y="66" fill="url(#labtechGoldGrad)">TECH</text>
          </g>
        </g>
      </svg>

      {/* Subtitle / Slogan */}
      {showTagline && (
        <div
          className={`text-[9px] font-mono font-black tracking-[0.25em] uppercase mt-0.5 pr-1 ${
            lightBackground ? 'text-amber-700' : 'text-amber-400'
          }`}
        >
          KNOWLEDGE ENGINEERING
        </div>
      )}
    </div>
  );
};
