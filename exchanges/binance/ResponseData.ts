import { type ExchangeOrderStatus, type TransactionType } from './Consts';

export interface OrderResponseData {
  orderId: number
  price: string
  origQty: string
  avgPrice: string
  executedQty: string
  updateTime: number
  clientOrderId: string
  type: string
  status: ExchangeOrderStatus
  symbol: string
  side: string
  fills?: OrderTrade[]
}

export interface TransactionResponseData {
  id: string
  amount: string
  coin: string
  address: string
  network: string
  addressTag: string
  txId: string
  status: number
  insertTime: number
}

export interface Fee {
  commissionAsset: string
  commission: string
}

export interface OrderTrade {
  commissionAsset: string
  qty: string
  price: string
  commission: string
}

// WS
export interface WsAccountConfigData {
  ac: AccountConfig
}

export interface AccountConfig {
  s: string
  l: number
}

export interface WsAccountData {
  m: TransactionType // Event reason type
  B: WsBalanceData[] // Balances
}

export interface WsBalanceData {
  a: string // Asset
  wb: string // Wallet balance
  cw: string // Cross wallet balance
  bc: string // Balance Change except PnL and Commission
}

export interface WsKlineData {
  t: number
  s: string
  i: string
  o: number
  c: number
  h: number
  l: number
  v: number
  q: number
  T: number
}

export interface WsTradeData {
  s: string
  p: number
  T: number
}

export interface WsFutureOrderbookData {
  s: string
  b: OrderbookToBeUpdated // Bids to be updated [Price Level to be, Quantity]
  a: OrderbookToBeUpdated // Asks to be updated
}

export interface WsSpotOrderbookData {
  lastUpdateId: number
  bids: OrderbookToBeUpdated // Bids to be updated [Price Level to be, Quantity]
  asks: OrderbookToBeUpdated // Asks to be updated
}

export interface WsOrderData {
  s: string // Symbol
  S: string // Side
  o: string // Order type
  q: string // Original Quantity
  p: string // Original price
  ap: string // Average price
  z: string // Order Filled Accumulated Quantity
  l: string // Order Last Filled Quantity
  X: ExchangeOrderStatus // Order status
  i: number // OrderId
  ps: string // Position side
  rp: string // Realized Profit of the trade
  c: string // Client Order Id
  T: number // Order Trade Time,
  n: string // Commission, will not push if no commission
  N: string // Commission asset
  L: string // Last executed price
}

export type OrderbookToBeUpdated = Array<[string, string]>

// spot
export interface WsTransactionData {
  a: string // Asset
  d: string // Balance Delta
}

export interface WsSpotBalance {
  a: string // Asset
  f: string // Free
  l: string // Lock
}
