import { useState, useEffect } from 'react';

export type CurrencyCode = 'AUTO' | 'GBP' | 'EUR' | 'ZAR' | 'USD' | 'AUD' | 'NZD';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateFromGbp: number; // 1 GBP = X target
  flag: string;
  region: string;
}

export const CURRENCIES: Record<Exclude<CurrencyCode, 'AUTO'>, CurrencyInfo> = {
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'Pound Sterling',
    rateFromGbp: 1.0,
    flag: '🇬🇧',
    region: 'England, Scotland, Wales'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rateFromGbp: 1.18,
    flag: '🇪🇺',
    region: 'Ireland, Italy, France'
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    rateFromGbp: 23.5,
    flag: '🇿🇦',
    region: 'South Africa'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rateFromGbp: 1.28,
    flag: '🇺🇸',
    region: 'International / USA'
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    rateFromGbp: 1.95,
    flag: '🇦🇺',
    region: 'Australia'
  },
  NZD: {
    code: 'NZD',
    symbol: 'NZ$',
    name: 'New Zealand Dollar',
    rateFromGbp: 2.15,
    flag: '🇳🇿',
    region: 'New Zealand'
  }
};

export const COUNTRY_DEFAULT_CURRENCY: Record<string, Exclude<CurrencyCode, 'AUTO'>> = {
  'South Africa': 'ZAR',
  'Ireland': 'EUR',
  'Italy': 'EUR',
  'France': 'EUR',
  'Scotland': 'GBP',
  'Wales': 'GBP',
  'England': 'GBP',
  'Australia': 'AUD',
  'New Zealand': 'NZD'
};

const STORAGE_KEY = 'rugga_27_currency_choice';

class CurrencyStore {
  private activeCode: CurrencyCode = 'AUTO';
  private listeners: ((code: CurrencyCode) => void)[] = [];

  constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'AUTO' || saved in CURRENCIES)) {
        this.activeCode = saved as CurrencyCode;
      }
    } catch {
      // ignore
    }
  }

  public getCurrency(): CurrencyCode {
    return this.activeCode;
  }

  public setCurrency(code: CurrencyCode) {
    this.activeCode = code;
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore
    }
    this.listeners.forEach(cb => cb(code));
  }

  public subscribe(cb: (code: CurrencyCode) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  public resolveEffectiveCurrency(clubCountry?: string): CurrencyInfo {
    if (this.activeCode !== 'AUTO') {
      return CURRENCIES[this.activeCode];
    }
    // Auto-detect based on team location
    const mapped = clubCountry ? COUNTRY_DEFAULT_CURRENCY[clubCountry] : undefined;
    if (mapped && CURRENCIES[mapped]) {
      return CURRENCIES[mapped];
    }
    return CURRENCIES.GBP;
  }

  public convert(amountGbp: number, clubCountry?: string): { amount: number; currency: CurrencyInfo } {
    const cur = this.resolveEffectiveCurrency(clubCountry);
    return {
      amount: Math.round(amountGbp * cur.rateFromGbp),
      currency: cur
    };
  }

  /**
   * Formats money.
   * If compact:
   * - If exceeds 999k (>= 1,000,000): displays as `$1m` or `$1.25m`
   * - If < 1,000,000 and >= 1,000: displays as `$950k`
   * - If < 1,000: displays as `$850`
   */
  public format(
    amountGbp: number,
    options: {
      compact?: boolean;
      clubCountry?: string;
      perWeek?: boolean;
      exact?: boolean;
    } = {}
  ): string {
    const { compact = false, clubCountry, perWeek = false, exact = false } = options;
    const { amount, currency } = this.convert(amountGbp, clubCountry);
    const symbol = currency.symbol;
    const suffix = perWeek ? '/w' : '';

    if (!compact && exact) {
      return `${symbol}${amount.toLocaleString()}${suffix}`;
    }

    // Check if exceeds 999k (> 999,000) -> turn into a million notation, e.g. $1m or $1.25m
    if (amount > 999_000) {
      const millions = amount / 1_000_000;
      // If round million or very close (e.g. 999,001 to 1,049,999), format as 1m
      const formatted = (millions >= 0.999 && millions < 1.05) || (millions % 1 === 0)
        ? Math.round(millions).toString()
        : millions.toFixed(1).replace(/\.0$/, '');
      return `${symbol}${formatted}m${suffix}`;
    }

    if (compact) {
      if (amount >= 1_000) {
        const thousands = Math.round(amount / 1_000);
        return `${symbol}${thousands}k${suffix}`;
      }
      return `${symbol}${amount}${suffix}`;
    }

    // Default full integer formatted with commas
    return `${symbol}${amount.toLocaleString()}${suffix}`;
  }
}

export const currencyStore = new CurrencyStore();

export function useCurrency(clubCountry?: string) {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(currencyStore.getCurrency());

  useEffect(() => {
    return currencyStore.subscribe(code => {
      setSelectedCurrency(code);
    });
  }, []);

  const effectiveCurrency = currencyStore.resolveEffectiveCurrency(clubCountry);

  const formatMoney = (amountGbp: number, options?: { compact?: boolean; perWeek?: boolean; exact?: boolean; clubCountry?: string }) => {
    const targetCountry = options?.clubCountry || clubCountry;
    return currencyStore.format(amountGbp, { ...options, clubCountry: targetCountry });
  };

  const convertAmount = (amountGbp: number) => {
    return currencyStore.convert(amountGbp, clubCountry).amount;
  };

  const setCurrency = (code: CurrencyCode) => {
    currencyStore.setCurrency(code);
  };

  return {
    selectedCurrency,
    effectiveCurrency,
    setCurrency,
    formatMoney,
    convertAmount,
    availableCurrencies: CURRENCIES
  };
}
