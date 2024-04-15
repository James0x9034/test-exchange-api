import { type OrderStatus } from '../../libs/Consts';
import { type ExchangeOrderStatus, type MarginMode } from './Consts';

export interface GetBusinessBillResponseData {
  result: BusinessBill[]
  lastEndId: string // endId in doc
}

export interface BusinessBill {
  id: string
  marginCoin: string
  business: string
  cTime: string
}

export interface PositionResponseData {
  symbol: string
  leverage: number
  marginMode: MarginMode
  holdSide: string
  total: string
  averageOpenPrice: string
}

export interface PlaceBatchOrderResponseData {
  orderInfo: OrderInfo[]
  failure: OrderInfo[]
}

export interface OrderResponseData {
  orderId: string
  price: number
  size: number
  priceAvg: number
  filledQty: number
  cTime: number
  clientOid: string
  status: ExchangeOrderStatus
  fee: number
  state: string
}

export interface BalanceResponseData {
  marginCoin: string
  crossMaxAvailable: string
  equity: string
}

interface OrderInfo {
  orderId: string
  clientOid: string
  errorMsg?: string
  errorCode?: string
}

// spot
export interface WithdrawResponseData {
  orderId: string
  clientOrderId: string
}

export interface SpotOrderResponseData {
  side: string
  orderType: string
  symbol: string
  feeDetail: string
  price: string
  executedPrice: string
  quantity: string
  fillQuantity: string
  fillPrice: string
  orderId: string
  clientOrderId: string
  status: ExchangeOrderStatus
}

export interface ExchangeTransactionResponseData {
  id: string
  amount: string
  coin: string
  toAddress: string
  chain: string
  txId: string
  status: string
  uTime: string
  fee: string | number
}

export interface DepositResponseData {
  address: string
  chain: string
  coin: string
  tag: string
  url: string
  network?: string
}

export interface AccountResponseData {
  coinName: string
  available: string
  lock: string
}

export interface TickerResponseData {
  symbol: string
  close: string
}

export interface KlineResponseData {
  ts: string
  open: string
  high: string
  low: string
  close: string
  quoteVol: string
}

// format

export interface FormattedExchangeOrder {
  orderId?: string
  clientOrderId: string
  status: OrderStatus
  msg?: string
  code?: string
}

// ws
export interface WsBalanceData {
  marginCoin: string
  available: string
  equity: string
  coinName?: string
  lock: string
}

export interface WsOrderData {
  instId: string
  orderFee: OrderFee[]
  side: string
  ordType: string
  sz: string
  px: string
  avgPx: string
  accFillSz: string
  status: string
  ordId: string
  posSide: string
  pnl: string
  clOrdId: string
  fillTime: string
  lever: string
}

export interface OrderFee {
  feeCcy: string
  fee: string
}

export type WsTradeData = [
  fillTime: string,
  price: string,
  size: string,
  side: string
]

export type WsKlineData = [
  ts: string,
  o: string,
  h: string,
  l: string,
  c: string,
  baseVol: string
]

export type SnapshotOrderbook = [depthPrice: string, size: string]

// error

export interface ErrorResponse {
  code: number | string
  msg: string
}
