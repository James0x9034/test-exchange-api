import { type ExchangeOrderSide, type ExchangeOrderStatus } from './Consts';

export interface OrderResponseData {
  category: string
  side: ExchangeOrderSide
  reduceOnly: boolean
  cumExecQty: number
  cumExecValue: number
  avgPrice: number
  symbol: string
  orderType: string
  qty: number
  price: number
  orderStatus: ExchangeOrderStatus
  orderId: string
  orderLinkId: string
  updatedTime: number
  cumExecFee: number
}

export interface FillOrderData {
  executedAmount: number | string
  executedPrice: number
  executedQuantity: string | number
  receivedQuantity: string | number
  fee: string | number
  feeCurrency: string
}

export interface CoinBalance {
  coin: string
  availableToWithdraw: number
  walletBalance: number
  free: number
}

export interface AccountResponseData {
  accountType: string
  coin: CoinBalance[]
}

export interface KlineResponseData {
  start: number
  interval: string
  open: number
  close: number
  high: number
  low: number
  volume: number
  end: number
}

export interface WsTradeData {
  s: string
  p: number
  T: number
}

export interface WsOrderbookData {
  s: string
  b: OrderbookToBeUpdated[]
  a: OrderbookToBeUpdated[]
}

export type OrderbookToBeUpdated = [string, string]
