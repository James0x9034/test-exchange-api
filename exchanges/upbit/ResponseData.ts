import {
  type ExchangeOrderState,
  type ExchangeOrderType,
  type ExchangeTransactionStatus
} from './Consts';

export interface FormattedWithdrawalBalanceInformation {
  currency: string
  withdrawalFee: number
  isCoin: boolean
  withdrawalMinimum: number
  precision: number
}

export interface TickerResponseData {
  market: string
  trade_price: number
}
export interface KlinesResponseData {
  candle_date_time_utc: Date
  market: string
  opening_price: number
  trade_price: number
  high_price: number
  low_price: number
  candle_acc_trade_volume: number
}
export interface GetWithdrawalBalanceInformationResponse {
  currency: Currency
  withdraw_limit: WithdrawLimit
}

interface Currency {
  withdraw_fee: number
  is_coin: boolean
}

interface WithdrawLimit {
  minimum: number
  fixed: number
}

export interface DepositAddressResponseData {
  currency: string
  deposit_address: string
  secondary_address: string
  success: boolean
}

export interface BalanceResponseData {
  balance: number
  locked: number
  currency: string
  avg_buy_price: number
}

export interface TransactionResponseData {
  created_at: Date
  done_at: Date
  uuid: string
  amount: number
  currency: string
  txid: string
  fee: number
  state: ExchangeTransactionStatus
  address: string
  addressTag?: string
}

export interface OrderResponseData {
  price: number | string
  volume: number | string
  uuid: string
  market: string
  side: string
  state: ExchangeOrderState
  ord_type: ExchangeOrderType
  trades: OrderTrade[]
  paid_fee: number
}

export interface OrderTrade {
  volume: number
  price: number
}

export interface FillOrderData {
  executedAmount?: number | string
  executedPrice: string | number
  executedQuantity: string | number
}

export interface PrivateTrade {
  order_uuid: string
}

export interface TradeResponseData {
  code: string
  trade_price: number
  trade_timestamp: number
}

interface OrderbookUnit {
  bid_price: number
  bid_size: number
  ask_price: number
  ask_size: number
}

export interface OrderbookResponseData {
  code: string
  orderbook_units: OrderbookUnit[]
}
