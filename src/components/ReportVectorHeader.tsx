import React from 'react';
import { CompanyBranding, LABTECH_BRANDING, DEFAULT_BRANDING } from '../types/branding';
import { LabtechLogo } from './LabtechLogo';
import { RtuLogo } from './RtuLogo';

interface ReportVectorHeaderProps {
  selectedLetterhead: 'current' | 'labtech';
  branding?: CompanyBranding;
  documentTitle: string;
  documentSubtitle?: string;
  refrigerantName?: string;
  docNumber?: string;
  standardCode?: string;
  className?: string;
}

export const ReportVectorHeader: React.FC<ReportVectorHeaderProps> = ({
  selectedLetterhead,
  branding,
  documentTitle,
  documentSubtitle = 'ASHRAE 15 / 34 • ISO 5149 • C.P. ARORA HVAC & REFRIGERATION',
  refrigerantName,
  docNumber = 'RTU-REF-PH-01',
  standardCode = 'ISO 9001 / CE / ASHRAE',
  className = '',
}) => {
  const isLabtech = selectedLetterhead === 'labtech';
  const activeBrand = isLabtech ? LABTECH_BRANDING : (branding ?? DEFAULT_BRANDING);

  return (
    <div className={`report-header-wrapper w-full mb-6 font-sans ${className}`}>
      {/* 1. MAIN EXECUTIVE HEADER CARD */}
      <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-white shadow-md print:shadow-none print:border-slate-400 print:rounded-none">
        
        {/* Subtle top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-700 via-cyan-500 to-amber-500" />

        {/* Content Area */}
        <div className="relative z-10 px-6 pt-5 pb-2 sm:px-8 sm:pt-6 sm:pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            
            {/* LEFT COLUMN: COMPANY IDENTITY & DETAILS */}
            <div className="flex-1 min-w-0 pr-2">
              {/* Company Legal Name */}
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase font-sans leading-tight">
                {activeBrand.companyName}
              </h1>

              {/* Tagline / Subtitle Badge */}
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-black tracking-[0.25em] text-amber-700 uppercase bg-amber-50 px-2.5 py-0.5 rounded border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  {activeBrand.subTagline || activeBrand.tagline}
                </span>
                <span className="text-[10px] font-mono text-slate-500 hidden md:inline">
                  &bull; Certified Testing Center
                </span>
              </div>

              {/* Detailed Address & Contact Grid */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600 font-mono leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800 shrink-0">Alamat:</span>
                  <span className="truncate">{activeBrand.address}, {activeBrand.city}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800 shrink-0">Kontak:</span>
                  <span>{activeBrand.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800 shrink-0">Email:</span>
                  <span className="text-blue-700">{activeBrand.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800 shrink-0">Web:</span>
                  <span className="text-slate-700">www.labtech.org</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: VECTOR LOGO & CERTIFICATION BADGE */}
            <div className="flex flex-col items-start sm:items-end justify-center shrink-0 border-t sm:border-t-0 sm:border-l sm:border-slate-200 pt-3 sm:pt-0 sm:pl-6 gap-2.5 w-full sm:w-auto">
              {isLabtech ? (
                <div className="flex flex-col items-start sm:items-end">
                  <LabtechLogo
                    className="w-auto h-14 sm:h-16"
                    width={230}
                    height={62}
                    showTagline={false}
                    lightBackground={true}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <RtuLogo size={52} branding={activeBrand} variant="badge" isLightMode={true} />
                  <div className="text-left font-mono">
                    <div className="text-xs font-bold text-slate-900 uppercase">{activeBrand.shortName}</div>
                    <div className="text-[10px] text-cyan-700 font-semibold">HVAC ENGINEERING</div>
                  </div>
                </div>
              )}

              {/* Official HVAC Certificate Pill & Metadata */}
              <div className="flex flex-col sm:items-end gap-1 font-mono text-[10px]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-block font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300 shadow-2xs">
                    OFFICIAL HVAC TEST REPORT
                  </span>
                  <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {standardCode}
                  </span>
                </div>
                {refrigerantName && (
                  <div className="text-slate-600 font-medium">
                    Refrigeran Kerja: <strong className="text-blue-900">{refrigerantName}</strong>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* 2. DYNAMIC VECTOR WAVE SEPARATOR (Inspired by reference image_2c9df0c6.png) */}
        {/* Curvilinear thermodynamic fluid-flow waves: deep sapphire, cyan vapor, thermal ruby/red, and gold work ribbons */}
        <div className="w-full relative mt-1 select-none pointer-events-none overflow-hidden" style={{ height: '52px' }}>
          <svg
            viewBox="0 0 1200 80"
            preserveAspectRatio="none"
            className="w-full h-full block"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Cyan Vapor Gradient */}
              <linearGradient id="waveCyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.85" />
                <stop offset="45%" stopColor="#0ea5e9" stopOpacity="0.75" />
                <stop offset="85%" stopColor="#38bdf8" stopOpacity="0.9" />
              </linearGradient>

              {/* Thermal Heat Rejection Red Ribbon Gradient */}
              <linearGradient id="waveRedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#991b1b" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#dc2626" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.95" />
              </linearGradient>

              {/* Deep Sapphire Oceanic Gradient */}
              <linearGradient id="waveNavyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0f172a" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#0c4a6e" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#075985" stopOpacity="0.95" />
              </linearGradient>

              {/* Amber / Gold Work Energy Gradient */}
              <linearGradient id="waveGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#d97706" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Back Wave 1: Soft Cyan Vapor Flow */}
            <path
              d="M 0,72 C 240,78 420,40 680,48 C 860,54 1040,24 1200,32 L 1200,80 L 0,80 Z"
              fill="url(#waveCyanGrad)"
              opacity="0.45"
            />

            {/* Mid Wave 2: Deep Blue/Navy Ribbon */}
            <path
              d="M 0,76 C 260,76 460,34 720,38 C 920,41 1060,56 1200,42 L 1200,80 L 0,80 Z"
              fill="url(#waveNavyGrad)"
              opacity="0.9"
            />

            {/* Mid Wave 3: Energetic Red Thermal Rejection Ribbon (Exact homage to user sample) */}
            <path
              d="M 520,80 C 640,46 800,28 980,34 C 1080,38 1150,58 1200,72 L 1200,80 Z"
              fill="url(#waveRedGrad)"
              opacity="0.95"
            />

            {/* Foreground Wave 4: Gold Compressor Work Accent Ribbon */}
            <path
              d="M 680,80 C 780,56 920,46 1060,50 C 1140,52 1180,68 1200,78 L 1200,80 Z"
              fill="url(#waveGoldGrad)"
              opacity="0.8"
            />

            {/* Bottom Horizon Accent Rule */}
            <line x1="0" y1="78.5" x2="1200" y2="78.5" stroke="#0369a1" strokeWidth="3" />
            <line x1="0" y1="80" x2="1200" y2="80" stroke="#f59e0b" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* 3. DISTINCTIVE HEADER BOTTOM DIVIDER & DOCUMENT BANNER ("garis header pemisah dengan isinya") */}
      <div className="mt-3.5 mb-2">
        {/* Multi-shade gradient divider bar */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-700 via-cyan-500 to-amber-500 rounded-full shadow-xs print:bg-slate-900" />
        
        {/* Official Document Title Card */}
        <div className="mt-3 py-2 px-4 rounded-lg bg-slate-100 border border-slate-300 text-center print:bg-white print:border-slate-400">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1">
            <span>Standar: {standardCode}</span>
            <span className="font-bold text-slate-800">Doc No: {docNumber}</span>
          </div>
          <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-950 font-mono">
            {documentTitle}
          </h2>
          <p className="text-xs font-mono text-cyan-800 font-semibold mt-0.5">
            {documentSubtitle}
          </p>
        </div>
      </div>
    </div>
  );
};
