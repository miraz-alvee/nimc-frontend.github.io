import { LeftSidebar } from "@/components/trade/left-sidebar";
import { RightSidebar } from "@/components/trade/right-sidebar";
import { TopBar } from "@/components/trade/top-bar";
import { TradingProvider } from "@/components/trade/trading-context";
import { LiveTradingChart } from "@/components/trade/chart/live-trading-chart";

export default function Home() {
  return (
    <TradingProvider>
   
      <main className="relative h-screen w-full overflow-hidden bg-cover bg-center bg-no-repeat font-albert-sans select-none"
         style={{ backgroundImage: "url('/images/trade-bg-image.png')" }}>
      
        {/* Full-screen Live Trading Canvas Chart connected via WebSocket */}
        <LiveTradingChart />

        {/* UI Overlay Panels */}
        <LeftSidebar />
        <TopBar />
        <RightSidebar />
      </main>
    </TradingProvider>
  );
}
