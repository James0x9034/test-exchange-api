import { TransferRequest } from "exchanges/binance/RequestParams";
import {
  type CancelOrderPayload,
  type GetDepositAddressPayload,
  type GetKlinesRequestPayload,
  type GetOrderPayload,
  type PlaceSpotOrderPayload,
  type WithdrawRequestPayload,
} from "../RequestConfig";
import {
  type FormattedKline,
  type FormattedOrder,
  type FormattedBalance,
  type FormattedDepositAddress,
  type FormattedTicker,
  type FormattedWithdrawalTransaction,
  type OrderResponse,
  type FormattedDepositTransaction,
} from "../ResponseConfig";
interface SpotApiInterface {
  getKlines: (payload: GetKlinesRequestPayload) => Promise<FormattedKline[]>;
  getTicker: (symbol?: string) => Promise<FormattedTicker | any>;
  getBalances: () => Promise<FormattedBalance[]>;
  getOrderDetail: (payload: GetOrderPayload) => Promise<FormattedOrder>;
  getDepositAddress: (
    payload: GetDepositAddressPayload
  ) => Promise<FormattedDepositAddress>;
  getDepositHistories: (
    coin: string,
    startTime?: number
  ) => Promise<FormattedDepositTransaction[]>;
  getWithdrawal: (id: string) => Promise<FormattedWithdrawalTransaction>;
  withdraw: (
    payload: WithdrawRequestPayload
  ) => Promise<FormattedWithdrawalTransaction>;
  placeOrder: (
    payload: PlaceSpotOrderPayload
  ) => Promise<FormattedOrder | OrderResponse>;
  cancelOrder: (payload: CancelOrderPayload) => Promise<FormattedOrder>;
  transfer?: (payload: TransferRequest) => Promise<any>;
}

export default SpotApiInterface;
