"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import {
  useAssetsQuery,
  useAuth,
  useBalanceQuery,
  useBuyMutation,
  useSellMutation,
  useMarketWebSocket,
  formatApiError,
  type TradingAsset,
  type ChartPoint,
  type MarketQuote,
  type TrendAsset,
} from "@/apis";

export type ChartType = "area" | "candles";

export interface ActiveTradeMarker {
  id: number;
  symbol: string;
  direction: "buy" | "sell";
  entryPrice: number;
  investment: number;
  payoutPercent: number;
  openedAt: number; // epoch ms
  durationSeconds: number;
  expiresAt: number; // epoch ms
}

interface TradingContextValue {
  // Selected Asset
  selectedAsset: TradingAsset | null;
  assets: TradingAsset[];
  setSelectedAsset: (asset: TradingAsset) => void;
  isLoadingAssets: boolean;

  // Live Market Data from WebSocket
  isWsConnected: boolean;
  currentPrice: number | null;
  prevPrice: number | null;
  chartPoints: ChartPoint[];
  quotes: MarketQuote[];
  selectedTrend: TrendAsset | null;

  // Chart configuration
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
  toggleChartType: () => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;

  // Trade inputs
  investment: number;
  setInvestment: (val: number | ((prev: number) => number)) => void;
  seconds: number;
  setSeconds: (val: number | ((prev: number) => number)) => void;

  // Actions
  executeTrade: (direction: "buy" | "sell") => Promise<void>;
  isPlacingTrade: boolean;

  // Active trades on the chart
  activeTrades: ActiveTradeMarker[];

  // Balance & Auth
  displayBalance: string;
  isAuthenticated: boolean;
}

const TradingContext = createContext<TradingContextValue | null>(null);

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, settings, availableBalance: authBalance } = useAuth();
  const { data: balanceData } = useBalanceQuery({ enabled: isAuthenticated });
  const { data: assets = [], isLoading: isLoadingAssets } = useAssetsQuery();

  const buyMutation = useBuyMutation();
  const sellMutation = useSellMutation();

  const defaultInvestment = useMemo(() => {
    if (settings?.default_investment) {
      const parsed = parseFloat(settings.default_investment);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 5;
  }, [settings?.default_investment]);

  const defaultSeconds = settings?.auto_close_seconds || 30;
  const preferredSymbol = settings?.selected_symbol;

  // User manually selected asset override
  const [userSelectedAsset, setUserSelectedAsset] = useState<TradingAsset | null>(null);

  // Compute selected asset: manual choice > preferred from settings > first available
  const selectedAsset = useMemo(() => {
    if (userSelectedAsset) return userSelectedAsset;
    if (assets.length === 0) return null;
    if (preferredSymbol) {
      const matched = assets.find(
        (a) => a.symbol === preferredSymbol || a.display_name.includes(preferredSymbol)
      );
      if (matched) return matched;
    }
    return assets[0] || null;
  }, [userSelectedAsset, assets, preferredSymbol]);

  // WebSocket connection for selected asset
  const activeAssetId = selectedAsset?.id || 1;
  const {
    isConnected: isWsConnected,
    chartPoints,
    currentPrice,
    prevPrice,
    quotes,
    selectedTrend,
  } = useMarketWebSocket(activeAssetId);

  // Chart settings
  const [chartType, setChartType] = useState<ChartType>("area");
  const [zoom, setZoom] = useState(100);

  const toggleChartType = useCallback(() => {
    setChartType((prev) => (prev === "area" ? "candles" : "area"));
  }, []);

  // Trade settings (derived from user settings or local overrides)
  const [customInvestment, setCustomInvestment] = useState<number | null>(null);
  const [customSeconds, setCustomSeconds] = useState<number | null>(null);

  const investment = customInvestment !== null ? customInvestment : defaultInvestment;

  const setInvestment = useCallback(
    (val: number | ((prev: number) => number)) => {
      setCustomInvestment((prev) => {
        const current = prev !== null ? prev : defaultInvestment;
        return typeof val === "function" ? val(current) : val;
      });
    },
    [defaultInvestment]
  );

  const seconds = customSeconds !== null ? customSeconds : defaultSeconds;

  const setSeconds = useCallback(
    (val: number | ((prev: number) => number)) => {
      setCustomSeconds((prev) => {
        const current = prev !== null ? prev : defaultSeconds;
        return typeof val === "function" ? val(current) : val;
      });
    },
    [defaultSeconds]
  );

  // Active trades tracking
  const [activeTrades, setActiveTrades] = useState<ActiveTradeMarker[]>([]);

  // Periodic cleanup of expired trades
  useEffect(() => {
    if (activeTrades.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setActiveTrades((prev) => prev.filter((t) => t.expiresAt > now));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTrades.length]);

  // Place trade handler
  const isPlacingTrade = buyMutation.isPending || sellMutation.isPending;

  const executeTrade = useCallback(
    async (direction: "buy" | "sell") => {
      if (!isAuthenticated) {
        toast.error("Please sign in to place trades");
        return;
      }
      if (!selectedAsset) {
        toast.error("Please select an asset to trade");
        return;
      }

      const payload = {
        asset_id: selectedAsset.id,
        symbol: selectedAsset.symbol,
        investment: investment.toFixed(2),
        auto_close_seconds: seconds,
      };

      const mutation = direction === "buy" ? buyMutation : sellMutation;

      mutation.mutate(payload, {
        onSuccess: (res) => {
          const deal = res.deal;
          const entryPrice =
            currentPrice ||
            (deal.entry_price ? parseFloat(deal.entry_price) : 0) ||
            (selectedAsset.price ? parseFloat(String(selectedAsset.price)) : 0);

          const now = Date.now();
          const marker: ActiveTradeMarker = {
            id: deal.id,
            symbol: deal.display_name || deal.symbol,
            direction,
            entryPrice,
            investment,
            payoutPercent: parseFloat(deal.payout_percent || selectedAsset.payout_percent || "80"),
            openedAt: now,
            durationSeconds: seconds,
            expiresAt: now + seconds * 1000,
          };

          setActiveTrades((prev) => [...prev, marker]);

          toast.success(
            `Deal placed: ${direction.toUpperCase()} ${selectedAsset.symbol} ($${investment.toFixed(2)})`
          );
        },
        onError: (err) => {
          toast.error(formatApiError(err));
        },
      });
    },
    [
      isAuthenticated,
      selectedAsset,
      investment,
      seconds,
      buyMutation,
      sellMutation,
      currentPrice,
    ]
  );

  // Computed display balance (defaults to 100000.00 matching /api/auth/me/ available_balance)
  const rawBalance = balanceData?.available_balance || authBalance || "100000.00";
  const displayBalance = useMemo(() => {
    const val = rawBalance || "100000.00";
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      return parsed.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return "100,000.00";
  }, [rawBalance]);

  return (
    <TradingContext.Provider
      value={{
        selectedAsset,
        assets,
        setSelectedAsset: setUserSelectedAsset,
        isLoadingAssets,
        isWsConnected,
        currentPrice,
        prevPrice,
        chartPoints,
        quotes,
        selectedTrend,
        chartType,
        setChartType,
        toggleChartType,
        zoom,
        setZoom,
        investment,
        setInvestment,
        seconds,
        setSeconds,
        executeTrade,
        isPlacingTrade,
        activeTrades,
        displayBalance,
        isAuthenticated,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  const ctx = useContext(TradingContext);
  if (!ctx) {
    throw new Error("useTrading must be used within a TradingProvider");
  }
  return ctx;
}
