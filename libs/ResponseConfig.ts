import {
  ExchangeMode,
  OrderStatus
} from './Consts';

export interface ExchangeErrorResponse {
  code?: string;
  msg?: string;
}

export interface Fee {
  commission: number | string;
  commissionAsset: string;
}

export interface GetOrderTradesResponse {
  id: string;
  orderId: string;
  symbol: string;
  executedPrice: number;
  executedQuantity: number;
  fee: number;
  feeCurrency: string;
  isMaker: number;
  updatedAt: number;
}

export interface FormattedWithdrawalTransaction {
  id: string;
  amount: number | string;
  fee: number;
  coin: string;
  address: string;
  addressTag?: string;
  txid: string;
  network?: string;
  updatedAt: string;
  status: string;
}

export interface FormattedDepositTransaction {
  id: string;
  amount: string | number;
  coin: string;
  address?: string;
  network?: string;
  addressTag?: string;
  txid: string;
  status: string;
  createdAt?: string;
  updatedAt: string | number;
  fee: number | string;
}

export interface FormattedDepositAddress {
  address: string;
  network?: string;
  coin: string;
  tag: string;
}

export interface OrderResponse {
  orderId: string;
  clientOrderId?: string;
  status: string;
  code?: string;
  msg?: string;
}

export interface FormattedTrade {
  price: string
  quantity: string
  time: number
}

export interface WsFormattedTrade {
  symbol: string,
  price: number,
  timestamp: number
}

export interface FormattedOrderbook {
  price: string;
  quantity: string;
}
export interface FormattedOrder {
  orderId: string | number;
  price: number | string;
  quantity?: number | string;
  executedPrice: string | number;
  executedQuantity: string | number;
  receivedQuantity: string | number;
  executedTime?: number;
  clientOrderId?: string;
  status: OrderStatus;
  fee: string | number;
  feeCurrency: string;
  orderType?: string;
  symbol?: string;
  side?: string;
}

export interface FormattedKline {
  symbol?: string;
  interval?: string;
  openTime: number | string;
  open: number | string;
  high: number | string;
  low: number | string;
  close: number | string;
  baseVolume?: number | string;
  quoteVolume?: number | string;
  volume?: number | string;
  closeTime?: string | number;
}

export interface FormattedTicker {
  symbol: string;
  price: string;
  time?: number;
}

export interface FormattedPosition {
  symbol: string;
  baseSymbol: string;
  leverage: number;
  marginType: string;
  positionSide: string;
  quantity: string;
  entryPrice: number | string;
}

export interface FormattedBalance {
  asset: string;
  balance: number | string;
  availableBalance: number | string;
}

export interface FormattedExchangeOrderBook {
  symbol: string
  bids: FormattedOrderbook[]
  asks: FormattedOrderbook[]
  updatedAt?: number,
  mode?: ExchangeMode
}
