"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ChartPoint, MarketQuote, TrendAsset } from "../types/trading.types";

export interface UseMarketWebSocketReturn {
  isConnected: boolean;
  chartPoints: ChartPoint[];
  currentPrice: number | null;
  prevPrice: number | null;
  quotes: MarketQuote[];
  selectedTrend: TrendAsset | null;
  reconnect: () => void;
}

export function getMarketWsUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (base.startsWith("https://")) {
    return base.replace("https://", "wss://") + "/ws/market/";
  }
  if (base.startsWith("http://")) {
    return base.replace("http://", "ws://") + "/ws/market/";
  }
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/ws/market/`;
  }
  return "ws://10.10.26.232:8080/ws/market/";
}

export function useMarketWebSocket(assetId: number): UseMarketWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<TrendAsset | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeAssetIdRef = useRef<number>(assetId);
  const connectRef = useRef<() => void>(() => {});

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
        setIsConnected(true);
        sendSubscription(ws, activeAssetIdRef.current);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "chart" && msg.points && msg.asset_id === activeAssetIdRef.current) {
            setChartPoints(msg.points);
            const latest = msg.points[msg.points.length - 1];
            if (latest && latest.price) {
              const p = parseFloat(String(latest.price));
              if (!isNaN(p)) {
                setCurrentPrice((prev) => {
                  setPrevPrice(prev);
                  return p;
                });
              }
            }
          } else if (msg.type === "quotes" && Array.isArray(msg.quotes)) {
            setQuotes(msg.quotes);
            const matchingQuote = msg.quotes.find(
              (q: MarketQuote) => q.id === activeAssetIdRef.current
            );
            if (matchingQuote && matchingQuote.price) {
              const p = parseFloat(String(matchingQuote.price));
              if (!isNaN(p)) {
                setCurrentPrice((prev) => {
                  setPrevPrice(prev);
                  return p;
                });
              }
            }
          } else if (msg.type === "trends" && msg.selected) {
            setSelectedTrend(msg.selected);
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        // Auto-reconnect after 2 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectRef.current();
        }, 2000);
      };
    } catch {
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectRef.current();
      }, 3000);
    }
  }, [sendSubscription]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Handle asset switch
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      sendSubscription(wsRef.current, assetId);
    }
  }, [assetId, sendSubscription]);

  // Initial connect & cleanup
  useEffect(() => {
    connectRef.current();

    return () => {
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
  };
}
