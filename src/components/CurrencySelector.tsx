import React, { useState, useRef, useEffect } from 'react';
import { useCurrency, CURRENCIES, CurrencyCode } from '../services/currencyService';
import { soundFx } from '../services/soundFx';
import { ChevronDown, Globe } from 'lucide-react';

interface CurrencySelectorProps {
  clubCountry?: string;
  compact?: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ clubCountry, compact = false }) => {
  const { selectedCurrency, effectiveCurrency, setCurrency } = useCurrency(clubCountry);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: CurrencyCode) => {
    soundFx.playClick();
    setCurrency(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-emerald-500/60 text-neutral-200 hover:text-white transition-all text-xs font-semibold cursor-pointer shadow-sm"
        title="Select Display Currency"
      >
        <span className="text-sm">
          {selectedCurrency === 'AUTO' ? '🌐' : effectiveCurrency.flag}
        </span>
        <span className="font-mono-numbers font-bold text-emerald-400">
          {effectiveCurrency.symbol}
        </span>
        {!compact && (
          <span className="hidden sm:inline text-neutral-300 font-mono-numbers">
            {selectedCurrency === 'AUTO' ? `(${effectiveCurrency.code})` : effectiveCurrency.code}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-neutral-900 border border-neutral-700 shadow-2xl py-1.5 z-50 text-xs backdrop-blur-md">
          <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-neutral-400 border-b border-neutral-800">
            Select Currency
          </div>

          {/* Auto (Team Local) */}
          <button
            onClick={() => handleSelect('AUTO')}
            className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-neutral-800 transition-colors cursor-pointer ${
              selectedCurrency === 'AUTO' ? 'bg-emerald-950/50 text-emerald-300 font-bold' : 'text-neutral-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm">🌐</span>
              <div>
                <div className="font-medium">Team Local Currency</div>
                <div className="text-[10px] text-neutral-400">
                  {clubCountry || 'Selected club'} ({effectiveCurrency.code} · {effectiveCurrency.symbol})
                </div>
              </div>
            </div>
            {selectedCurrency === 'AUTO' && <span className="text-emerald-400 text-xs">✓</span>}
          </button>

          <div className="my-1 border-t border-neutral-800" />

          {/* Explicit Currencies */}
          {Object.values(CURRENCIES).map(curr => {
            const isSelected = selectedCurrency === curr.code;
            return (
              <button
                key={curr.code}
                onClick={() => handleSelect(curr.code)}
                className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-neutral-800 transition-colors cursor-pointer ${
                  isSelected ? 'bg-emerald-950/50 text-emerald-300 font-bold' : 'text-neutral-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{curr.flag}</span>
                  <div>
                    <div className="font-medium">
                      {curr.name} ({curr.symbol})
                    </div>
                    <div className="text-[10px] text-neutral-400">{curr.region}</div>
                  </div>
                </div>
                {isSelected && <span className="text-emerald-400 text-xs">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
