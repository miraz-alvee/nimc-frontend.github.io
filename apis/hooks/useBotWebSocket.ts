"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { tokenStorage, AUTH_STATE_CHANGE_EVENT } from "../services/auth.service";
import { botService } from "../services/bot.service";
import { botKeys } from "./useBot";
import { financeKeys } from "./useFinance";
import { authKeys } from "./useAuth";
import { tradingKeys } from "./useTrading";
import type {
  AutoBot,
  BotDecision,
  BotWsMessage,
  BotWsAction,
  PatchedAutoBotRequest,
} from "../types/bot.types";
import type { Deal } from "../types/trading.types";
import type { WalletBalance } from "../types/finance.types";
import type { UserMeResponse } from "../types/auth.types";
import { formatApiError } from "../utils/error";

export function getBotWsUrl(): string {
  if (process.env.NEXT_PUBLIC_BOT_WS_URL) {
    return process.env.NEXT_PUBLIC_BOT_WS_URL;
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (base.startsWith("https://")) {
    return base.replace("https://", "wss://") + "/ws/bots/";
  }
  if (base.startsWith("http://")) {
    return base.replace("http://", "ws://") + "/ws/bots/";
  }
  return "wss://ni-amc.sobhoy.com/ws/bots/";
}

export interface UseBotWebSocketOptions {
  enabled?: boolean;
  onDeal?: (deal: Deal) => void;
  onDecision?: (decision: BotDecision) => void;
  onBotUpdate?: (bot: AutoBot) => void;
}

export interface UseBotWebSocketReturn {
  isConnected: boolean;
  isWsAuthenticated: boolean;
  bot: AutoBot | null;
  lastDecision: BotDecision | null;
  lastDeal: Deal | null;
  isStarting: boolean;
  isStopping: boolean;
  isExecuting: boolean;
  isUpdating: boolean;
  startBot: (options?: { asset_id?: number }) => Promise<void>;
  stopBot: () => Promise<void>;
  executeCycle: () => Promise<void>;
  updateBot: (payload: PatchedAutoBotRequest) => Promise<AutoBot | undefined>;
  getStatus: () => void;
  reconnect: () => void;
}

export function useBotWebSocket(options?: UseBotWebSocketOptions): UseBotWebSocketReturn {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isWsAuthenticated, setIsWsAuthenticated] = useState(false);
  const [bot, setBot] = useState<AutoBot | null>(null);
  const [lastDecision, setLastDecision] = useState<BotDecision | null>(null);
  const [lastDeal, setLastDeal] = useState<Deal | null>(null);

  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyClosedRef = useRef(false);
  const connectRef = useRef<() => void>(() => {});

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const sendAction = useCallback((action: BotWsAction) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(action));
        return true;
      } catch (err) {
        console.warn("Failed to send bot WS action:", err);
        return false;
      }
    }
    return false;
  }, []);

  const authenticate = useCallback(() => {
    const token = tokenStorage.getAuthToken();
    if (!token) {
      setIsWsAuthenticated(false);
      return false;
    }
    return sendAction({ action: "auth", token });
  }, [sendAction]);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const msg: BotWsMessage = JSON.parse(event.data);

        if (msg.type === "bot") {
          setIsWsAuthenticated(true);

          if (msg.bot) {
            setBot(msg.bot);
            queryClient.setQueryData(botKeys.detail(), msg.bot);
            optionsRef.current?.onBotUpdate?.(msg.bot);
          }

          if (msg.decision) {
            setLastDecision(msg.decision);
            optionsRef.current?.onDecision?.(msg.decision);
          }

          if (msg.available_balance) {
            const newBal = msg.available_balance;
            queryClient.setQueryData<WalletBalance | undefined>(
              financeKeys.balance(),
              (old) =>
                old
                  ? { ...old, available_balance: newBal }
                  : {
                      available_balance: newBal,
                      currency: "USD",
                      broker: "mt5",
                      broker_connected: true,
                      broker_balance: null,
                    }
            );
            queryClient.setQueryData<UserMeResponse | undefined>(
              authKeys.me(),
              (old) => (old ? { ...old, available_balance: newBal } : old)
            );
          }

          if (msg.deal) {
            setLastDeal(msg.deal);
            optionsRef.current?.onDeal?.(msg.deal);

            // Invalidate deals list so user deals history updates
            queryClient.invalidateQueries({ queryKey: tradingKeys.all });
            queryClient.invalidateQueries({ queryKey: financeKeys.balance() });

            // Notify user of the automated trade
            toast.success(
              `🤖 Auto Bot: ${msg.deal.direction.toUpperCase()} deal opened for ${
                msg.deal.display_name || msg.deal.symbol
              } ($${msg.deal.investment})`,
              { duration: 5000, id: `bot-deal-${msg.deal.id}` }
            );
          }
        } else if (msg.type === "error") {
          console.warn("Bot WebSocket Error message:", msg.detail || msg.message);
          if (
            msg.detail?.toLowerCase().includes("token") ||
            msg.detail?.toLowerCase().includes("auth")
          ) {
            setIsWsAuthenticated(false);
          }
        }
      } catch (e) {
        console.warn("Failed to parse bot WS message:", e);
      }
    },
    [queryClient]
  );

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;
    const isEnabled = optionsRef.current?.enabled ?? true;
    if (!isEnabled) return;

    const token = tokenStorage.getAuthToken();
    if (!token) {
      setIsConnected(false);
      setIsWsAuthenticated(false);
      return;
    }

    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      isManuallyClosedRef.current = false;
      const url = getBotWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Authenticate immediately upon connection
        const curToken = tokenStorage.getAuthToken();
        if (curToken) {
          ws.send(JSON.stringify({ action: "auth", token: curToken }));
        }
      };

      ws.onmessage = handleMessage;

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsWsAuthenticated(false);
        wsRef.current = null;

        if (!isManuallyClosedRef.current && (optionsRef.current?.enabled ?? true)) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectRef.current();
          }, 3000);
        }
      };
    } catch (err) {
      console.warn("Failed to create Bot WebSocket:", err);
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectRef.current();
      }, 4000);
    }
  }, [handleMessage]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Handle Auth state change (Login / Logout)
  useEffect(() => {
    const handleAuthChange = () => {
      const token = tokenStorage.getAuthToken();
      if (token) {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          connectRef.current();
        } else if (wsRef.current.readyState === WebSocket.OPEN) {
          authenticate();
        }
      } else {
        setIsWsAuthenticated(false);
        setBot(null);
        if (wsRef.current) {
          isManuallyClosedRef.current = true;
          wsRef.current.close();
          wsRef.current = null;
        }
      }
    };

    window.addEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthChange);
    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthChange);
    };
  }, [authenticate]);

  // Connect on mount
  useEffect(() => {
    connectRef.current();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        isManuallyClosedRef.current = true;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  // Start Bot: starts repeating automatic trading decision loop
  const startBot = useCallback(
    async (startOptions?: { asset_id?: number }) => {
      const token = tokenStorage.getAuthToken();
      if (!token) {
        toast.error("Please sign in to activate Auto Bot");
        return;
      }

      setIsStarting(true);
      try {
        // Ensure WebSocket is connected & authenticated
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connectRef.current();
          await new Promise((resolve) => setTimeout(resolve, 800));
        }

        // Configure asset_id if specified
        if (startOptions?.asset_id != null) {
          sendAction({
            action: "update",
            bot: {
              is_enabled: true,
              asset_id: startOptions.asset_id,
            },
          });
          try {
            await botService.updateBot({
              is_enabled: true,
              asset_id: startOptions.asset_id,
            });
          } catch {
            // WS update is primary
          }
        }

        // Send start action to WebSocket
        const sent = sendAction({ action: "start" });
        if (!sent) {
          // Fallback to REST API
          await botService.updateBot({ is_enabled: true });
          await botService.executeBot();
        }

        toast.success("Auto Bot activated! Automatic real-time trading started.");
      } catch (err) {
        toast.error(formatApiError(err));
        throw err;
      } finally {
        setIsStarting(false);
      }
    },
    [sendAction]
  );

  // Stop Bot: turns off automatic trading decision loop
  const stopBot = useCallback(async () => {
    setIsStopping(true);
    try {
      sendAction({ action: "stop" });
      sendAction({ action: "update", bot: { is_enabled: false } });

      try {
        await botService.updateBot({ is_enabled: false });
      } catch {
        // WS is primary
      }

      setBot((prev) => (prev ? { ...prev, is_enabled: false, status: "inactive" } : null));
      queryClient.setQueryData<AutoBot | undefined>(botKeys.detail(), (prev) =>
        prev ? { ...prev, is_enabled: false, status: "inactive" } : prev
      );

      toast.success("Auto Bot deactivated.");
    } catch (err) {
      toast.error(formatApiError(err));
      throw err;
    } finally {
      setIsStopping(false);
    }
  }, [sendAction, queryClient]);

  // Execute a single cycle immediately
  const executeCycle = useCallback(async () => {
    const token = tokenStorage.getAuthToken();
    if (!token) {
      toast.error("Please sign in to execute Auto Bot");
      return;
    }

    setIsExecuting(true);
    try {
      const sent = sendAction({ action: "execute" });
      if (!sent) {
        const res = await botService.executeBot();
        const msg = res?.message || res?.detail || "Auto Bot cycle executed!";
        toast.success(msg);
      } else {
        toast.success("Executing decision cycle via real-time WebSocket...");
      }
    } catch (err) {
      toast.error(formatApiError(err));
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, [sendAction]);

  // Update bot settings in real time
  const updateBot = useCallback(
    async (payload: PatchedAutoBotRequest) => {
      setIsUpdating(true);
      try {
        sendAction({ action: "update", bot: payload });
        const updated = await botService.updateBot(payload);
        setBot(updated);
        queryClient.setQueryData(botKeys.detail(), updated);
        toast.success("Auto Bot configuration updated!");
        return updated;
      } catch (err) {
        toast.error(formatApiError(err));
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [sendAction, queryClient]
  );

  // Request current status
  const getStatus = useCallback(() => {
    sendAction({ action: "status" });
  }, [sendAction]);

  return {
    isConnected,
    isWsAuthenticated,
    bot,
    lastDecision,
    lastDeal,
    isStarting,
    isStopping,
    isExecuting,
    isUpdating,
    startBot,
    stopBot,
    executeCycle,
    updateBot,
    getStatus,
    reconnect: connect,
  };
}
