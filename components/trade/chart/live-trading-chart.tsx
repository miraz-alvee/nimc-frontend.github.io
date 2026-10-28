"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useTrading, type ActiveTradeMarker } from "../trading-context";
import {
  Wifi,
  WifiOff,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Move,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChartPoint } from "@/apis";

interface SocialTradePin {
  id: string;
  pointIndexOffset: number; // offset from last point
  direction: "buy" | "sell";
  amount: number;
  avatarSeed: number;
}

export function LiveTradingChart() {
  const {
    currentPrice,
    prevPrice,
    isWsConnected,
    chartType,
    zoom,
    setZoom,
    selectedAsset,
    activeTrades,
    investment,
    seconds,
    getMarketSnapshot,
    subscribeMarketTicks,
  } = useTrading();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // High performance refs for 60/120fps frictionless mouse panning and hover
  const panXRef = useRef<number>(0);
  const panYRef = useRef<number>(0);
  const velocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const hoverPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const isSnappingRef = useRef<boolean>(false);
  const snapProgressRef = useRef<number>(1);
  const snapStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const dragStartRef = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
    time: number;
  }>({ x: 0, y: 0, panX: 0, panY: 0, time: 0 });

  // Minimal React state for UI triggers (only updated on drag end / snap)
  const [isPanned, setIsPanned] = useState(false);
  const [isDraggingUI, setIsDraggingUI] = useState(false);

  // Mirror dynamic React parameters into refs so the 60/120 FPS canvas loop reads them with 0 overhead
  const chartTypeRef = useRef(chartType);
  const zoomRef = useRef(zoom);
  const targetZoomRef = useRef(zoom);
  const selectedAssetRef = useRef(selectedAsset);
  const activeTradesRef = useRef(activeTrades);
  const investmentRef = useRef(investment);
  const secondsRef = useRef(seconds);

  useEffect(() => {
    chartTypeRef.current = chartType;
  }, [chartType]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    selectedAssetRef.current = selectedAsset;
    rawPointsRef.current = [];
    displayPriceRef.current = null;
    targetPriceRef.current = null;
    smoothCenterPriceRef.current = null;
    smoothRangeRef.current = null;
  }, [selectedAsset]);

  useEffect(() => {
    activeTradesRef.current = activeTrades;
  }, [activeTrades]);

  useEffect(() => {
    investmentRef.current = investment;
  }, [investment]);

  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  // Real-time market data buffer & LERP interpolation state
  const rawPointsRef = useRef<ChartPoint[]>([]);
  const targetPriceRef = useRef<number | null>(null);
  const displayPriceRef = useRef<number | null>(null);
  const prevDisplayPriceRef = useRef<number | null>(null);
  const pulseRef = useRef(0);

  // Real-time ECG Micro-Tick & Dynamic Bar Oscillation State
  const ecgPhaseRef = useRef<number>(0);
  const ecgJitterRef = useRef<number>(0);
  const ecgTargetJitterRef = useRef<number>(0);
  const lastEcgJumpTimeRef = useRef<number>(0);
  const currentCandleIndexRef = useRef<number>(-1);
  const liveCandleHighRef = useRef<number>(-Infinity);
  const liveCandleLowRef = useRef<number>(Infinity);
  const tradeAnchorsRef = useRef<Map<number, number>>(new Map());
  // Continuous forward wave time-flow state (rolling market tape progression)
  const timeScrollProgressRef = useRef<number>(0);
  // Smooth Y-axis camera tracking refs (prevents sudden vertical jumping/oscillating)
  const smoothCenterPriceRef = useRef<number | null>(null);
  const smoothRangeRef = useRef<number | null>(null);

  // Social trade markers along the historical line (matching Image 1)
  const socialPinsRef = useRef<SocialTradePin[]>([
    { id: "s1", pointIndexOffset: 45, direction: "buy", amount: 50, avatarSeed: 1 },
    { id: "s2", pointIndexOffset: 34, direction: "sell", amount: 205, avatarSeed: 2 },
    { id: "s3", pointIndexOffset: 26, direction: "buy", amount: 6, avatarSeed: 3 },
    { id: "s4", pointIndexOffset: 18, direction: "buy", amount: 1, avatarSeed: 4 },
    { id: "s5", pointIndexOffset: 11, direction: "sell", amount: 1000, avatarSeed: 5 },
    { id: "s6", pointIndexOffset: 7, direction: "buy", amount: 50, avatarSeed: 6 },
    { id: "s7", pointIndexOffset: 4, direction: "sell", amount: 20, avatarSeed: 7 },
  ]);

  // Synchronize target price and points immediately on mount and on tick
  useEffect(() => {
    const snap = getMarketSnapshot();
    if (snap.points.length > 0) {
      rawPointsRef.current = snap.points;
    }
    if (snap.currentPrice !== null) {
      targetPriceRef.current = snap.currentPrice;
      if (displayPriceRef.current === null) {
        displayPriceRef.current = snap.currentPrice;
      }
    }
  }, [getMarketSnapshot]);

  // Subscribe directly to high-frequency WebSocket ticks (0ms latency, bypasses React state queue)
  useEffect(() => {
    const unsubscribe = subscribeMarketTicks((newPrice: number, _timestamp: number, isInitialBatch?: boolean) => {
      targetPriceRef.current = newPrice;
      if (displayPriceRef.current === null || isInitialBatch) {
        displayPriceRef.current = newPrice;
      }
      if (isInitialBatch || rawPointsRef.current.length === 0) {
        const snap = getMarketSnapshot();
        if (snap.points.length > 0) {
          rawPointsRef.current = [...snap.points];
        }
      } else if (rawPointsRef.current.length > 0) {
        // Update latest historical point's price in place without replacing buffer
        rawPointsRef.current[rawPointsRef.current.length - 1].price = newPrice;
      }
    });
    return unsubscribe;
  }, [subscribeMarketTicks, getMarketSnapshot]);

  // Update target price when currentPrice updates from context as well
  useEffect(() => {
    if (currentPrice !== null) {
      targetPriceRef.current = currentPrice;
      if (displayPriceRef.current === null) {
        displayPriceRef.current = currentPrice;
      }
    }
  }, [currentPrice]);

  // Format price nicely
  const formatPrice = useCallback((price: number) => {
    if (price < 10) {
      return price.toLocaleString("en-US", {
        minimumFractionDigits: 5,
        maximumFractionDigits: 5,
      });
    }
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  // Format time (cached/reused)
  const formatTime = useCallback((timestamp: number) => {
    if (!timestamp) return "";
    const d = new Date(timestamp * 1000);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, []);

  // Smooth animated spring snap back to live market edge (ExpertOption style)
  const snapToLive = useCallback(() => {
    if (panXRef.current === 0 && panYRef.current === 0) return;
    snapStartRef.current = { x: panXRef.current, y: panYRef.current };
    snapProgressRef.current = 0;
    isSnappingRef.current = true;
    velocityRef.current = { vx: 0, vy: 0 };
    setIsPanned(false);
  }, []);

  // Pointer event handlers with pointer capture for buttery smooth mouse panning and kinetic momentum
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left mouse button
    isDraggingRef.current = true;
    isSnappingRef.current = false;
    velocityRef.current = { vx: 0, vy: 0 };

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panXRef.current,
      panY: panYRef.current,
      time: performance.now(),
    };
    setIsDraggingUI(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const now = performance.now();
    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      panXRef.current = dragStartRef.current.panX + dx;
      panYRef.current = dragStartRef.current.panY + dy;

      const dt = Math.max(1, now - dragStartRef.current.time);
      velocityRef.current = {
        vx: (dx / dt) * 16,
        vy: (dy / dt) * 16,
      };

      hoverPosRef.current = null;
    } else {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      hoverPosRef.current = { x, y };
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDraggingUI(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      const panned =
        Math.abs(panXRef.current) > 10 || Math.abs(panYRef.current) > 10;
      setIsPanned(panned);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    handlePointerUp(e);
  };

  // Silky smooth zoom on wheel
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 15 : -15;
    targetZoomRef.current = Math.min(400, Math.max(25, targetZoomRef.current + zoomDelta));
    setZoom(targetZoomRef.current);
  };

  // Main Canvas render loop (Runs continuously at native 60 / 120 / 144 FPS decoupled from React renders)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let lastFrameTime = performance.now();

    const render = (currentTime: number) => {
      const dt = Math.min(0.1, Math.max(0.001, (currentTime - lastFrameTime) / 1000));
      lastFrameTime = currentTime;

      // 1. Subtle pulse phase for live indicators
      pulseRef.current = (pulseRef.current + dt * 2.5) % (Math.PI * 2);

      // 2. Liquid LERP Price Interpolation (ExpertOption signature glide: 0ms jitter)
      if (targetPriceRef.current !== null) {
        if (displayPriceRef.current === null) {
          displayPriceRef.current = targetPriceRef.current;
        } else {
          // Exponential smoothing: settling within ~250ms with buttery smooth motion
          const lerpSpeed = 7.0;
          const factor = 1 - Math.exp(-dt * lerpSpeed);
          prevDisplayPriceRef.current = displayPriceRef.current;
          displayPriceRef.current += (targetPriceRef.current - displayPriceRef.current) * factor;

          if (Math.abs(displayPriceRef.current - targetPriceRef.current) < 0.0000005) {
            displayPriceRef.current = targetPriceRef.current;
          }
        }
      }

      // 3. Kinetic Momentum Physics (Friction decay when releasing drag)
      if (!isDraggingRef.current && !isSnappingRef.current) {
        const vx = velocityRef.current.vx;
        const vy = velocityRef.current.vy;
        if (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05) {
          panXRef.current += vx * dt * 60;
          panYRef.current += vy * dt * 60;
          const friction = Math.pow(0.92, dt * 60);
          velocityRef.current.vx *= friction;
          velocityRef.current.vy *= friction;
        }
      }

      // 4. Smooth Animated Snap-to-Live
      if (isSnappingRef.current) {
        snapProgressRef.current = Math.min(1, snapProgressRef.current + dt * 4.5);
        const t = snapProgressRef.current;
        const ease = 1 - Math.pow(1 - t, 3);
        panXRef.current = snapStartRef.current.x * (1 - ease);
        panYRef.current = snapStartRef.current.y * (1 - ease);
        if (snapProgressRef.current >= 1) {
          panXRef.current = 0;
          panYRef.current = 0;
          isSnappingRef.current = false;
        }
      }

      // 5. Canvas resolution & HiDPI scaling (strictly rounded integers to avoid continuous buffer recreation)
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const targetW = Math.max(1, Math.round(width * dpr));
      const targetH = Math.max(1, Math.round(height * dpr));

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      // Deep dark navy background with slight transparency (Image 1 style with backdrop image depth)
      ctx.fillStyle = "rgba(7, 22, 38, 0.88)";
      ctx.fillRect(0, 0, width, height);

      // Layout Margins matching Image 1
      const marginLeft = 85;
      const marginRight = 35;
      const marginTop = 70;
      const marginBottom = 85;

      const chartW = width - marginLeft - marginRight;
      const chartH = height - marginTop - marginBottom;

      if (chartW <= 0 || chartH <= 0) {
        ctx.restore();
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Ensure stable points array: if feed is buffering, synthesize clean baseline points so the chart never blinks empty
      const rawPoints = rawPointsRef.current;
      let points = rawPoints;
      if (points.length < 2) {
        const fallbackBase = displayPriceRef.current || targetPriceRef.current || 1.1147;
        const nowSec = Math.floor(Date.now() / 1000);
        points = Array.from({ length: 45 }, (_, i) => ({
          price: fallbackBase + Math.sin(i / 3) * 0.00015,
          recorded_at: nowSec - (45 - i) * 2,
          label: "",
        }));
      }
      let totalPoints = points.length;

      const currentPanX = panXRef.current;
      const currentPanY = panYRef.current;
      const currentHover = hoverPosRef.current;
      const isDragging = isDraggingRef.current;
      const currentZoom = zoomRef.current;
      const currentChartType = chartTypeRef.current;
      const trades = activeTradesRef.current;
      const currentSecs = secondsRef.current;
      const currentInv = investmentRef.current;
      const curAsset = selectedAssetRef.current;

      // Future Projection Zone (~30% on right for expiration & deadline lines, matching Image 1)
      const futureZoneWidth = Math.max(190, chartW * 0.30);
      const historyWidth = chartW - futureZoneWidth;

      // X scale & spacing based on zoom
      const visibleCount = Math.max(15, Math.round((45 * 100) / currentZoom));
      const spacing = historyWidth / Math.max(10, visibleCount - 1);

      // Real-time Smooth Fluid Market Oscillation (ExpertOption liquid motion, 0 shaking)
      const toNumPrice = (p: string | number): number =>
        typeof p === "number" ? p : parseFloat(String(p)) || 0;

      const basePrice =
        displayPriceRef.current !== null
          ? displayPriceRef.current
          : points[points.length - 1]
          ? toNumPrice(points[points.length - 1].price)
          : 1.1147;

      // Dynamic Asset Pip Scale Calibration
      let assetPip = 0.000015;
      if (basePrice > 20000) {
        assetPip = 2.5; // BTC
      } else if (basePrice > 1000) {
        assetPip = 0.35; // ETH / Gold
      } else if (basePrice > 100) {
        assetPip = 0.08; // Oil / Stocks
      } else if (basePrice > 5) {
        assetPip = 0.002;
      } else {
        assetPip = 0.000018; // Forex pairs (EUR/USD around 1.1147)
      }

      // Dual harmonic sine waves for silky smooth organic undulation (no shaking, zero discrete jumps)
      const tSec = currentTime / 1000;
      const primaryWave = Math.sin(tSec * 1.5);
      const secondaryWave = Math.sin(tSec * 0.65 + 1.1);
      const smoothWave = primaryWave * 0.65 + secondaryWave * 0.35;

      // Subtle sub-pip micro-breath (gentle ~0.08 pip, barely ~1px, zero wild up/down jumping)
      const smoothPriceOffset = smoothWave * (assetPip * 0.08);

      // Instantaneous active price moving with calm, liquid smoothness
      const activePriceVal = basePrice + smoothPriceOffset;

      // Continuous forward wave time-flow progression (market moves forward like an active wave)
      const stepDurationSec = 2.4; // 2.4 seconds per historical candle/point step
      if (!isDragging && !isSnappingRef.current) {
        timeScrollProgressRef.current += dt / stepDurationSec;
      }

      // Seamless buffer step advancement when a candle interval completes
      if (timeScrollProgressRef.current >= 1.0) {
        const steps = Math.floor(timeScrollProgressRef.current);
        timeScrollProgressRef.current -= steps;

        for (let s = 0; s < steps; s++) {
          const lastPt = rawPointsRef.current[rawPointsRef.current.length - 1];
          const nextSec =
            (lastPt?.recorded_at || Math.floor(Date.now() / 1000)) + Math.round(stepDurationSec);
          // Save authentic base market price into history (never artificial sine extremes)
          rawPointsRef.current.push({
            price: basePrice,
            recorded_at: nextSec,
            label: "",
          });

          if (rawPointsRef.current.length > 180) {
            rawPointsRef.current.shift();
            // Keep user trade pin markers locked to their exact candle!
            tradeAnchorsRef.current.forEach((val, key) => {
              tradeAnchorsRef.current.set(key, val - 1);
            });
            // Keep social trade markers anchored to their historical candles
            socialPinsRef.current.forEach((pin) => {
              pin.pointIndexOffset += 1;
            });
          }
        }
      }

      // Re-read points after advancement
      points = rawPointsRef.current.length > 0 ? rawPointsRef.current : points;
      totalPoints = points.length;
      const lastIdx = totalPoints - 1;

      // Sub-pixel continuous wave offset (glides smoothly from 0 to spacing)
      const flowOffset = (timeScrollProgressRef.current % 1.0) * spacing;

      // Live X position at panX = 0 (frontier boundary)
      const liveX = marginLeft + historyWidth;

      // Coordinate converter (index -> X) with continuous forward wave flow
      const getX = (idx: number) => {
        return liveX - (lastIdx - idx) * spacing - flowOffset + currentPanX;
      };

      // Live leading tick at the market edge (frontier)
      const liveTickX = liveX + currentPanX;

      // Find visible points range
      let firstVisibleIdx = 0;
      let lastVisibleIdx = lastIdx;

      for (let i = 0; i < totalPoints; i++) {
        if (getX(i) >= marginLeft - spacing * 2) {
          firstVisibleIdx = Math.max(0, i - 1);
          break;
        }
      }

      for (let i = lastIdx; i >= 0; i--) {
        if (getX(i) <= liveTickX + spacing * 2) {
          lastVisibleIdx = Math.min(lastIdx, i + 1);
          break;
        }
      }

      // Single-pass Min and Max calculation across visible points
      let minP = Infinity;
      let maxP = -Infinity;

      for (let i = firstVisibleIdx; i <= lastVisibleIdx; i++) {
        const pr = toNumPrice(points[i].price);
        if (pr < minP) minP = pr;
        if (pr > maxP) maxP = pr;
      }

      if (activePriceVal < minP) minP = activePriceVal;
      if (activePriceVal > maxP) maxP = activePriceVal;

      for (let t = 0; t < trades.length; t++) {
        const ep = trades[t].entryPrice;
        if (ep < minP) minP = ep;
        if (ep > maxP) maxP = ep;
      }

      if (minP === Infinity || maxP === -Infinity) {
        minP = activePriceVal - 0.0005;
        maxP = activePriceVal + 0.0005;
      }

      // Sensible minimum price spread so the chart never hyper-zooms into microscopic fluctuations
      const rawSpread = Math.max(0.00005, maxP - minP);
      const minSensibleSpread = Math.max(0.0006, basePrice * 0.0008);
      const effectiveSpread = Math.max(rawSpread, minSensibleSpread);
      const targetRange = effectiveSpread * 1.45 * (100 / currentZoom);
      const targetCenter = (minP + maxP) / 2;

      // Smooth camera interpolation on Y axis: keeps the chart grounded and stable with 0 vertical shaking
      if (smoothCenterPriceRef.current === null || smoothRangeRef.current === null) {
        smoothCenterPriceRef.current = targetCenter;
        smoothRangeRef.current = targetRange;
      } else {
        const cameraLerp = 1 - Math.exp(-dt * 3.5);
        smoothCenterPriceRef.current += (targetCenter - smoothCenterPriceRef.current) * cameraLerp;
        smoothRangeRef.current += (targetRange - smoothRangeRef.current) * cameraLerp;
      }

      const stableCenter = smoothCenterPriceRef.current;
      const stableRange = smoothRangeRef.current;

      const priceCenter = stableCenter - (currentPanY / chartH) * stableRange;
      const effectiveMinP = priceCenter - stableRange / 2;
      const effectiveMaxP = priceCenter + stableRange / 2;

      // Y coordinate from price value
      const getY = (val: number) => {
        return marginTop + chartH - ((val - effectiveMinP) / stableRange) * chartH;
      };

      // Live tick Y coordinate
      const liveTickY = getY(activePriceVal);

      // 1. Grid Lines (Horizontal dotted lines) & Left Price Scale Labels (Image 1 style)
      const gridLevels = 7;
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0, 146, 184, 0.12)";
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.font = "11px monospace, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      for (let i = 0; i <= gridLevels; i++) {
        const y = marginTop + (i / gridLevels) * chartH;
        const priceVal = effectiveMaxP - (i / gridLevels) * stableRange;

        // Horizontal dashed line
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(marginLeft, y);
        ctx.lineTo(width - marginRight, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Left price label
        ctx.fillText(formatPrice(priceVal), marginLeft - 12, y);
      }

      // 2. Vertical Grid Lines & Time Labels along Bottom (Gliding smoothly with the wave)
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const gridStep = Math.max(5, Math.round(visibleCount / 6));

      // Draw grid lines anchored to data points (gliding smoothly with time flow)
      for (let idx = firstVisibleIdx; idx <= lastVisibleIdx; idx++) {
        if (idx % gridStep === 0) {
          const gx = getX(idx);
          if (gx >= marginLeft && gx <= liveTickX + 10) {
            ctx.setLineDash([2, 5]);
            ctx.strokeStyle = "rgba(0, 146, 184, 0.10)";
            ctx.beginPath();
            ctx.moveTo(gx, marginTop);
            ctx.lineTo(gx, marginTop + chartH);
            ctx.stroke();
            ctx.setLineDash([]);

            if (points[idx] && gx >= marginLeft + 25 && gx <= liveTickX - 15) {
              ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
              ctx.font = "10px monospace, sans-serif";
              ctx.fillText(formatTime(points[idx].recorded_at), gx, marginTop + chartH + 10);
            }
          }
        }
      }

      // Draw future zone grid lines projected forward in time
      const futureGridSteps = 3;
      for (let f = 1; f <= futureGridSteps; f++) {
        const futureGx = liveTickX + f * (gridStep * spacing);
        if (futureGx <= width - marginRight) {
          ctx.setLineDash([2, 5]);
          ctx.strokeStyle = "rgba(0, 146, 184, 0.08)";
          ctx.beginPath();
          ctx.moveTo(futureGx, marginTop);
          ctx.lineTo(futureGx, marginTop + chartH);
          ctx.stroke();
          ctx.setLineDash([]);

          const futureSec = Math.round(f * gridStep * stepDurationSec);
          ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
          ctx.font = "10px monospace, sans-serif";
          ctx.fillText(`+${futureSec}s`, futureGx, marginTop + chartH + 10);
        }
      }

      // 3. Render Chart: Area Line OR Real-Time Animated Candlesticks
      if (lastVisibleIdx > firstVisibleIdx) {
        if (currentChartType === "area") {
          // --- AREA CHART MODE (EXACTLY MATCHING IMAGE 1) ---

          // Area gradient fill underneath the line
          const gradient = ctx.createLinearGradient(0, marginTop, 0, marginTop + chartH);
          gradient.addColorStop(0, "rgba(0, 180, 255, 0.25)");
          gradient.addColorStop(0.6, "rgba(0, 120, 170, 0.08)");
          gradient.addColorStop(1, "rgba(7, 22, 38, 0.0)");

          ctx.beginPath();
          ctx.moveTo(getX(firstVisibleIdx), marginTop + chartH);

          // Build authentic financial step-line segments with subtle micro-fillet (matching Image 1)
          for (let k = firstVisibleIdx; k <= lastVisibleIdx; k++) {
            const x = getX(k);
            const y = getY(toNumPrice(points[k].price));

            if (k === firstVisibleIdx) {
              ctx.lineTo(x, y);
            } else {
              const prevX = getX(k - 1);
              const prevY = getY(toNumPrice(points[k - 1].price));
              const midX = (prevX + x) / 2;
              // Gentle transition that preserves authentic financial price levels
              ctx.lineTo(midX, prevY);
              ctx.lineTo(x, y);
            }
          }

          // Seamless leading wave connection into the live tick!
          const lastHistX = getX(lastIdx);
          const lastHistY = getY(toNumPrice(points[lastIdx].price));
          const midLiveX = (lastHistX + liveTickX) / 2;
          ctx.lineTo(midLiveX, lastHistY);
          ctx.lineTo(liveTickX, liveTickY);

          // Close gradient fill cleanly at the live tick (stops at live edge, never fills into future zone)
          ctx.lineTo(liveTickX, marginTop + chartH);
          ctx.closePath();
          ctx.fillStyle = gradient;
          ctx.fill();

          // Crisp electric cyan line stroke (sharp & clean, matching Image 1)
          ctx.beginPath();
          for (let k = firstVisibleIdx; k <= lastVisibleIdx; k++) {
            const x = getX(k);
            const y = getY(toNumPrice(points[k].price));

            if (k === firstVisibleIdx) {
              ctx.moveTo(x, y);
            } else {
              const prevX = getX(k - 1);
              const prevY = getY(toNumPrice(points[k - 1].price));
              const midX = (prevX + x) / 2;
              ctx.lineTo(midX, prevY);
              ctx.lineTo(x, y);
            }
          }
          ctx.lineTo(midLiveX, lastHistY);
          ctx.lineTo(liveTickX, liveTickY);

          ctx.strokeStyle = "#00C8FF";
          ctx.lineWidth = 2.0;
          ctx.stroke();

        } else {
          // --- CANDLESTICKS / BAR MODE (REAL-TIME ECG OSCILLATION & DYNAMIC BODY EXPANSION) ---
          const candleW = Math.max(4, spacing * 0.65);

          // Update running live high and low of the active candle
          const prevPtLast = lastIdx > 0 ? points[lastIdx - 1] : points[lastIdx];
          const activeOpen = toNumPrice(prevPtLast.price);

          if (currentCandleIndexRef.current !== lastIdx) {
            currentCandleIndexRef.current = lastIdx;
            liveCandleHighRef.current = Math.max(activeOpen, activePriceVal);
            liveCandleLowRef.current = Math.min(activeOpen, activePriceVal);
          } else {
            if (activePriceVal > liveCandleHighRef.current) liveCandleHighRef.current = activePriceVal;
            if (activePriceVal < liveCandleLowRef.current) liveCandleLowRef.current = activePriceVal;
          }

          for (let idx = firstVisibleIdx; idx <= lastVisibleIdx; idx++) {
            const pt = points[idx];
            const x = getX(idx);
            const prevPt = idx > 0 ? points[idx - 1] : pt;

            const open = toNumPrice(prevPt.price);
            const isLiveCandle = idx === lastIdx;
            // The latest active candle's close tracks the real-time ECG price!
            const close = isLiveCandle ? activePriceVal : toNumPrice(pt.price);
            const diff = Math.abs(close - open);

            let high = Math.max(open, close) + diff * 0.25;
            let low = Math.min(open, close) - diff * 0.25;

            // Live candle expands wicks to engulf the real-time ECG price peaks and troughs!
            if (isLiveCandle) {
              high = Math.max(liveCandleHighRef.current, open, close);
              low = Math.min(liveCandleLowRef.current, open, close);
            }

            const isBull = close >= open;
            const color = isBull ? "#00E676" : "#FF2E4D";

            const yHigh = getY(high);
            const yLow = getY(low);
            const yOpen = getY(open);
            const yClose = getY(close);

            // Center Wick
            ctx.strokeStyle = color;
            ctx.lineWidth = isLiveCandle ? 1.5 : 1.2;
            ctx.beginPath();
            ctx.moveTo(x, yHigh);
            ctx.lineTo(x, yLow);
            ctx.stroke();

            // Candle Body (physically pulses and stretches up and down like an ECG!)
            const bodyY = Math.min(yOpen, yClose);
            const bodyH = Math.max(2.5, Math.abs(yClose - yOpen));
            ctx.fillStyle = isBull ? "rgba(0, 230, 118, 0.70)" : "rgba(255, 46, 77, 0.70)";
            ctx.fillRect(x - candleW / 2, bodyY, candleW, bodyH);

            ctx.strokeStyle = color;
            ctx.lineWidth = isLiveCandle ? 1.5 : 1.2;
            ctx.strokeRect(x - candleW / 2, bodyY, candleW, bodyH);
          }
        }
      }

      // 4. Social Trade Pins along the Historical Line (Matching Image 1)
      const socialPins = socialPinsRef.current;
      socialPins.forEach((pin) => {
        const pinIdx = lastIdx - pin.pointIndexOffset;
        if (pinIdx >= firstVisibleIdx && pinIdx < lastIdx) {
          const pinPt = points[pinIdx];
          const px = getX(pinIdx);
          const py = getY(toNumPrice(pinPt.price));

          if (px >= marginLeft && px <= liveTickX - 10) {
            const isBuy = pin.direction === "buy";
            const pinColor = isBuy ? "#00E676" : "#FF2E4D";
            const pinRadius = 7;

            // Outer avatar disc with glowing border
            ctx.beginPath();
            ctx.arc(px, py, pinRadius + 1.5, 0, Math.PI * 2);
            ctx.strokeStyle = pinColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(px, py, pinRadius, 0, Math.PI * 2);
            ctx.fillStyle = "#05293A";
            ctx.fill();

            // Minimal avatar silhouette
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.arc(px, py - 1.5, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(px, py + 4, 3.5, Math.PI, Math.PI * 2);
            ctx.fill();

            // Tag badge underneath/above (matching Image 1 tags like $50, $1, $1000)
            const tagText = `$${pin.amount}`;
            ctx.font = "bold 9px monospace, sans-serif";
            const tagW = ctx.measureText(tagText).width + 8;
            const tagH = 14;
            const tagX = px - tagW / 2;
            const tagY = isBuy ? py + pinRadius + 3 : py - pinRadius - tagH - 3;

            ctx.fillStyle = "rgba(4, 32, 45, 0.9)";
            ctx.strokeStyle = pinColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(tagX, tagY, tagW, tagH, 3);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = pinColor;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(tagText, px, tagY + tagH / 2);
          }
        }
      });

      // 5. Local High Peak & Low Trough Badges (Matching Image 1: 1.114710 & 1.114535)
      if (lastVisibleIdx - firstVisibleIdx > 6) {
        let maxVisiblePrice = -Infinity;
        let minVisiblePrice = Infinity;
        let peakIdx = firstVisibleIdx;
        let troughIdx = firstVisibleIdx;

        for (let idx = firstVisibleIdx; idx <= lastVisibleIdx; idx++) {
          const pr = idx === lastIdx ? activePriceVal : toNumPrice(points[idx].price);
          if (pr > maxVisiblePrice) {
            maxVisiblePrice = pr;
            peakIdx = idx;
          }
          if (pr < minVisiblePrice) {
            minVisiblePrice = pr;
            troughIdx = idx;
          }
        }

        // Peak Pill (Image 1 style)
        const peakX = getX(peakIdx);
        const peakY = getY(maxVisiblePrice);
        if (peakX >= marginLeft && peakX <= width - marginRight) {
          const peakText = formatPrice(maxVisiblePrice);
          ctx.font = "bold 10px monospace, sans-serif";
          const pW = ctx.measureText(peakText).width + 12;
          const pH = 18;
          const pBadgeX = peakX - pW / 2;
          const pBadgeY = peakY - pH - 6;

          ctx.strokeStyle = "rgba(0, 229, 255, 0.4)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(peakX, peakY);
          ctx.lineTo(peakX, peakY - 6);
          ctx.stroke();

          ctx.fillStyle = "rgba(5, 33, 47, 0.95)";
          ctx.strokeStyle = "rgba(0, 229, 255, 0.5)";
          ctx.beginPath();
          ctx.roundRect(pBadgeX, pBadgeY, pW, pH, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(peakText, peakX, pBadgeY + pH / 2);
        }

        // Trough Pill (Image 1 style)
        const troughX = getX(troughIdx);
        const troughY = getY(minVisiblePrice);
        if (troughX >= marginLeft && troughX <= width - marginRight) {
          const troughText = formatPrice(minVisiblePrice);
          ctx.font = "bold 10px monospace, sans-serif";
          const tW = ctx.measureText(troughText).width + 12;
          const tH = 18;
          const tBadgeX = troughX - tW / 2;
          const tBadgeY = troughY + 6;

          ctx.strokeStyle = "rgba(255, 46, 77, 0.4)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(troughX, troughY);
          ctx.lineTo(troughX, troughY + 6);
          ctx.stroke();

          ctx.fillStyle = "rgba(5, 33, 47, 0.95)";
          ctx.strokeStyle = "rgba(255, 46, 77, 0.5)";
          ctx.beginPath();
          ctx.roundRect(tBadgeX, tBadgeY, tW, tH, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(troughText, troughX, tBadgeY + tH / 2);
        }
      }

      // 6. Active Trades with Future Expiration Lines & Deadlines (Matching Image 1)
      const nowMs = Date.now();
      const futureZoneW = futureZoneWidth;
      const expiryLineX = liveTickX + futureZoneW * 0.65;
      const deadlineOrangeX = liveTickX + futureZoneW * 0.90;

      if (trades.length > 0) {
        trades.forEach((trade: ActiveTradeMarker) => {
          const remainingSec = Math.max(0, Math.ceil((trade.expiresAt - nowMs) / 1000));

          // Anchor trade pin to its historical candle index so it NEVER slides across the screen
          if (!tradeAnchorsRef.current.has(trade.id)) {
            const anchor = typeof trade.entryIndex === "number" ? trade.entryIndex : lastIdx;
            tradeAnchorsRef.current.set(trade.id, anchor);
          }
          const anchorIdx = tradeAnchorsRef.current.get(trade.id) ?? lastIdx;
          const entryX = getX(anchorIdx);
          const tradeY = getY(trade.entryPrice);

          const isBuy = trade.direction === "buy";
          const inProfit = isBuy
            ? activePriceVal >= trade.entryPrice
            : activePriceVal <= trade.entryPrice;

          const tradeColor = inProfit ? "#00E676" : "#FF2E4D";

          // Horizontal strike price line ONLY from trade entry pin to the vertical Expiration Line (Image 1 style)
          ctx.beginPath();
          ctx.moveTo(entryX, tradeY);
          ctx.lineTo(expiryLineX, tradeY);
          ctx.strokeStyle = tradeColor;
          ctx.lineWidth = 1.8;
          ctx.stroke();

          // Vertical Expiration Line
          ctx.beginPath();
          ctx.moveTo(expiryLineX, marginTop);
          ctx.lineTo(expiryLineX, marginTop + chartH);
          ctx.strokeStyle = tradeColor;
          ctx.lineWidth = 1.8;
          ctx.stroke();

          // Countdown tag on top of Expiration Line
          ctx.font = "bold 10px monospace, sans-serif";
          const expText = `${remainingSec}s`;
          const expW = ctx.measureText(expText).width + 10;
          const expH = 16;
          ctx.fillStyle = tradeColor;
          ctx.beginPath();
          ctx.roundRect(expiryLineX - expW / 2, marginTop - expH - 4, expW, expH, 4);
          ctx.fill();
          ctx.fillStyle = "#053345";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(expText, expiryLineX, marginTop - expH / 2 - 4);

          // Orange Purchase Deadline Line
          ctx.beginPath();
          ctx.moveTo(deadlineOrangeX, marginTop);
          ctx.lineTo(deadlineOrangeX, marginTop + chartH);
          ctx.strokeStyle = "#FF8000";
          ctx.lineWidth = 1.8;
          ctx.stroke();

          // Entry Pin Badge (Image 1 style)
          if (entryX >= marginLeft - 30 && entryX <= width - marginRight) {
            const pinRadius = 12;

            // Outer ring
            ctx.beginPath();
            ctx.arc(entryX, tradeY, pinRadius + 2, 0, Math.PI * 2);
            ctx.strokeStyle = tradeColor;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner dark disc
            ctx.fillStyle = "#052330";
            ctx.beginPath();
            ctx.arc(entryX, tradeY, pinRadius, 0, Math.PI * 2);
            ctx.fill();

            // Direction Arrow
            ctx.fillStyle = tradeColor;
            ctx.font = "bold 10px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(isBuy ? "▲" : "▼", entryX, tradeY);

            // Amount pill (e.g. $15.00 ▲)
            const amtText = `$${trade.investment.toFixed(2)}`;
            ctx.font = "bold 10px monospace, sans-serif";
            const amtW = ctx.measureText(amtText).width + 16;
            const amtH = 18;
            const amtX = entryX - amtW / 2;
            const amtY = isBuy ? tradeY - pinRadius - amtH - 4 : tradeY + pinRadius + 4;

            ctx.fillStyle = tradeColor;
            ctx.beginPath();
            ctx.roundRect(amtX, amtY, amtW, amtH, 4);
            ctx.fill();

            ctx.fillStyle = "#053345";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`${amtText} ${isBuy ? "▲" : "▼"}`, entryX, amtY + amtH / 2);
          }
        });
      } else {
        // Preview lines when no active trades (Image 1 layout)
        const previewExpiryX = liveTickX + futureZoneW * 0.65;
        const previewOrangeX = liveTickX + futureZoneW * 0.90;

        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(previewExpiryX, marginTop);
        ctx.lineTo(previewExpiryX, marginTop + chartH);
        ctx.strokeStyle = "rgba(0, 230, 118, 0.45)";
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(previewOrangeX, marginTop);
        ctx.lineTo(previewOrangeX, marginTop + chartH);
        ctx.strokeStyle = "rgba(255, 128, 0, 0.45)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 7. Latest Live Price Tick, Smooth Breathing Halo, and Forward Guideline
      const glowHalo = 7 + Math.sin(pulseRef.current) * 1.8;
      ctx.beginPath();
      ctx.arc(liveTickX, liveTickY, glowHalo, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 229, 255, 0.22)";
      ctx.fill();

      // Solid center glowing dot
      ctx.beginPath();
      ctx.arc(liveTickX, liveTickY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "#00E5FF";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Horizontal dashed line from left axis through live tick
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = "rgba(0, 163, 255, 0.65)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(marginLeft, liveTickY);
      ctx.lineTo(liveTickX, liveTickY);
      ctx.stroke();

      // Forward guideline extending across future projection zone (matching Image 1)
      ctx.strokeStyle = "rgba(0, 229, 255, 0.55)";
      ctx.beginPath();
      ctx.moveTo(liveTickX, liveTickY);
      ctx.lineTo(width - marginRight, liveTickY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 8. Left Price Pill & Stacked Payout Tags (EXACTLY MATCHING IMAGE 1)
      const livePriceText = formatPrice(activePriceVal);
      const pillW = 74;
      const pillH = 22;
      const pillX = marginLeft - pillW - 6;
      const pillY = liveTickY - pillH / 2;

      // Left blue rounded pill
      ctx.fillStyle = "#0091EA";
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 5);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 11px monospace, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(livePriceText, pillX + pillW / 2, liveTickY);

      // Stacked Green Profit & Red Loss Tags (Image 1 style)
      const payoutPct = curAsset?.payout_percent
        ? parseFloat(curAsset.payout_percent)
        : 86;
      const estProfitStr = (currentInv * (payoutPct / 100)).toFixed(2);
      const estLossStr = currentInv.toFixed(2);

      ctx.font = "bold 9px monospace, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "#00E676";
      ctx.fillText(`+$${estProfitStr}`, marginLeft + 4, liveTickY - 1);

      ctx.textBaseline = "top";
      ctx.fillStyle = "#FF2E4D";
      ctx.fillText(`-$${estLossStr}`, marginLeft + 4, liveTickY + 2);

      // 9. Interactive Crosshair & Cursor Tooltip
      if (
        currentHover &&
        currentHover.x >= marginLeft &&
        currentHover.x <= width - marginRight &&
        currentHover.y >= marginTop &&
        currentHover.y <= marginTop + chartH &&
        !isDragging
      ) {
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1;

        // Vertical crosshair
        ctx.beginPath();
        ctx.moveTo(currentHover.x, marginTop);
        ctx.lineTo(currentHover.x, marginTop + chartH);
        ctx.stroke();

        // Horizontal crosshair
        ctx.beginPath();
        ctx.moveTo(marginLeft, currentHover.y);
        ctx.lineTo(width - marginRight, currentHover.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Left axis crosshair price pill
        const cursorPrice =
          effectiveMaxP - ((currentHover.y - marginTop) / chartH) * stableRange;
        const cPriceText = formatPrice(cursorPrice);
        const cPillW = 74;
        const cPillH = 20;

        ctx.fillStyle = "rgba(5, 51, 69, 0.95)";
        ctx.strokeStyle = "#00E5FF";
        ctx.beginPath();
        ctx.roundRect(marginLeft - cPillW - 6, currentHover.y - cPillH / 2, cPillW, cPillH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "10px monospace, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(cPriceText, marginLeft - 6 - cPillW / 2, currentHover.y);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [formatPrice, formatTime]);

  const isUpTick =
    prevPrice !== null && currentPrice !== null && currentPrice >= prevPrice;

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 z-0 overflow-hidden font-albert-sans select-none touch-none px-25",
        isDraggingUI ? "cursor-grabbing" : "cursor-grab"
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onDoubleClick={snapToLive}
      onWheel={handleWheel}
    >
      {/* Live Market & Asset Badge (Top Left) */}
      <div className="absolute left-28 top-6 z-20 flex items-center gap-3 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#0092B8]/40 bg-[#053345]/85 backdrop-blur shadow-md">
          {isWsConnected ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#00E676]">
              <span className="relative flex size-2 items-center justify-center">
                <span className="size-2 rounded-full bg-[#00E676] shadow-[0_0_8px_#00E676]" />
              </span>
              <Wifi className="size-3.5" />
              <span>LIVE WS</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#FFB300]">
              <WifiOff className="size-3.5" />
              <span>Connecting...</span>
            </div>
          )}

          {selectedAsset && (
            <>
              <div className="h-3 w-0.5 bg-white/20" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-wide">
                  {selectedAsset.display_name || selectedAsset.symbol}
                </span>
                {currentPrice !== null && (
                  <span
                    className={cn(
                      "text-xs font-mono font-medium flex items-center gap-0.5 transition-colors",
                      isUpTick ? "text-[#00E676]" : "text-[#FF2E4D]"
                    )}
                  >
                    {isUpTick ? (
                      <TrendingUp className="size-3" />
                    ) : (
                      <TrendingDown className="size-3" />
                    )}
                    {formatPrice(currentPrice)}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Circular "Snap to Live Edge" Button (ExpertOption style, matching Image 1) */}
      <div className="absolute right-35 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 pointer-events-auto">
        {isPanned && (
          <span className="text-[10px] text-[#00E5FF] font-semibold bg-[#031d27]/95 px-2 py-0.5 rounded-full border border-[#00E5FF]/40 shadow">
            Live
          </span>
        )}
      </div>

      {/* Dragging / Pan info badge */}
      {isPanned && (
        <div className="absolute left-1/2 bottom-20 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-2 px-3 py-1 rounded-full bg-[#053345]/90 border border-[#00E5FF]/40 text-xs text-white/80 shadow">
          <Move className="size-3 text-[#00E5FF]" />
          <span>Chart panned • Double-click or click arrow to snap to live</span>
          <button
            type="button"
            onClick={snapToLive}
            className="pointer-events-auto ml-1 text-[11px] font-semibold text-[#00E5FF] hover:underline flex items-center gap-1"
          >
            <RotateCcw className="size-3" /> Reset
          </button>
        </div>
      )}

      {/* HTML5 Canvas */}
      <canvas ref={canvasRef} className="size-full block" />
    </div>
  );
}
