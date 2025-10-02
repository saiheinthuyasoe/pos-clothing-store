"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { SettingsService, BusinessSettings } from "@/services/settingsService";

interface CurrencyContextType {
  selectedCurrency: "THB" | "MMK";
  defaultCurrency: "THB" | "MMK";
  currencyRate: number;
  setSelectedCurrency: (currency: "THB" | "MMK") => void;
  convertPrice: (price: number) => number;
  getCurrencySymbol: (currency?: "THB" | "MMK") => string;
  formatPrice: (price: number, currency?: "THB" | "MMK") => string;
  formatDualCurrency: (defaultAmount: number, sellingAmount?: number, sellingCurrency?: "THB" | "MMK", exchangeRate?: number) => string;
  refreshCurrencySettings: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<"THB" | "MMK">(
    "THB"
  );
  const [defaultCurrency, setDefaultCurrency] = useState<"THB" | "MMK">("THB");
  const [currencyRate, setCurrencyRate] = useState<number>(0);

  // Load currency settings from business settings
  const loadCurrencySettings = async () => {
    try {
      const settings = await SettingsService.getBusinessSettings();
      if (settings) {
        const currency = (settings.defaultCurrency as "THB" | "MMK") || "THB";
        setDefaultCurrency(currency);
        setSelectedCurrency(currency); // Start with default currency
        setCurrencyRate(settings.currencyRate || 0);
      }
    } catch (error) {
      console.error("Error loading currency settings:", error);
    }
  };

  useEffect(() => {
    loadCurrencySettings();
  }, []);

  // Refresh currency settings method
  const refreshCurrencySettings = async () => {
    await loadCurrencySettings();
  };

  // Convert price from default currency to selected currency
  const convertPrice = (price: number): number => {
    if (selectedCurrency === defaultCurrency) {
      return price;
    }

    return SettingsService.convertPrice(
      price,
      defaultCurrency,
      selectedCurrency,
      currencyRate,
      defaultCurrency
    );
  };

  // Get currency symbol
  const getCurrencySymbol = (currency?: "THB" | "MMK"): string => {
    const targetCurrency = currency || selectedCurrency;
    const currencyInfo = SettingsService.getCurrencyInfo(targetCurrency);
    return currencyInfo.symbol;
  };

  // Format price with currency symbol
  const formatPrice = (price: number, currency?: "THB" | "MMK"): string => {
    const targetCurrency = currency || selectedCurrency;
    const convertedPrice = currency ? price : convertPrice(price);
    return SettingsService.formatPrice(convertedPrice, targetCurrency);
  };

  // Format dual currency display (default currency + selling currency with exchange rate)
  const formatDualCurrency = (
    defaultAmount: number, 
    sellingAmount?: number, 
    sellingCurrency?: "THB" | "MMK", 
    exchangeRate?: number
  ): string => {
    const defaultFormatted = SettingsService.formatPrice(defaultAmount, defaultCurrency);
    
    if (!sellingAmount || !sellingCurrency || !exchangeRate) {
      return defaultFormatted;
    }
    
    const sellingFormatted = SettingsService.formatPrice(sellingAmount, sellingCurrency);
    const rateDisplay = sellingCurrency === 'MMK' ? 'Ks' : sellingCurrency;
    
    return `${defaultFormatted} (${sellingFormatted} @ 1 ${defaultCurrency} = ${exchangeRate} ${rateDisplay})`;
  };

  const value: CurrencyContextType = {
    selectedCurrency,
    defaultCurrency,
    currencyRate,
    setSelectedCurrency,
    convertPrice,
    getCurrencySymbol,
    formatPrice,
    formatDualCurrency,
    refreshCurrencySettings,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}
