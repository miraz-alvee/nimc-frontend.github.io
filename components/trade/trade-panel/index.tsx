"use client";

import { useState } from "react";
import { StepperBox } from "./stepper-box";

const pad = (n: number) => String(n).padStart(2, "0");
const formatTime = (s: number) =>
  `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;

export function TradePanel() {
  const [investment, setInvestment] = useState(5);
  const [seconds, setSeconds] = useState(30);

  const place = (direction: "sell" | "buy") => {
    console.log({ direction, investment, seconds });
  };

  return (
    <div className="flex items-stretch gap-2.5 font-albert-sans select-none">
      <StepperBox
        side="left"
        label="Investment"
        value={`$${investment}`}
        onPlus={() => setInvestment((v) => v + 1)}
        onMinus={() => setInvestment((v) => Math.max(1, v - 1))}
      />

      <div className="flex h-[74px] w-[500px] overflow-hidden rounded-2xl border border-[#0092B8] bg-[#031d27]/90 backdrop-blur shadow-lg">
        <button
          type="button"
          onClick={() => place("sell")}
          className="group relative flex flex-1 items-center justify-center gap-3 bg-gradient-to-r from-[#240407] via-[#3d080d] to-[#240407] border-r border-[#0092B8]/60 hover:brightness-125 active:scale-[0.99] transition-all cursor-pointer overflow-hidden"
        >
          <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex size-6.5 items-center justify-center rounded-full border-2 border-[#FF2E4D] text-[#FF2E4D]">
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
          <span className="relative text-2xl font-bold tracking-wider text-[#FF2E4D]">
            SELL
          </span>
        </button>

        <button
          type="button"
          onClick={() => place("buy")}
          className="group relative flex flex-1 items-center justify-center gap-3 bg-gradient-to-r from-[#031c10] via-[#06331c] to-[#031c10] hover:brightness-125 active:scale-[0.99] transition-all cursor-pointer overflow-hidden"
        >
          <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex size-6.5 items-center justify-center rounded-full border-2 border-[#00E676] text-[#00E676]">
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
          </div>
          <span className="relative text-2xl font-bold tracking-wider text-[#00E676]">
            BUY
          </span>
        </button>
      </div>

      <StepperBox
        side="right"
        label="Auto Close"
        value={formatTime(seconds)}
        onPlus={() => setSeconds((v) => v + 30)}
        onMinus={() => setSeconds((v) => Math.max(30, v - 30))}
      />
    </div>
  );
}
