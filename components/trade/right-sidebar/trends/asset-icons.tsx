import React from "react";

export function DualFlagEU_US({ className = "size-7" }: { className?: string }) {
  return (
    <div className={`relative flex items-center shrink-0 ${className}`}>
      {/* EU Flag */}
      <div className="absolute left-0 top-0 size-5 overflow-hidden rounded-full border border-white/20 bg-[#003399]">
        <svg viewBox="0 0 100 100" className="size-full">
          <circle cx="50" cy="50" r="45" fill="#003399" />
          <circle cx="50" cy="20" r="4" fill="#FFCC00" />
          <circle cx="50" cy="80" r="4" fill="#FFCC00" />
          <circle cx="20" cy="50" r="4" fill="#FFCC00" />
          <circle cx="80" cy="50" r="4" fill="#FFCC00" />
          <circle cx="29" cy="29" r="4" fill="#FFCC00" />
          <circle cx="71" cy="29" r="4" fill="#FFCC00" />
          <circle cx="29" cy="71" r="4" fill="#FFCC00" />
          <circle cx="71" cy="71" r="4" fill="#FFCC00" />
        </svg>
      </div>
      {/* US Flag */}
      <div className="absolute left-2.5 top-1 size-5 overflow-hidden rounded-full border border-white/20 shadow-sm bg-[#B22234]">
        <svg viewBox="0 0 7410 3900" className="size-full">
          <rect width="7410" height="3900" fill="#b22234" />
          <path d="M0,450H7410M0,1050H7410M0,1650H7410M0,2250H7410M0,2850H7410M0,3450H7410" stroke="#fff" strokeWidth="300" />
          <rect width="2964" height="2100" fill="#3c3b6e" />
          <circle cx="1482" cy="1050" r="600" fill="#fff" opacity="0.8" />
        </svg>
      </div>
    </div>
  );
}

export function DualFlagGB_US({ className = "size-7" }: { className?: string }) {
  return (
    <div className={`relative flex items-center shrink-0 ${className}`}>
      {/* UK Flag */}
      <div className="absolute left-0 top-0 size-5 overflow-hidden rounded-full border border-white/20 bg-[#012169]">
        <svg viewBox="0 0 60 30" className="size-full">
          <clipPath id="uk-clip">
            <path d="M0,0 v30 h60 v-30 z"/>
          </clipPath>
          <g clipPath="url(#uk-clip)">
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#c8102e" strokeWidth="2"/>
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
            <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6"/>
          </g>
        </svg>
      </div>
      {/* US Flag */}
      <div className="absolute left-2.5 top-1 size-5 overflow-hidden rounded-full border border-white/20 shadow-sm bg-[#B22234]">
        <svg viewBox="0 0 7410 3900" className="size-full">
          <rect width="7410" height="3900" fill="#b22234" />
          <path d="M0,450H7410M0,1050H7410M0,1650H7410M0,2250H7410M0,2850H7410M0,3450H7410" stroke="#fff" strokeWidth="300" />
          <rect width="2964" height="2100" fill="#3c3b6e" />
          <circle cx="1482" cy="1050" r="600" fill="#fff" opacity="0.8" />
        </svg>
      </div>
    </div>
  );
}

export function DualFlagUS_JP({ className = "size-7" }: { className?: string }) {
  return (
    <div className={`relative flex items-center shrink-0 ${className}`}>
      {/* US Flag */}
      <div className="absolute left-0 top-0 size-5 overflow-hidden rounded-full border border-white/20 bg-[#B22234]">
        <svg viewBox="0 0 7410 3900" className="size-full">
          <rect width="7410" height="3900" fill="#b22234" />
          <path d="M0,450H7410M0,1050H7410M0,1650H7410M0,2250H7410M0,2850H7410M0,3450H7410" stroke="#fff" strokeWidth="300" />
          <rect width="2964" height="2100" fill="#3c3b6e" />
        </svg>
      </div>
      {/* JP Flag */}
      <div className="absolute left-2.5 top-1 size-5 overflow-hidden rounded-full border border-white/20 shadow-sm bg-white">
        <svg viewBox="0 0 900 600" className="size-full">
          <rect width="900" height="600" fill="#ffffff" />
          <circle cx="450" cy="300" r="180" fill="#bc002d" />
        </svg>
      </div>
    </div>
  );
}

export function DualFlagUS_CH({ className = "size-7" }: { className?: string }) {
  return (
    <div className={`relative flex items-center shrink-0 ${className}`}>
      {/* US Flag */}
      <div className="absolute left-0 top-0 size-5 overflow-hidden rounded-full border border-white/20 bg-[#B22234]">
        <svg viewBox="0 0 7410 3900" className="size-full">
          <rect width="7410" height="3900" fill="#b22234" />
          <path d="M0,450H7410M0,1050H7410M0,1650H7410M0,2250H7410M0,2850H7410M0,3450H7410" stroke="#fff" strokeWidth="300" />
          <rect width="2964" height="2100" fill="#3c3b6e" />
        </svg>
      </div>
      {/* Swiss Flag */}
      <div className="absolute left-2.5 top-1 size-5 overflow-hidden rounded-full border border-white/20 shadow-sm bg-[#D52B1E]">
        <svg viewBox="0 0 32 32" className="size-full">
          <rect width="32" height="32" fill="#D52B1E" />
          <rect x="13" y="6" width="6" height="20" fill="#fff" />
          <rect x="6" y="13" width="20" height="6" fill="#fff" />
        </svg>
      </div>
    </div>
  );
}

export function EthereumIcon({ className = "size-7" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-lg border border-white/10 bg-[#0d1217] shadow-xs shrink-0 ${className}`}
    >
      <svg className="size-4 text-cyan-200" viewBox="0 0 784.37 1277.39" fill="currentColor">
        <polygon points="392.07,0 383.5,29.11 383.5,873.74 392.07,882.29 784.13,650.54" fill="#8C8C8C" />
        <polygon points="392.07,0 0,650.54 392.07,882.29 392.07,472.33" fill="#E6E6E6" />
        <polygon points="392.07,956.52 387.24,962.41 387.24,1263.28 392.07,1277.38 784.37,724.89" fill="#8C8C8C" />
        <polygon points="392.07,1277.38 392.07,956.52 0,724.89" fill="#E6E6E6" />
      </svg>
    </div>
  );
}

export function BitcoinIcon({ className = "size-7" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-lg border border-white/10 bg-[#12110c] shadow-xs shrink-0 ${className}`}
    >
      <span className="font-bold text-[#F7931A] text-sm leading-none select-none">₿</span>
    </div>
  );
}

export function SmartyIcon({ className = "size-7" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-lg border border-white/10 bg-[#061816] shadow-xs shrink-0 ${className}`}
    >
      <svg className="size-4 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2" />
        <path d="M8 20H6a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h4a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2" />
      </svg>
    </div>
  );
}

export function GoldIngotIcon({ className = "size-7" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-linear-to-br from-[#ffdf79] via-[#e5a93b] to-[#b37a1c] border border-[#ffeaa7]/50 shadow-xs shrink-0 ${className}`}
    />
  );
}

export function BrentOilIcon({ className = "size-7" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-linear-to-br from-[#434b52] via-[#24292e] to-[#111315] border border-white/15 shadow-xs shrink-0 ${className}`}
    />
  );
}

export function SilverIngotIcon({ className = "size-7" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-linear-to-br from-[#ffffff] via-[#d5dbe0] to-[#9aa0a6] border border-white/40 shadow-xs shrink-0 ${className}`}
    />
  );
}

export function DefaultAssetIcon({ className = "size-7" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-lg border border-[#0092B8]/40 bg-[#002838] shadow-xs shrink-0 text-[#00E5FF] text-xs font-semibold ${className}`}
    >
      $
    </div>
  );
}

/**
 * Top-level static component to render the correct asset icon based on symbol or name
 */
export function AssetIcon({
  symbol = "",
  className = "size-7",
}: {
  symbol?: string;
  className?: string;
}) {
  const s = symbol.toUpperCase();

  if (s.includes("EUR") && s.includes("USD")) return <DualFlagEU_US className={className} />;
  if (s.includes("GBP") && s.includes("USD")) return <DualFlagGB_US className={className} />;
  if (s.includes("USD") && s.includes("JPY")) return <DualFlagUS_JP className={className} />;
  if (s.includes("USD") && s.includes("CHF")) return <DualFlagUS_CH className={className} />;
  if (s.includes("ALTCOIN") || s.includes("ETH")) return <EthereumIcon className={className} />;
  if (s.includes("CRYPTO") || s.includes("BTC")) return <BitcoinIcon className={className} />;
  if (s.includes("SMARTY")) return <SmartyIcon className={className} />;
  if (s.includes("GOLD") || s.includes("XAU")) return <GoldIngotIcon className={className} />;
  if (s.includes("OIL") || s.includes("BRENT")) return <BrentOilIcon className={className} />;
  if (s.includes("SILVER") || s.includes("XAG")) return <SilverIngotIcon className={className} />;

  return <DefaultAssetIcon className={className} />;
}
