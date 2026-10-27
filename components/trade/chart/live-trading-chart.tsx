"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useTrading, type ActiveTradeMarker } from "../trading-context";
import { Wifi, WifiOff, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function LiveTradingChart() {
  const {
    chartPoints,
    currentPrice,
    prevPrice,
    isWsConnected,
    chartType,
    zoom,
    selectedAsset,
    activeTrades,
  } = useTrading();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Mouse hover state for crosshair
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Price tick animation (green on up, red on down)
  const isUpTick = prevPrice !== null && currentPrice !== null && currentPrice >= prevPrice;

  // Pulse animation frame reference
  const pulseRef = useRef(0);

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

  // Format time
  const formatTime = useCallback((timestamp: number) => {
    if (!timestamp) return "";
    const d = new Date(timestamp * 1000);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, []);

  // Filter and compute points based on zoom
  const visiblePoints = useMemo(() => {
    if (!chartPoints || chartPoints.length === 0) return [];

    // Higher zoom focuses on fewer recent points; lower zoom shows more history.
    const pointCount = Math.max(
      15,
      Math.min(chartPoints.length, Math.round((60 * 100) / zoom))
    );

    const slice = chartPoints.slice(-pointCount);
    return slice.map((p) => ({
      price: typeof p.price === "number" ? p.price : parseFloat(String(p.price)),
      recorded_at: p.recorded_at,
      label: p.label || "",
    }));
  }, [chartPoints, zoom]);

  // Main Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      pulseRef.current = (pulseRef.current + 0.05) % (Math.PI * 2);

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Margins
      const marginTop = 90;
      const marginBottom = 130;
      const marginLeft = 90;
      const marginRight = 100;

      const chartW = width - marginLeft - marginRight;
      const chartH = height - marginTop - marginBottom;

      if (chartW <= 0 || chartH <= 0 || visiblePoints.length < 2) {
        ctx.restore();
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Min and Max prices with margin
      const prices = visiblePoints.map((p) => p.price);
      if (currentPrice !== null) prices.push(currentPrice);

      let minP = Math.min(...prices);
      let maxP = Math.max(...prices);

      if (minP === maxP) {
        minP -= 0.001;
        maxP += 0.001;
      }

      const priceCenter = (minP + maxP) / 2;
      const adjustedRange = (maxP - minP) * 1.3 * (100 / zoom);
      minP = priceCenter - adjustedRange / 2;
      maxP = priceCenter + adjustedRange / 2;

      const getX = (idx: number) => {
        return marginLeft + (idx / (visiblePoints.length - 1)) * chartW;
      };

      const getY = (val: number) => {
        return marginTop + chartH - ((val - minP) / adjustedRange) * chartH;
      };

      // 1. Grid Lines (Horizontal & Price labels on right)
      const gridLevels = 6;
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0, 146, 184, 0.12)";
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.font = "11px var(--font-albert-sans), sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      for (let i = 0; i <= gridLevels; i++) {
        const y = marginTop + (i / gridLevels) * chartH;
        const priceVal = maxP - (i / gridLevels) * adjustedRange;

        // Horizontal dashed line
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(marginLeft, y);
        ctx.lineTo(width - marginRight, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Right price label
        ctx.fillText(formatPrice(priceVal), width - marginRight + 12, y);
      }

      // 2. Vertical Grid Lines & Time labels along bottom
      const timeSteps = 5;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      for (let i = 0; i <= timeSteps; i++) {
        const ptIdx = Math.floor((i / timeSteps) * (visiblePoints.length - 1));
        const x = getX(ptIdx);
        const pt = visiblePoints[ptIdx];

        if (pt) {
          ctx.setLineDash([3, 6]);
          ctx.beginPath();
          ctx.moveTo(x, marginTop);
          ctx.lineTo(x, marginTop + chartH);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillText(formatTime(pt.recorded_at), x, marginTop + chartH + 10);
        }
      }

      // 3. Render Chart (Area or Candles)
      if (chartType === "area") {
        // Area Gradient under the line
        const gradient = ctx.createLinearGradient(0, marginTop, 0, marginTop + chartH);
        gradient.addColorStop(0, "rgba(0, 229, 255, 0.32)");
        gradient.addColorStop(0.6, "rgba(0, 146, 184, 0.1)");
        gradient.addColorStop(1, "rgba(5, 51, 69, 0.0)");

        ctx.beginPath();
        ctx.moveTo(getX(0), marginTop + chartH);

        for (let i = 0; i < visiblePoints.length; i++) {
          const x = getX(i);
          const y = getY(visiblePoints[i].price);
          if (i === 0) {
            ctx.lineTo(x, y);
          } else {
            // Smooth bezier control points
            const prevX = getX(i - 1);
            const prevY = getY(visiblePoints[i - 1].price);
            const midX = (prevX + x) / 2;
            ctx.bezierCurveTo(midX, prevY, midX, y, x, y);
          }
        }

        ctx.lineTo(getX(visiblePoints.length - 1), marginTop + chartH);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Stroke line
        ctx.beginPath();
        for (let i = 0; i < visiblePoints.length; i++) {
          const x = getX(i);
          const y = getY(visiblePoints[i].price);
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevX = getX(i - 1);
            const prevY = getY(visiblePoints[i - 1].price);
            const midX = (prevX + x) / 2;
            ctx.bezierCurveTo(midX, prevY, midX, y, x, y);
          }
        }
        ctx.strokeStyle = "#00E5FF";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#00E5FF";
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Candlesticks
        const candleWidth = Math.max(4, (chartW / visiblePoints.length) * 0.65);

        for (let i = 0; i < visiblePoints.length; i++) {
          const pt = visiblePoints[i];
          const x = getX(i);
          const prevPt = i > 0 ? visiblePoints[i - 1] : pt;

          const open = prevPt.price;
          const close = pt.price;
          const high = Math.max(open, close) + Math.abs(close - open) * 0.3;
          const low = Math.min(open, close) - Math.abs(close - open) * 0.3;

          const isBull = close >= open;
          const color = isBull ? "#00E676" : "#FF2E4D";

          const yHigh = getY(high);
          const yLow = getY(low);
          const yOpen = getY(open);
          const yClose = getY(close);

          // Wick
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, yHigh);
          ctx.lineTo(x, yLow);
          ctx.stroke();

          // Body
          const bodyY = Math.min(yOpen, yClose);
          const bodyH = Math.max(3, Math.abs(yClose - yOpen));

          ctx.fillStyle = isBull ? "rgba(0, 230, 118, 0.4)" : "rgba(255, 46, 77, 0.4)";
          ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyH);

          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x - candleWidth / 2, bodyY, candleWidth, bodyH);
        }
      }

      // 4. Latest Price Dot & Radar Pulsing Waves
      const lastIdx = visiblePoints.length - 1;
      const lastX = getX(lastIdx);
      const activePriceVal = currentPrice !== null ? currentPrice : visiblePoints[lastIdx].price;
      const lastY = getY(activePriceVal);

      // Radar pulse waves
      const pulseRadius = 6 + (Math.sin(pulseRef.current) + 1) * 7;
      const pulseAlpha = Math.max(0, 0.8 - (pulseRadius - 6) / 14);

      ctx.beginPath();
      ctx.arc(lastX, lastY, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 229, 255, ${pulseAlpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Solid center dot
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "#00E5FF";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 5. Horizontal Current Price Line & Right Badge
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = "rgba(0, 229, 255, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(marginLeft, lastY);
      ctx.lineTo(width - marginRight, lastY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Current Price Badge on Right Axis
      const priceText = formatPrice(activePriceVal);
      const badgeW = 75;
      const badgeH = 24;
      const badgeX = width - marginRight + 6;
      const badgeY = lastY - badgeH / 2;

      ctx.fillStyle = "#00E5FF";
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
      ctx.fill();

      ctx.fillStyle = "#053345";
      ctx.font = "bold 11px monospace, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(priceText, badgeX + badgeW / 2, lastY);

      // 6. Active Trade Markers & Expiry Lines
      const now = Date.now();
      activeTrades.forEach((trade: ActiveTradeMarker) => {
        const tradeY = getY(trade.entryPrice);
        const isBuy = trade.direction === "buy";
        const inProfit = isBuy
          ? activePriceVal >= trade.entryPrice
          : activePriceVal <= trade.entryPrice;

        const tradeColor = isBuy ? "#00E676" : "#FF2E4D";

        // Entry Strike Price Line
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = tradeColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(marginLeft, tradeY);
        ctx.lineTo(width - marginRight, tradeY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Center the trade summary on its entry line.
        const remainingSec = Math.max(0, Math.ceil((trade.expiresAt - now) / 1000));
        const estProfit = (trade.investment * (trade.payoutPercent / 100)).toFixed(2);
        const statusText =
          `${trade.direction.toUpperCase()} $${trade.investment} @ ${formatPrice(trade.entryPrice)} ` +
          `${inProfit ? `+$${estProfit}` : `-$${trade.investment}`} ${remainingSec}s`;
        const statusH = 20;
        ctx.font = "bold 10px monospace, sans-serif";
        const statusW = Math.max(
          1,
          Math.min(chartW - 16, ctx.measureText(statusText).width + 20)
        );
        const statusX = marginLeft + (chartW - statusW) / 2;
        const statusY = Math.max(
          marginTop + statusH / 2,
          Math.min(marginTop + chartH - statusH / 2, tradeY)
        );

        ctx.fillStyle = inProfit ? "#00E676" : "#FF2E4D";
        ctx.beginPath();
        ctx.roundRect(statusX, statusY, statusW, statusH, 5);
        ctx.fill();
        ctx.fillStyle = "#053345";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(statusText, statusX + statusW / 2, statusY, statusW - 12);
      });

      // 7. Interactive Crosshair & Tooltip
      if (
        hoverPos &&
        hoverPos.x >= marginLeft &&
        hoverPos.x <= width - marginRight &&
        hoverPos.y >= marginTop &&
        hoverPos.y <= marginTop + chartH
      ) {
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 1;

        // Vertical crosshair
        ctx.beginPath();
        ctx.moveTo(hoverPos.x, marginTop);
        ctx.lineTo(hoverPos.x, marginTop + chartH);
        ctx.stroke();

        // Horizontal crosshair
        ctx.beginPath();
        ctx.moveTo(marginLeft, hoverPos.y);
        ctx.lineTo(width - marginRight, hoverPos.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Tooltip Price
        const cursorPrice = maxP - ((hoverPos.y - marginTop) / chartH) * adjustedRange;
        const cBadgeW = 75;
        const cBadgeH = 20;
        ctx.fillStyle = "rgba(5, 51, 69, 0.9)";
        ctx.strokeStyle = "rgba(0, 229, 255, 0.8)";
        ctx.beginPath();
        ctx.roundRect(width - marginRight + 6, hoverPos.y - cBadgeH / 2, cBadgeW, cBadgeH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "10px monospace, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(formatPrice(cursorPrice), width - marginRight + 6 + cBadgeW / 2, hoverPos.y);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    visiblePoints,
    currentPrice,
    zoom,
    chartType,
    activeTrades,
    hoverPos,
    formatPrice,
    formatTime,
  ]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden font-albert-sans select-none"
      onMouseMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
      }}
      onMouseLeave={() => setHoverPos(null)}
    >
      {/* Live Status Overlay (Top Left) */}
      <div className="absolute left-28 top-6 z-20 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#0092B8]/40 bg-[#053345]/80 backdrop-blur shadow-md">
          {isWsConnected ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#00E676]">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E676] opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-[#00E676]" />
              </span>
              <Wifi className="size-3.5" />
              <span>LIVE WS</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#FFB300]">
              <WifiOff className="size-3.5 animate-pulse" />
              <span>Connecting...</span>
            </div>
          )}

          {selectedAsset && (
            <>
              <div className="h-3 w-[1px] bg-white/20" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-wide">
                  {selectedAsset.symbol}
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

      {/* HTML5 Canvas */}
      <canvas ref={canvasRef} className="size-full block" />
    </div>
  );
}
