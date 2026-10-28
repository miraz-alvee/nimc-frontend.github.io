"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ChartPoint, MarketQuote, TrendAsset } from "../types/trading.types";

export interface MarketSnapshot {
  points: ChartPoint[];
  currentPrice: number | null;
  prevPrice: number | null;
  quotes: MarketQuote[];
  selectedTrend: TrendAsset | null;
  isConnected: boolean;
}

export type TickListener = (price: number, timestamp: number, isInitialBatch?: boolean) => void;

export interface UseMarketWebSocketReturn {
  isConnected: boolean;
  chartPoints: ChartPoint[];
  currentPrice: number | null;
  prevPrice: number | null;
  quotes: MarketQuote[];
  selectedTrend: TrendAsset | null;
  reconnect: () => void;
  // High-performance direct access for 60/120fps Canvas rendering
  getSnapshot: () => MarketSnapshot;
  subscribeTicks: (listener: TickListener) => () => void;
}

export function getMarketWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (base.startsWith("https://")) {
    return base.replace("https://", "wss://") + "/ws/market/";
  }
  if (base.startsWith("http://")) {
    return base.replace("http://", "ws://") + "/ws/market/";
  }
  return "wss://ni-amc.sobhoy.com/ws/market/";
}

export function useMarketWebSocket(assetId: number): UseMarketWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<TrendAsset | null>(null);

  // Synchronous high-performance buffer refs for 60/120 FPS canvas loop
  const pointsBufferRef = useRef<ChartPoint[]>([]);
  const currentPriceRef = useRef<number | null>(null);
  const prevPriceRef = useRef<number | null>(null);
  const quotesRef = useRef<MarketQuote[]>([]);
  const selectedTrendRef = useRef<TrendAsset | null>(null);
  const isConnectedRef = useRef<boolean>(false);
  const tickListenersRef = useRef<Set<TickListener>>(new Set());

  // Throttled UI state synchronization timer
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUiUpdateRef = useRef<boolean>(false);

  const [prevAssetId, setPrevAssetId] = useState(assetId);
  if (prevAssetId !== assetId) {
    setPrevAssetId(assetId);
    pointsBufferRef.current = [];
    currentPriceRef.current = null;
    prevPriceRef.current = null;
    setChartPoints([]);
    setCurrentPrice(null);
    setPrevPrice(null);
  }

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeAssetIdRef = useRef<number>(assetId);
  const connectRef = useRef<() => void>(() => {});

  // Direct tick subscription method
  const subscribeTicks = useCallback((listener: TickListener) => {
    tickListenersRef.current.add(listener);
    return () => {
      tickListenersRef.current.delete(listener);
    };
  }, []);

  const getSnapshot = useCallback((): MarketSnapshot => {
    return {
      points: pointsBufferRef.current,
      currentPrice: currentPriceRef.current,
      prevPrice: prevPriceRef.current,
      quotes: quotesRef.current,
      selectedTrend: selectedTrendRef.current,
      isConnected: isConnectedRef.current,
    };
  }, []);

  // Flush pending market updates to React state in a throttled schedule (e.g. ~10Hz)
  const scheduleUiSync = useCallback(() => {
    if (throttleTimeoutRef.current) return;
    pendingUiUpdateRef.current = true;

    throttleTimeoutRef.current = setTimeout(() => {
      throttleTimeoutRef.current = null;
      if (pendingUiUpdateRef.current) {
        pendingUiUpdateRef.current = false;
        setCurrentPrice(currentPriceRef.current);
        setPrevPrice(prevPriceRef.current);
        setChartPoints([...pointsBufferRef.current]);
        setQuotes([...quotesRef.current]);
      }
    }, 100);
  }, []);

  // Keep ref up to date
  useEffect(() => {
    activeAssetIdRef.current = assetId;
  }, [assetId]);

  const sendSubscription = useCallback((ws: WebSocket, id: number) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(
          JSON.stringify({
            action: "subscribe",
            feeds: ["quotes", "chart", "trends"],
            asset_id: id,
          })
        );
      } catch (err) {
        console.warn("Failed to send WS subscription:", err);
      }
    }
  }, []);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const url = getMarketWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        isConnectedRef.current = true;
        setIsConnected(true);
        sendSubscription(ws, activeAssetIdRef.current);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "chart" && msg.points && msg.asset_id === activeAssetIdRef.current) {
            const rawPoints: ChartPoint[] = msg.points;
            if (rawPoints.length > 0) {
              const wasEmpty = pointsBufferRef.current.length === 0;
              if (wasEmpty) {
                pointsBufferRef.current = rawPoints.slice(-300);
              } else {
                const map = new Map<number, ChartPoint>();
                pointsBufferRef.current.forEach((p) => map.set(p.recorded_at, p));
                rawPoints.forEach((p) => map.set(p.recorded_at, p));
                pointsBufferRef.current = Array.from(map.values())
                  .sort((a, b) => a.recorded_at - b.recorded_at)
                  .slice(-300);
              }

              const latest = rawPoints[rawPoints.length - 1];
              if (latest && latest.price) {
                const p = parseFloat(String(latest.price));
                if (!isNaN(p)) {
                  prevPriceRef.current = currentPriceRef.current;
                  currentPriceRef.current = p;
                  // Only notify as initialBatch if buffer was empty
                  tickListenersRef.current.forEach((cb) => cb(p, latest.recorded_at, wasEmpty));
                }
              }
              scheduleUiSync();
            }
          } else if (msg.type === "quotes" && Array.isArray(msg.quotes)) {
            quotesRef.current = msg.quotes;
            const matchingQuote = msg.quotes.find(
              (q: MarketQuote) => q.id === activeAssetIdRef.current
            );
            if (matchingQuote && matchingQuote.price) {
              const p = parseFloat(String(matchingQuote.price));
              if (!isNaN(p)) {
                prevPriceRef.current = currentPriceRef.current;
                currentPriceRef.current = p;

                const qTime =
                  typeof matchingQuote.time === "number" && matchingQuote.time > 0
                    ? matchingQuote.time
                    : Math.floor(Date.now() / 1000);

                // Update the active candle / latest point's price in place smoothly
                const buf = pointsBufferRef.current;
                if (buf.length > 0) {
                  const lastPt = buf[buf.length - 1];
                  lastPt.price = p;
                } else {
                  buf.push({
                    price: p,
                    recorded_at: qTime,
                    label: "",
                  });
                }

                // Notify direct 60/120 FPS subscribers with 0ms delay!
                tickListenersRef.current.forEach((cb) => cb(p, qTime, false));
                scheduleUiSync();
              }
            }
          } else if (msg.type === "trends" && msg.selected) {
            selectedTrendRef.current = msg.selected;
            setSelectedTrend(msg.selected);
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onerror = () => {
        isConnectedRef.current = false;
        setIsConnected(false);
      };

      ws.onclose = () => {
        isConnectedRef.current = false;
        setIsConnected(false);
        wsRef.current = null;
        reconnectTimeoutRef.current = setTimeout(() => {
          connectRef.current();
        }, 2000);
      };
    } catch {
      isConnectedRef.current = false;
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectRef.current();
      }, 3000);
    }
  }, [sendSubscription, scheduleUiSync]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Handle asset switch (re-subscribe)
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      sendSubscription(wsRef.current, assetId);
    }
  }, [assetId, sendSubscription]);

  // Initial connect & cleanup
  useEffect(() => {
    connectRef.current();

    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return {
    isConnected,
    chartPoints,
    currentPrice,
    prevPrice,
    quotes,
    selectedTrend,
    reconnect: connect,
    getSnapshot,
    subscribeTicks,
  };
}
