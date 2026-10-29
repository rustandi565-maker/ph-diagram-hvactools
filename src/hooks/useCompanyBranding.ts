import { useEffect, useState } from 'react';
import { BRAND_PRESETS, CompanyBranding, DEFAULT_BRANDING } from '../types/branding';

const STORAGE_KEY = 'hvac_company_branding';

export function useCompanyBranding() {
  const [branding, setBranding] = useState<CompanyBranding>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Auto-migrate if user had previous default address or phone
        if (!parsed.address || parsed.address.includes('Kawasan Industri') || parsed.address.includes('Bizpark')) {
          parsed.address = DEFAULT_BRANDING.address;
          parsed.city = DEFAULT_BRANDING.city;
        }
        if (!parsed.phone || parsed.phone.includes('812-3456-7890')) {
          parsed.phone = DEFAULT_BRANDING.phone;
        }
        return { ...DEFAULT_BRANDING, ...parsed };
      }
    } catch {
      // fallback
    }
    return DEFAULT_BRANDING;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
    } catch {
      // ignore
    }
  }, [branding]);

  const updateBranding = (updates: Partial<CompanyBranding>) => {
    setBranding((prev) => ({ ...prev, ...updates }));
  };

  const applyPreset = (presetId: string) => {
    const preset = BRAND_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setBranding((prev) => ({
        ...prev,
        companyName: preset.companyName,
        shortName: preset.shortName,
        tagline: preset.tagline,
        colorScheme: preset.colorScheme,
      }));
    }
  };

  const resetToDefault = () => {
    setBranding(DEFAULT_BRANDING);
  };

  return {
    branding,
    updateBranding,
    applyPreset,
    resetToDefault,
  };
}
