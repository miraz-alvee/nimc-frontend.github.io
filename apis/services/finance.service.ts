import axiosApiInstance from "../apiAxiosInstance";
import type {
  WalletBalance,
  DepositRequest,
  DepositResult,
  PaginatedPaymentList,
  WithdrawalRequest,
} from "../types/finance.types";

export const financeService = {
  /**
   * GET /api/finance/balance/
   * Retrieve available wallet balance, currency, and connected broker status
   */
  async getBalance(): Promise<WalletBalance> {
    const response = await axiosApiInstance.get<WalletBalance>("/api/finance/balance/");
    return response.data;
  },

  /**
   * POST /api/finance/deposits/
   * Initiate a deposit via card, bank, or crypto
   */
  async createDeposit(payload: DepositRequest): Promise<DepositResult> {
    const response = await axiosApiInstance.post<DepositResult>("/api/finance/deposits/", payload);
    return response.data;
  },

  /**
   * GET /api/finance/payments/
   * Retrieve paginated history of transactions (deposits, withdrawals)
   */
  async getPayments(page = 1): Promise<PaginatedPaymentList> {
    const response = await axiosApiInstance.get<PaginatedPaymentList>("/api/finance/payments/", {
      params: { page },
    });
    return response.data;
  },

  /**
   * POST /api/finance/withdrawals/
   * Request a fund withdrawal to specified destination
   */
  async createWithdrawal(payload: WithdrawalRequest): Promise<DepositResult> {
    const response = await axiosApiInstance.post<DepositResult>("/api/finance/withdrawals/", payload);
    return response.data;
  },
};
