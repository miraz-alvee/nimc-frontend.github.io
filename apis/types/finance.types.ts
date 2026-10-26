export type MethodAc1Enum = "card" | "bank" | "crypto";

export type PaymentMethodEnum = "card" | "bank" | "crypto" | "internal";

export type PaymentStatusEnum = "pending" | "completed" | "failed" | "cancelled";

export type KindEnum = "deposit" | "withdrawal" | "opening";

export interface WalletBalance {
  available_balance: string;
  currency: string;
  broker: string;
  broker_connected: boolean;
  broker_balance: string | null;
}

export interface Payment {
  id: number;
  kind: KindEnum;
  amount: string;
  status: PaymentStatusEnum;
  method: PaymentMethodEnum;
  destination: string;
  note: string;
  reference: string;
  created_at: string;
}

export interface DepositRequest {
  amount: string;
  method: MethodAc1Enum;
  note?: string;
}

export interface WithdrawalRequest {
  amount: string;
  method: MethodAc1Enum;
  destination: string;
}

export interface DepositResult {
  available_balance: string;
  currency: string;
  broker: string;
  broker_connected: boolean;
  broker_balance: string | null;
  payment: Payment;
}

export interface PaginatedPaymentList {
  count: number;
  next: string | null;
  previous: string | null;
  results: Payment[];
}
